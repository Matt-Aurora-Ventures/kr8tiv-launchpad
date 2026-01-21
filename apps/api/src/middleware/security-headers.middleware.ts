import helmet from 'helmet';
import { Request, Response, NextFunction } from 'express';

/**
 * Comprehensive security headers middleware using Helmet
 * 
 * This middleware configures all security-related HTTP headers for the API.
 * 
 * Security Headers Set:
 * - Content-Security-Policy: Prevents XSS and data injection attacks
 * - X-Content-Type-Options: Prevents MIME type sniffing
 * - X-Frame-Options: Prevents clickjacking (via frameAncestors)
 * - X-XSS-Protection: Legacy XSS protection (deprecated but still set)
 * - Strict-Transport-Security: Forces HTTPS
 * - Referrer-Policy: Controls referrer information leakage
 * - Cross-Origin-Resource-Policy: Controls cross-origin resource access
 * - Permissions-Policy: Restricts browser features
 */
export const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      // Only allow resources from same origin by default
      defaultSrc: ["'self'"],
      
      // Scripts: self and inline for wallet adapters (required for Solana wallet interactions)
      scriptSrc: ["'self'", "'unsafe-inline'"],
      
      // Styles: self and inline for dynamic styling
      styleSrc: ["'self'", "'unsafe-inline'"],
      
      // Images: self, data URIs (for inline images), HTTPS (for token images), and blobs
      imgSrc: ["'self'", "data:", "https:", "blob:"],
      
      // WebSocket and API connections
      connectSrc: [
        "'self'",
        "wss:",
        "https://api.mainnet-beta.solana.com",
        "https://api.devnet.solana.com",
        "https://api.bags.fm",
        "https://price.jup.ag",
        "https://*.helius-rpc.com",
      ],
      
      // Fonts from self and Google Fonts
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      
      // Prevent object/embed/applet
      objectSrc: ["'none'"],
      
      // Media from self only
      mediaSrc: ["'self'"],
      
      // Prevent embedding in frames
      frameSrc: ["'none'"],
      
      // Base URI restricted to self
      baseUri: ["'self'"],
      
      // Form submissions only to self
      formAction: ["'self'"],
      
      // Prevent being embedded in frames (anti-clickjacking)
      frameAncestors: ["'none'"],
      
      // Upgrade HTTP to HTTPS in production
      upgradeInsecureRequests: process.env.NODE_ENV === 'production' ? [] : null,
    },
    reportOnly: process.env.NODE_ENV === 'development', // Report-only in dev for debugging
  },
  
  // Disable for API that may need to be embedded (e.g., docs iframe)
  crossOriginEmbedderPolicy: false,
  
  // Allow cross-origin access for public API endpoints
  crossOriginResourcePolicy: { policy: "cross-origin" as const },
  
  // HTTP Strict Transport Security
  hsts: {
    maxAge: 31536000, // 1 year
    includeSubDomains: true,
    preload: true,
  },
  
  // Control referrer information
  referrerPolicy: { policy: "strict-origin-when-cross-origin" as const },
  
  // Prevent MIME type sniffing
  noSniff: true,
  
  // DNS prefetch control
  dnsPrefetchControl: { allow: false },
  
  // Don't advertise powered by Express
  hidePoweredBy: true,
  
  // IE no open
  ieNoOpen: true,
});

/**
 * Additional security headers not covered by helmet
 */
export const additionalSecurityHeaders = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Permissions Policy - restrict browser features
  res.setHeader(
    'Permissions-Policy',
    'accelerometer=(), camera=(), geolocation=(), gyroscope=(), magnetometer=(), microphone=(), payment=(), usb=()'
  );
  
  // Cache control for sensitive endpoints
  if (req.path.includes('/admin') || req.path.includes('/staking')) {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
  }
  
  // Remove potentially dangerous headers
  res.removeHeader('X-Powered-By');
  
  next();
};

export default securityHeaders;
