/**
 * Security Middleware Exports
 * 
 * This module exports all security-related middleware for the KR8TIV Launchpad API.
 */

// Security headers (Helmet-based)
export { 
  securityHeaders, 
  additionalSecurityHeaders 
} from "./security-headers.middleware";

// IP filtering and blocking
export {
  ipFilter,
  strictIpFilter,
  blockIP,
  unblockIP,
  allowIP,
  isBlocked,
  isAllowed,
  getBlockedIPs,
  getClientIP,
} from "./ip-filter.middleware";

// Input validation
export {
  validateBody,
  validateQuery,
  validateParams,
  containsSqlInjection,
  containsXss,
  sanitizeString,
  commonSchemas,
} from "./input-validation.middleware";

// Audit logging
export {
  auditLogger,
  sensitiveOperationLogger,
  logAudit,
  logSecurityEvent,
  getRecentLogs,
} from "./audit-logger.middleware";

// Default export with all middleware
export default {
  // Headers
  securityHeaders: require("./security-headers.middleware").securityHeaders,
  additionalSecurityHeaders: require("./security-headers.middleware").additionalSecurityHeaders,
  
  // IP Filter
  ipFilter: require("./ip-filter.middleware").ipFilter,
  strictIpFilter: require("./ip-filter.middleware").strictIpFilter,
  
  // Validation
  validateBody: require("./input-validation.middleware").validateBody,
  validateQuery: require("./input-validation.middleware").validateQuery,
  validateParams: require("./input-validation.middleware").validateParams,
  
  // Audit
  auditLogger: require("./audit-logger.middleware").auditLogger,
  sensitiveOperationLogger: require("./audit-logger.middleware").sensitiveOperationLogger,
};
