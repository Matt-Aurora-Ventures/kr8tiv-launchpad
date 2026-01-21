/**
 * Secret management utilities for KR8TIV Launchpad
 */

/**
 * Mask a secret for safe logging
 */
export function maskSecret(secret: string): string {
  if (!secret) {
    return "[empty]";
  }
  
  if (secret.length <= 8) {
    return "****";
  }
  
  return secret.slice(0, 4) + "****" + secret.slice(-4);
}

/**
 * Mask a wallet address for logging
 */
export function maskAddress(address: string): string {
  if (!address || address.length < 8) {
    return "****";
  }
  return address.slice(0, 4) + "..." + address.slice(-4);
}

/**
 * Validate a Solana private key format
 */
export function validatePrivateKey(key: string): {
  valid: boolean;
  format: "base58" | "json" | "unknown";
  error?: string;
} {
  if (!key || typeof key !== "string") {
    return {
      valid: false,
      format: "unknown",
      error: "Private key is empty or not a string",
    };
  }
  
  const trimmed = key.trim();
  
  // Check for JSON array format
  if (trimmed.startsWith("[")) {
    try {
      const parsed = JSON.parse(trimmed);
      if (!Array.isArray(parsed)) {
        return {
          valid: false,
          format: "json",
          error: "JSON format must be an array",
        };
      }
      if (parsed.length !== 64) {
        return {
          valid: false,
          format: "json",
          error: "JSON array must have exactly 64 elements",
        };
      }
      if (!parsed.every(n => typeof n === "number" && n >= 0 && n <= 255)) {
        return {
          valid: false,
          format: "json",
          error: "All array elements must be bytes (0-255)",
        };
      }
      return { valid: true, format: "json" };
    } catch {
      return {
        valid: false,
        format: "json",
        error: "Invalid JSON format",
      };
    }
  }
  
  // Check for base58 format
  const base58Regex = /^[1-9A-HJ-NP-Za-km-z]{64,88}$/;
  if (base58Regex.test(trimmed)) {
    return { valid: true, format: "base58" };
  }
  
  return {
    valid: false,
    format: "unknown",
    error: "Invalid private key format. Must be base58 encoded or JSON array.",
  };
}

/**
 * Validate a Solana public key format
 */
export function validatePublicKey(address: string): boolean {
  if (!address || typeof address !== "string") {
    return false;
  }
  
  const base58Regex = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;
  return base58Regex.test(address.trim());
}

/**
 * Validate an API key format
 */
export function validateApiKey(
  apiKey: string,
  prefix?: string
): {
  valid: boolean;
  error?: string;
} {
  if (!apiKey || typeof apiKey !== "string") {
    return { valid: false, error: "API key is empty" };
  }
  
  if (apiKey.length < 32) {
    return { valid: false, error: "API key too short (minimum 32 characters)" };
  }
  
  if (prefix && !apiKey.startsWith(prefix)) {
    return { valid: false, error: "Invalid API key prefix" };
  }
  
  if (!/^[a-zA-Z0-9_]+$/.test(apiKey)) {
    return { valid: false, error: "API key contains invalid characters" };
  }
  
  return { valid: true };
}

/**
 * Check if a string looks like a secret
 */
export function looksLikeSecret(value: string): boolean {
  if (!value || typeof value !== "string") {
    return false;
  }
  
  const secretPatterns = [
    /^(sk|pk|api|key|secret|token)[-_]/i,
    /[-_](key|secret|token|api)$/i,
    /^[1-9A-HJ-NP-Za-km-z]{64,88}$/,
    /^\s*\[\s*\d+\s*,/,
    /^eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/,
    /^[a-f0-9]{64,}$/i,
    /password|passwd|pwd/i,
  ];
  
  return secretPatterns.some(pattern => pattern.test(value));
}

/**
 * Sanitize an object by masking secret values
 */
export function sanitizeForLogging(
  obj: Record<string, unknown>,
  sensitiveKeys: string[] = []
): Record<string, unknown> {
  const defaultSensitiveKeys = [
    "password",
    "secret",
    "key",
    "token",
    "apiKey",
    "api_key",
    "privateKey",
    "private_key",
    "authorization",
    "auth",
    "credential",
    "credentials",
  ];
  
  const allSensitiveKeys = [...defaultSensitiveKeys, ...sensitiveKeys];
  const result: Record<string, unknown> = {};
  
  for (const [key, value] of Object.entries(obj)) {
    const isSensitiveKey = allSensitiveKeys.some(
      sk => key.toLowerCase().includes(sk.toLowerCase())
    );
    
    if (isSensitiveKey && typeof value === "string") {
      result[key] = maskSecret(value);
    } else if (typeof value === "string" && looksLikeSecret(value)) {
      result[key] = maskSecret(value);
    } else if (typeof value === "object" && value !== null) {
      result[key] = sanitizeForLogging(value as Record<string, unknown>, sensitiveKeys);
    } else {
      result[key] = value;
    }
  }
  
  return result;
}

/**
 * Get a required environment variable
 */
export function getRequiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error("Required environment variable " + name + " is not set");
  }
  return value;
}

/**
 * Get an optional environment variable with default
 */
export function getOptionalEnv(name: string, defaultValue: string = ""): string {
  return process.env[name] || defaultValue;
}

/**
 * Validate all required secrets are present
 */
export function validateRequiredSecrets(
  requiredVars: string[]
): {
  valid: boolean;
  missing: string[];
} {
  const missing = requiredVars.filter(name => !process.env[name]);
  
  return {
    valid: missing.length === 0,
    missing,
  };
}

export default {
  maskSecret,
  maskAddress,
  validatePrivateKey,
  validatePublicKey,
  validateApiKey,
  looksLikeSecret,
  sanitizeForLogging,
  getRequiredEnv,
  getOptionalEnv,
  validateRequiredSecrets,
};
