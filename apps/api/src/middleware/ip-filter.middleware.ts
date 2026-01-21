import { Request, Response, NextFunction } from 'express';

/**
 * IP-based request filtering middleware
 * 
 * Features:
 * - IP blocklist for known bad actors
 * - Rate-based auto-blocking
 * - Allowlist for trusted IPs (bypasses rate limits)
 * - Support for X-Forwarded-For header (proxy/load balancer)
 * 
 * SECURITY NOTES:
 * - Blocklist entries expire after configurable TTL
 * - Auto-blocking triggered by excessive requests
 * - In production, consider using Redis for distributed blocking
 */

interface BlockedEntry {
  ip: string;
  reason: string;
  blockedAt: Date;
  expiresAt: Date;
}

interface RequestCount {
  count: number;
  firstRequest: Date;
}

// In-memory stores (use Redis in production for distributed systems)
const blockedIPs = new Map<string, BlockedEntry>();
const allowedIPs = new Set<string>();
const requestCounts = new Map<string, RequestCount>();

// Configuration
const config = {
  // Time window for counting requests (ms)
  windowMs: 60 * 1000, // 1 minute
  
  // Max requests before auto-block
  maxRequestsPerWindow: 1000,
  
  // Block duration (ms)
  blockDurationMs: 60 * 60 * 1000, // 1 hour
  
  // Clean up interval (ms)
  cleanupIntervalMs: 5 * 60 * 1000, // 5 minutes
};

/**
 * Mask IP address for logging (privacy)
 */
function maskIP(ip: string): string {
  if (ip.includes('.')) {
    // IPv4: show first two octets
    const parts = ip.split('.');
    return parts[0] + '.' + parts[1] + '.*.*';
  } else if (ip.includes(':')) {
    // IPv6: show first two segments
    const parts = ip.split(':');
    return parts[0] + ':' + parts[1] + ':****';
  }
  return '***';
}

// Cleanup expired entries periodically
setInterval(() => {
  const now = new Date();
  
  // Clean expired blocks
  for (const [ip, entry] of blockedIPs.entries()) {
    if (entry.expiresAt < now) {
      blockedIPs.delete(ip);
      console.log('[IPFilter] Unblocked expired IP: ' + maskIP(ip));
    }
  }
  
  // Clean old request counts
  for (const [ip, count] of requestCounts.entries()) {
    const age = now.getTime() - count.firstRequest.getTime();
    if (age > config.windowMs * 2) {
      requestCounts.delete(ip);
    }
  }
}, config.cleanupIntervalMs);

/**
 * Get real client IP, accounting for proxies
 */
export function getClientIP(req: Request): string {
  // Check X-Forwarded-For header (common with proxies/load balancers)
  const forwardedFor = req.headers['x-forwarded-for'];
  if (forwardedFor) {
    const ips = (typeof forwardedFor === 'string' ? forwardedFor : forwardedFor[0])
      .split(',')
      .map(ip => ip.trim());
    // First IP is the original client
    return ips[0];
  }
  
  // Check X-Real-IP (nginx proxy)
  const realIP = req.headers['x-real-ip'];
  if (realIP) {
    return typeof realIP === 'string' ? realIP : realIP[0];
  }
  
  // Fallback to req.ip (Express)
  return req.ip || req.socket.remoteAddress || 'unknown';
}

/**
 * Block an IP address
 */
export function blockIP(
  ip: string,
  reason: string,
  durationMs: number = config.blockDurationMs
): void {
  const now = new Date();
  blockedIPs.set(ip, {
    ip,
    reason,
    blockedAt: now,
    expiresAt: new Date(now.getTime() + durationMs),
  });
  console.log('[IPFilter] Blocked IP: ' + maskIP(ip) + ' - Reason: ' + reason);
}

/**
 * Unblock an IP address
 */
export function unblockIP(ip: string): boolean {
  const wasBlocked = blockedIPs.delete(ip);
  if (wasBlocked) {
    console.log('[IPFilter] Manually unblocked IP: ' + maskIP(ip));
  }
  return wasBlocked;
}

/**
 * Add IP to allowlist
 */
export function allowIP(ip: string): void {
  allowedIPs.add(ip);
  console.log('[IPFilter] Added to allowlist: ' + maskIP(ip));
}

/**
 * Remove IP from allowlist
 */
export function removeFromAllowlist(ip: string): boolean {
  return allowedIPs.delete(ip);
}

/**
 * Check if an IP is blocked
 */
export function isBlocked(ip: string): BlockedEntry | null {
  const entry = blockedIPs.get(ip);
  if (entry && entry.expiresAt > new Date()) {
    return entry;
  }
  return null;
}

/**
 * Check if an IP is allowed (bypasses rate limits)
 */
export function isAllowed(ip: string): boolean {
  return allowedIPs.has(ip);
}

/**
 * Get all currently blocked IPs (for admin)
 */
export function getBlockedIPs(): BlockedEntry[] {
  const now = new Date();
  return Array.from(blockedIPs.values())
    .filter(entry => entry.expiresAt > now)
    .map(entry => ({
      ...entry,
      ip: maskIP(entry.ip), // Mask IPs in output
    }));
}

/**
 * IP filter middleware
 */
export function ipFilter(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const ip = getClientIP(req);
  
  // Check allowlist first (skip all checks)
  if (isAllowed(ip)) {
    return next();
  }
  
  // Check if IP is blocked
  const blocked = isBlocked(ip);
  if (blocked) {
    console.log('[IPFilter] Rejected blocked IP: ' + maskIP(ip));
    res.status(403).json({
      success: false,
      error: 'Access denied',
      code: 'IP_BLOCKED',
      timestamp: new Date().toISOString(),
    });
    return;
  }
  
  // Track request count for auto-blocking
  const now = new Date();
  let count = requestCounts.get(ip);
  
  if (!count || (now.getTime() - count.firstRequest.getTime() > config.windowMs)) {
    // Start new window
    count = { count: 1, firstRequest: now };
    requestCounts.set(ip, count);
  } else {
    count.count++;
    
    // Check for abuse
    if (count.count > config.maxRequestsPerWindow) {
      blockIP(ip, 'Excessive requests (auto-blocked)');
      res.status(429).json({
        success: false,
        error: 'Too many requests - temporarily blocked',
        code: 'AUTO_BLOCKED',
        timestamp: new Date().toISOString(),
      });
      return;
    }
  }
  
  next();
}

/**
 * Strict IP filter for admin endpoints
 * Only allows explicitly allowlisted IPs
 */
export function strictIpFilter(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const ip = getClientIP(req);
  
  // In development, allow localhost
  if (process.env.NODE_ENV === 'development') {
    const localhostPatterns = ['127.0.0.1', '::1', 'localhost'];
    if (localhostPatterns.some(p => ip.includes(p))) {
      return next();
    }
  }
  
  if (!isAllowed(ip)) {
    console.log('[IPFilter] Rejected non-allowlisted IP from admin: ' + maskIP(ip));
    res.status(403).json({
      success: false,
      error: 'Access denied',
      code: 'IP_NOT_ALLOWED',
      timestamp: new Date().toISOString(),
    });
    return;
  }
  
  next();
}

export default ipFilter;
