import { Request, Response, NextFunction } from "express";
import { z, ZodError, ZodSchema } from "zod";

/**
 * Input validation middleware using Zod
 */

// Dangerous patterns
const SQL_INJECTION_PATTERNS = [
  /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|TRUNCATE)\b)/i,
  /(\b(UNION|JOIN)\b.*\b(SELECT)\b)/i,
  /(--|#|\/\*)/,
  /(\b(OR|AND)\b\s+\d+\s*=\s*\d+)/i,
];

const XSS_PATTERNS = [
  /<script\b[^>]*>/i,
  /javascript:/i,
  /on\w+\s*=/i,
  /<iframe\b/i,
  /<object\b/i,
  /<embed\b/i,
  /data:\s*text\/html/i,
];

/**
 * Check string for SQL injection patterns
 */
export function containsSqlInjection(value: string): boolean {
  return SQL_INJECTION_PATTERNS.some(pattern => pattern.test(value));
}

/**
 * Check string for XSS patterns
 */
export function containsXss(value: string): boolean {
  return XSS_PATTERNS.some(pattern => pattern.test(value));
}

/**
 * Recursively check object for dangerous patterns
 */
function checkObjectForDangerousPatterns(
  obj: unknown,
  path: string = ""
): { safe: boolean; issues: string[] } {
  const issues: string[] = [];
  
  if (typeof obj === "string") {
    if (containsSqlInjection(obj)) {
      issues.push("Potential SQL injection detected at " + (path || "root"));
    }
    if (containsXss(obj)) {
      issues.push("Potential XSS detected at " + (path || "root"));
    }
  } else if (Array.isArray(obj)) {
    obj.forEach((item, index) => {
      const result = checkObjectForDangerousPatterns(item, path + "[" + index + "]");
      issues.push(...result.issues);
    });
  } else if (obj && typeof obj === "object") {
    for (const [key, value] of Object.entries(obj)) {
      const result = checkObjectForDangerousPatterns(value, path ? path + "." + key : key);
      issues.push(...result.issues);
    }
  }
  
  return { safe: issues.length === 0, issues };
}

/**
 * Calculate object depth
 */
function getObjectDepth(obj: unknown, currentDepth: number = 0): number {
  if (currentDepth > 20) return currentDepth;
  
  if (!obj || typeof obj !== "object") {
    return currentDepth;
  }
  
  if (Array.isArray(obj)) {
    if (obj.length === 0) return currentDepth + 1;
    return Math.max(...obj.map(item => getObjectDepth(item, currentDepth + 1)));
  }
  
  const values = Object.values(obj);
  if (values.length === 0) return currentDepth + 1;
  return Math.max(...values.map(value => getObjectDepth(value, currentDepth + 1)));
}

/**
 * Create validation middleware for a Zod schema
 */
export function validateBody<T extends ZodSchema>(
  schema: T,
  options: {
    checkDangerousPatterns?: boolean;
    maxDepth?: number;
  } = {}
) {
  const { checkDangerousPatterns = true, maxDepth = 10 } = options;
  
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      // Check object depth
      const depth = getObjectDepth(req.body);
      if (depth > maxDepth) {
        res.status(400).json({
          success: false,
          error: "Request body too deeply nested",
          code: "EXCESSIVE_DEPTH",
          timestamp: new Date().toISOString(),
        });
        return;
      }
      
      // Check for dangerous patterns
      if (checkDangerousPatterns) {
        const patternCheck = checkObjectForDangerousPatterns(req.body);
        if (!patternCheck.safe) {
          console.warn("[InputValidation] Dangerous patterns detected:", patternCheck.issues);
          res.status(400).json({
            success: false,
            error: "Request contains potentially dangerous content",
            code: "DANGEROUS_CONTENT",
            timestamp: new Date().toISOString(),
          });
          return;
        }
      }
      
      // Validate against schema
      const validated = schema.parse(req.body);
      req.body = validated;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json({
          success: false,
          error: "Validation failed",
          code: "VALIDATION_ERROR",
          details: error.errors.map(e => ({
            path: e.path.join("."),
            message: e.message,
          })),
          timestamp: new Date().toISOString(),
        });
        return;
      }
      next(error);
    }
  };
}

/**
 * Validate query parameters
 */
export function validateQuery<T extends ZodSchema>(schema: T) {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const patternCheck = checkObjectForDangerousPatterns(req.query);
      if (!patternCheck.safe) {
        console.warn("[InputValidation] Dangerous patterns in query:", patternCheck.issues);
        res.status(400).json({
          success: false,
          error: "Query contains potentially dangerous content",
          code: "DANGEROUS_CONTENT",
          timestamp: new Date().toISOString(),
        });
        return;
      }
      
      const validated = schema.parse(req.query);
      req.query = validated;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json({
          success: false,
          error: "Query validation failed",
          code: "VALIDATION_ERROR",
          details: error.errors.map(e => ({
            path: e.path.join("."),
            message: e.message,
          })),
          timestamp: new Date().toISOString(),
        });
        return;
      }
      next(error);
    }
  };
}

/**
 * Validate URL parameters
 */
export function validateParams<T extends ZodSchema>(schema: T) {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const validated = schema.parse(req.params);
      req.params = validated;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json({
          success: false,
          error: "Parameter validation failed",
          code: "VALIDATION_ERROR",
          details: error.errors.map(e => ({
            path: e.path.join("."),
            message: e.message,
          })),
          timestamp: new Date().toISOString(),
        });
        return;
      }
      next(error);
    }
  };
}

/**
 * Sanitize string input
 */
export function sanitizeString(input: string): string {
  return input
    .replace(/[<>]/g, "")
    .replace(/javascript:/gi, "")
    .replace(/on\w+=/gi, "")
    .trim();
}

/**
 * Common validation schemas
 */
export const commonSchemas = {
  walletAddress: z.string()
    .min(32, "Address too short")
    .max(44, "Address too long")
    .regex(/^[1-9A-HJ-NP-Za-km-z]+$/, "Invalid base58 character"),
  
  tokenMint: z.string()
    .min(32, "Mint address too short")
    .max(44, "Mint address too long")
    .regex(/^[1-9A-HJ-NP-Za-km-z]+$/, "Invalid base58 character"),
  
  uuid: z.string().uuid("Invalid UUID format"),
  
  positiveInt: z.number().int().positive(),
  
  basisPoints: z.number().int().min(0).max(10000),
  
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
  
  safeString: z.string().transform(sanitizeString),
  
  secureUrl: z.string().url().refine(
    url => process.env.NODE_ENV === "development" || url.startsWith("https://"),
    "URL must use HTTPS in production"
  ),
};

export default {
  validateBody,
  validateQuery,
  validateParams,
  containsSqlInjection,
  containsXss,
  sanitizeString,
  commonSchemas,
};
