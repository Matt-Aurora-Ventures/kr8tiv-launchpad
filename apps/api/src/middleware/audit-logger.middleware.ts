import { Request, Response, NextFunction } from 'express';
import { maskSecret, maskAddress, sanitizeForLogging } from '../utils/secrets';

/**
 * Audit logging middleware for security-sensitive operations
 * 
 * FEATURES:
 * - Logs all admin/sensitive operations
 * - Captures request metadata (IP, user agent, timestamp)
 * - Sanitizes sensitive data before logging
 * - Structured JSON format for log aggregation
 */

export interface AuditLogEntry {
  timestamp: string;
  level: 'INFO' | 'WARN' | 'ERROR' | 'CRITICAL';
  action: string;
  method: string;
  path: string;
  ip: string;
  userAgent: string;
  userId?: string;
  walletAddress?: string;
  requestId?: string;
  statusCode?: number;
  duration?: number;
  details?: Record<string, unknown>;
  error?: string;
}

// In-memory log buffer (in production, send to external logging service)
const auditLogs: AuditLogEntry[] = [];
const MAX_LOG_BUFFER = 10000;

/**
 * Get client IP from request
 */
function getClientIP(req: Request): string {
  const forwardedFor = req.headers['x-forwarded-for'];
  if (forwardedFor) {
    const ips = (typeof forwardedFor === 'string' ? forwardedFor : forwardedFor[0])
      .split(',')
      .map(ip => ip.trim());
    return ips[0];
  }
  return req.ip || req.socket.remoteAddress || 'unknown';
}

/**
 * Generate unique request ID
 */
function generateRequestId(): string {
  return Date.now().toString(36) + '-' + Math.random().toString(36).substr(2, 9);
}

/**
 * Determine log level based on request characteristics
 */
function determineLogLevel(req: Request, statusCode: number): AuditLogEntry['level'] {
  if (statusCode >= 500) return 'ERROR';
  if (statusCode >= 400) return 'WARN';
  if (req.path.includes('/admin')) return 'INFO';
  return 'INFO';
}

/**
 * Extract action name from request
 */
function extractAction(req: Request): string {
  const method = req.method;
  const path = req.path;
  
  // Map common paths to action names
  if (path.includes('/admin/automation')) return 'admin.automation';
  if (path.includes('/admin')) return 'admin.access';
  if (path.includes('/launch')) return 'token.launch';
  if (path.includes('/staking/stake')) return 'staking.stake';
  if (path.includes('/staking/unstake')) return 'staking.unstake';
  if (path.includes('/staking')) return 'staking.query';
  if (path.includes('/tokens')) return 'tokens.query';
  
  return method.toLowerCase() + '.' + path.replace(/\//g, '.').replace(/^\./, '');
}

/**
 * Log an audit entry
 */
export function logAudit(entry: Partial<AuditLogEntry>): void {
  const fullEntry: AuditLogEntry = {
    timestamp: new Date().toISOString(),
    level: entry.level || 'INFO',
    action: entry.action || 'unknown',
    method: entry.method || 'UNKNOWN',
    path: entry.path || '/',
    ip: entry.ip || 'unknown',
    userAgent: entry.userAgent || 'unknown',
    ...entry,
  };
  
  // Sanitize any sensitive data in details
  if (fullEntry.details) {
    fullEntry.details = sanitizeForLogging(fullEntry.details as Record<string, unknown>);
  }
  
  // Add to buffer
  auditLogs.push(fullEntry);
  if (auditLogs.length > MAX_LOG_BUFFER) {
    auditLogs.shift(); // Remove oldest entry
  }
  
  // Also output to console in structured format
  const logLine = JSON.stringify(fullEntry);
  
  switch (fullEntry.level) {
    case 'CRITICAL':
    case 'ERROR':
      console.error('[AUDIT]', logLine);
      break;
    case 'WARN':
      console.warn('[AUDIT]', logLine);
      break;
    default:
      console.log('[AUDIT]', logLine);
  }
}

/**
 * Log a security event (failed auth, blocked request, etc.)
 */
export function logSecurityEvent(
  event: string,
  details: Record<string, unknown>,
  level: AuditLogEntry['level'] = 'WARN'
): void {
  logAudit({
    level,
    action: 'security.' + event,
    method: 'SYSTEM',
    path: 'N/A',
    ip: (details.ip as string) || 'unknown',
    userAgent: (details.userAgent as string) || 'unknown',
    details: sanitizeForLogging(details),
  });
}

/**
 * Get recent audit logs (for admin dashboard)
 */
export function getRecentLogs(
  limit: number = 100,
  filter?: {
    level?: AuditLogEntry['level'];
    action?: string;
    ip?: string;
    since?: Date;
  }
): AuditLogEntry[] {
  let logs = [...auditLogs];
  
  if (filter) {
    if (filter.level) {
      logs = logs.filter(l => l.level === filter.level);
    }
    if (filter.action) {
      logs = logs.filter(l => l.action.includes(filter.action));
    }
    if (filter.ip) {
      logs = logs.filter(l => l.ip === filter.ip);
    }
    if (filter.since) {
      const sinceTime = filter.since.getTime();
      logs = logs.filter(l => new Date(l.timestamp).getTime() >= sinceTime);
    }
  }
  
  return logs.slice(-limit).reverse();
}

/**
 * Audit logging middleware
 * Attaches to response to capture status code and timing
 */
export function auditLogger(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const startTime = Date.now();
  const requestId = generateRequestId();
  
  // Attach request ID for correlation
  (req as Request & { requestId: string }).requestId = requestId;
  res.setHeader('X-Request-ID', requestId);
  
  // Capture original end function
  const originalEnd = res.end;
  
  // Override end to log after response
  res.end = function(this: Response, ...args: Parameters<typeof originalEnd>): ReturnType<typeof originalEnd> {
    const duration = Date.now() - startTime;
    const statusCode = res.statusCode;
    
    // Log audit entry
    logAudit({
      level: determineLogLevel(req, statusCode),
      action: extractAction(req),
      method: req.method,
      path: req.path,
      ip: getClientIP(req),
      userAgent: req.headers['user-agent'] || 'unknown',
      requestId,
      statusCode,
      duration,
      details: {
        query: Object.keys(req.query).length > 0 ? sanitizeForLogging(req.query as Record<string, unknown>) : undefined,
        bodyKeys: req.body ? Object.keys(req.body) : undefined,
      },
    });
    
    return originalEnd.apply(this, args);
  };
  
  next();
}

/**
 * Audit logger specifically for sensitive operations
 * Logs more details including request body
 */
export function sensitiveOperationLogger(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const ip = getClientIP(req);
  
  logAudit({
    level: 'INFO',
    action: 'sensitive.' + extractAction(req),
    method: req.method,
    path: req.path,
    ip,
    userAgent: req.headers['user-agent'] || 'unknown',
    details: {
      headers: {
        authorization: req.headers.authorization ? '[REDACTED]' : undefined,
        'x-api-key': req.headers['x-api-key'] ? '[REDACTED]' : undefined,
      },
      body: req.body ? sanitizeForLogging(req.body) : undefined,
    },
  });
  
  next();
}

export default auditLogger;
