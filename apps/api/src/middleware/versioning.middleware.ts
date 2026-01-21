/**
 * API Versioning Middleware
 *
 * Extracts API version from requests using multiple methods:
 * 1. Accept header: application/vnd.kr8tiv.v1+json
 * 2. URL path: /v1/tokens
 * 3. Query parameter: ?version=1
 *
 * Priority: Header > Path > Query > Default
 */

import { Request, Response, NextFunction } from "express";

// =============================================================================
// Types
// =============================================================================

export interface VersionedRequest extends Request {
  apiVersion: string;
  apiVersionSource: "header" | "path" | "query" | "default";
}

// =============================================================================
// Constants
// =============================================================================

/**
 * Supported API versions
 */
export const SUPPORTED_VERSIONS = ["1", "2"] as const;

/**
 * Latest API version (for bleeding edge users)
 */
export const LATEST_VERSION = "2";

/**
 * Default API version (stable, recommended for production)
 */
export const DEFAULT_VERSION = "1";

// =============================================================================
// Version Extraction
// =============================================================================

/**
 * Extract version from Accept header
 * Format: application/vnd.kr8tiv.v{version}+json
 *
 * @param acceptHeader - The Accept header value
 * @returns Version string or null if not found
 */
function extractVersionFromHeader(acceptHeader: string): string | null {
  const match = acceptHeader.match(/vnd\.kr8tiv\.v(\d+)/);
  return match ? match[1] : null;
}

/**
 * Extract version from URL path
 * Format: /v{version}/...
 *
 * @param path - The request path
 * @returns Version string or null if not found
 */
function extractVersionFromPath(path: string): string | null {
  const match = path.match(/^\/v(\d+)/);
  return match ? match[1] : null;
}

/**
 * Extract version from query parameter
 * Format: ?version={version}
 *
 * @param query - The query parameters
 * @returns Version string or null if not found
 */
function extractVersionFromQuery(
  query: Record<string, unknown>
): string | null {
  const version = query.version;
  if (typeof version === "string" && /^\d+$/.test(version)) {
    return version;
  }
  return null;
}

/**
 * Validate that a version is supported
 *
 * @param version - The version to validate
 * @returns true if version is supported
 */
function isValidVersion(version: string): boolean {
  return (SUPPORTED_VERSIONS as readonly string[]).includes(version);
}

// =============================================================================
// Middleware
// =============================================================================

/**
 * Version extraction middleware
 *
 * Extracts API version from request and attaches it to req.apiVersion
 * Also sets req.apiVersionSource to indicate where the version came from.
 *
 * Priority order:
 * 1. Accept header (application/vnd.kr8tiv.v1+json)
 * 2. URL path (/v1/tokens)
 * 3. Query parameter (?version=1)
 * 4. Default (v1)
 */
export function extractVersion(
  req: VersionedRequest,
  res: Response,
  next: NextFunction
): void {
  let version: string | null = null;
  let source: VersionedRequest["apiVersionSource"] = "default";

  // 1. Check Accept header first (highest priority)
  const acceptHeader = req.headers.accept || "";
  const headerVersion = extractVersionFromHeader(acceptHeader);
  if (headerVersion) {
    version = headerVersion;
    source = "header";
  }

  // 2. Check URL path if no header version
  if (!version) {
    const pathVersion = extractVersionFromPath(req.path);
    if (pathVersion) {
      version = pathVersion;
      source = "path";
    }
  }

  // 3. Check query parameter if no header or path version
  if (!version) {
    const queryVersion = extractVersionFromQuery(
      req.query as Record<string, unknown>
    );
    if (queryVersion) {
      version = queryVersion;
      source = "query";
    }
  }

  // 4. Default to v1
  if (!version) {
    version = DEFAULT_VERSION;
    source = "default";
  }

  // Validate version is supported
  if (!isValidVersion(version)) {
    res.status(400).json({
      success: false,
      error: `Unsupported API version: ${version}. Supported versions: ${SUPPORTED_VERSIONS.join(", ")}`,
      timestamp: new Date().toISOString(),
    });
    return;
  }

  // Attach version info to request
  req.apiVersion = version;
  req.apiVersionSource = source;

  // Add version to response headers
  res.setHeader("X-API-Version", version);

  next();
}

/**
 * Middleware to reject requests for deprecated versions
 *
 * @param deprecatedVersions - Array of version strings that are deprecated
 * @param errorMessage - Optional custom error message
 */
export function rejectDeprecatedVersions(
  deprecatedVersions: string[],
  errorMessage?: string
) {
  return (req: VersionedRequest, res: Response, next: NextFunction): void => {
    if (deprecatedVersions.includes(req.apiVersion)) {
      res.status(410).json({
        success: false,
        error:
          errorMessage ||
          `API version ${req.apiVersion} is no longer supported. Please upgrade to a newer version.`,
        supportedVersions: SUPPORTED_VERSIONS.filter(
          (v) => !deprecatedVersions.includes(v)
        ),
        timestamp: new Date().toISOString(),
      });
      return;
    }
    next();
  };
}

/**
 * Middleware to require a minimum API version
 *
 * @param minVersion - Minimum version required (e.g., "2")
 */
export function requireMinVersion(minVersion: string) {
  return (req: VersionedRequest, res: Response, next: NextFunction): void => {
    const currentVersion = parseInt(req.apiVersion, 10);
    const required = parseInt(minVersion, 10);

    if (currentVersion < required) {
      res.status(400).json({
        success: false,
        error: `This endpoint requires API version ${minVersion} or higher. You requested version ${req.apiVersion}.`,
        timestamp: new Date().toISOString(),
      });
      return;
    }
    next();
  };
}

export default extractVersion;
