/**
 * Utility Exports
 */

// Cryptographic utilities
export {
  generateSecureToken,
  generateUrlSafeToken,
  hashPassword,
  verifyPassword,
  generateApiKey,
  hashApiKey,
  verifyApiKey,
  generateNonce,
  signPayload,
  verifySignature,
  encrypt,
  decrypt,
} from "./crypto";

// Secret management utilities
export {
  maskSecret,
  maskAddress,
  validatePrivateKey,
  validatePublicKey,
  validateApiKey as validateApiKeyFormat,
  looksLikeSecret,
  sanitizeForLogging,
  getRequiredEnv,
  getOptionalEnv,
  validateRequiredSecrets,
} from "./secrets";

// Default exports
import crypto from "./crypto";
import secrets from "./secrets";

export default {
  crypto,
  secrets,
};
