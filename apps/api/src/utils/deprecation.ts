/**
 * Deprecation Utilities
 *
 * Helpers for marking API endpoints as deprecated and providing
 * sunset information to clients.
 *
 * Follows RFC 8594 (The "Deprecation" HTTP Header Field)
 * and draft-ietf-httpapi-deprecation-header
 */

import { Request, Response, NextFunction } from "express";

// =============================================================================
// Types
// =============================================================================

export interface DeprecationInfo {
  message: string;
  sunset?: Date;
  replacement?: string;
  documentationUrl?: string;
}

// =============================================================================
// Header Utilities
// =============================================================================

/**
 * Add deprecation warning headers to a response
 *
 * Sets the following headers:
 * - Deprecation: true (RFC 8594)
 * - X-Deprecation-Notice: Human-readable message
 * - Sunset: When the endpoint will be removed (if provided)
 * - Link: Documentation URL (if provided)
 *
 * @param res - Express response object
 * @param message - Human-readable deprecation notice
 * @param sunset - Optional date when endpoint will be removed
 */
export function addDeprecationWarning(
  res: Response,
  message: string,
  sunset?: Date
): void {
  // RFC 8594 Deprecation header
  res.setHeader("Deprecation", "true");

  // Human-readable notice
  res.setHeader("X-Deprecation-Notice", message);

  // Sunset header (when endpoint will be removed)
  if (sunset) {
    res.setHeader("Sunset", sunset.toUTCString());
  }
}

/**
 * Add full deprecation information to response
 *
 * @param res - Express response object
 * @param info - Deprecation information
 */
export function addFullDeprecationInfo(
  res: Response,
  info: DeprecationInfo
): void {
  addDeprecationWarning(res, info.message, info.sunset);

  if (info.replacement) {
    res.setHeader("X-Replacement-Endpoint", info.replacement);
  }

  if (info.documentationUrl) {
    // Link header for documentation
    res.setHeader(
      "Link",
      `<${info.documentationUrl}>; rel="deprecation"; type="text/html"`
    );
  }
}

// =============================================================================
// Middleware
// =============================================================================

/**
 * Middleware to mark an endpoint as deprecated
 *
 * Use this middleware to add deprecation headers to any endpoint.
 * The endpoint will still work, but clients will receive warnings.
 *
 * @param message - Human-readable deprecation message
 * @param sunset - Optional date when endpoint will be removed
 * @returns Express middleware
 *
 * @example
 * router.get(
 *   '/old-endpoint',
 *   deprecatedEndpoint('Use /new-endpoint instead', new Date('2025-12-31')),
 *   controller.handler
 * );
 */
export function deprecatedEndpoint(message: string, sunset?: Date) {
  return (_req: Request, res: Response, next: NextFunction): void => {
    addDeprecationWarning(res, message, sunset);
    next();
  };
}

/**
 * Middleware to mark an endpoint as deprecated with full information
 *
 * @param info - Full deprecation information
 * @returns Express middleware
 *
 * @example
 * router.get(
 *   '/old-endpoint',
 *   deprecatedEndpointFull({
 *     message: 'This endpoint is deprecated',
 *     sunset: new Date('2025-12-31'),
 *     replacement: '/api/v2/new-endpoint',
 *     documentationUrl: 'https://docs.kr8tiv.io/migration'
 *   }),
 *   controller.handler
 * );
 */
export function deprecatedEndpointFull(info: DeprecationInfo) {
  return (_req: Request, res: Response, next: NextFunction): void => {
    addFullDeprecationInfo(res, info);
    next();
  };
}

/**
 * Middleware to completely sunset (disable) an endpoint
 *
 * Returns a 410 Gone response with information about the replacement.
 *
 * @param message - Message explaining why the endpoint is gone
 * @param replacement - URL of the replacement endpoint
 * @returns Express middleware
 *
 * @example
 * router.get(
 *   '/removed-endpoint',
 *   sunsetEndpoint('This endpoint was removed in v2', '/api/v2/new-endpoint')
 * );
 */
export function sunsetEndpoint(message: string, replacement?: string) {
  return (_req: Request, res: Response): void => {
    res.status(410).json({
      success: false,
      error: message,
      replacement: replacement,
      timestamp: new Date().toISOString(),
    });
  };
}

// =============================================================================
// Deprecation Schedule Helpers
// =============================================================================

/**
 * Create a sunset date from a number of days from now
 *
 * @param days - Number of days until sunset
 * @returns Date object
 */
export function sunsetInDays(days: number): Date {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date;
}

/**
 * Create a sunset date from a number of months from now
 *
 * @param months - Number of months until sunset
 * @returns Date object
 */
export function sunsetInMonths(months: number): Date {
  const date = new Date();
  date.setMonth(date.getMonth() + months);
  return date;
}

/**
 * Standard deprecation periods for KR8TIV API
 */
export const DEPRECATION_PERIODS = {
  /** 30 days - for minor changes */
  SHORT: sunsetInDays(30),
  /** 90 days - standard deprecation period */
  STANDARD: sunsetInDays(90),
  /** 180 days - for major breaking changes */
  LONG: sunsetInDays(180),
  /** 1 year - for major version deprecations */
  MAJOR_VERSION: sunsetInMonths(12),
} as const;

export default {
  addDeprecationWarning,
  addFullDeprecationInfo,
  deprecatedEndpoint,
  deprecatedEndpointFull,
  sunsetEndpoint,
  sunsetInDays,
  sunsetInMonths,
  DEPRECATION_PERIODS,
};
