import crypto from 'crypto';

/**
 * Secure cryptographic utilities for the KR8TIV Launchpad API
 * 
 * SECURITY NOTES:
 * - Uses Node.js crypto module with cryptographically secure random number generator
 * - Passwords hashed with PBKDF2 (100,000 iterations, SHA-512)
 * - Timing-safe comparison prevents timing attacks
 * - All operations use constant-time algorithms where applicable
 */

/**
 * Generate a cryptographically secure random token
 * 
 * @param length - Number of bytes (output will be 2x length in hex characters)
 * @returns Hex-encoded random string
 * 
 * @example
 * generateSecureToken(32) // Returns 64-character hex string
 */
export function generateSecureToken(length: number = 32): string {
  if (length < 16) {
    throw new Error('Token length must be at least 16 bytes for security');
  }
  return crypto.randomBytes(length).toString('hex');
}

/**
 * Generate a URL-safe base64 token
 * 
 * @param length - Number of bytes
 * @returns URL-safe base64 encoded string
 */
export function generateUrlSafeToken(length: number = 32): string {
  if (length < 16) {
    throw new Error('Token length must be at least 16 bytes for security');
  }
  return crypto.randomBytes(length)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

/**
 * Hash a password using PBKDF2 with a unique salt
 * 
 * @param password - Plain text password
 * @returns Salt and hash concatenated as "salt:hash"
 * 
 * @security
 * - 16 bytes (128 bits) of random salt
 * - 100,000 PBKDF2 iterations (OWASP recommended minimum)
 * - SHA-512 hash function
 * - 64 bytes (512 bits) derived key
 */
export function hashPassword(password: string): string {
  if (!password || password.length < 8) {
    throw new Error('Password must be at least 8 characters');
  }
  
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(
    password,
    salt,
    100000, // iterations
    64,     // key length
    'sha512'
  ).toString('hex');
  
  return `${salt}:${hash}`;
}

/**
 * Verify a password against a stored hash
 * Uses timing-safe comparison to prevent timing attacks
 * 
 * @param password - Plain text password to verify
 * @param stored - Stored hash in "salt:hash" format
 * @returns true if password matches
 */
export function verifyPassword(password: string, stored: string): boolean {
  if (!password || !stored) {
    return false;
  }
  
  const [salt, storedHash] = stored.split(':');
  
  if (!salt || !storedHash) {
    return false;
  }
  
  const hash = crypto.pbkdf2Sync(
    password,
    salt,
    100000,
    64,
    'sha512'
  ).toString('hex');
  
  // Timing-safe comparison to prevent timing attacks
  try {
    return crypto.timingSafeEqual(
      Buffer.from(hash, 'hex'),
      Buffer.from(storedHash, 'hex')
    );
  } catch {
    // Buffer lengths don't match - password is wrong
    return false;
  }
}

/**
 * Generate a secure API key
 * Format: kr8_[environment]_[random]
 * 
 * @param environment - 'live' or 'test'
 * @returns Formatted API key
 */
export function generateApiKey(environment: 'live' | 'test' = 'live'): string {
  const prefix = environment === 'live' ? 'kr8_live_' : 'kr8_test_';
  const random = generateSecureToken(24); // 48 hex chars
  return prefix + random;
}

/**
 * Hash an API key for storage
 * API keys should never be stored in plain text
 * 
 * @param apiKey - Plain API key
 * @returns SHA-256 hash of the key
 */
export function hashApiKey(apiKey: string): string {
  return crypto.createHash('sha256').update(apiKey).digest('hex');
}

/**
 * Compare an API key against a stored hash
 * 
 * @param apiKey - Plain API key
 * @param storedHash - SHA-256 hash of the expected key
 * @returns true if key matches
 */
export function verifyApiKey(apiKey: string, storedHash: string): boolean {
  if (!apiKey || !storedHash) {
    return false;
  }
  
  const hash = hashApiKey(apiKey);
  
  try {
    return crypto.timingSafeEqual(
      Buffer.from(hash, 'hex'),
      Buffer.from(storedHash, 'hex')
    );
  } catch {
    return false;
  }
}

/**
 * Generate a secure nonce for transaction signing
 * 
 * @returns 32-byte nonce as hex string
 */
export function generateNonce(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Create HMAC signature for webhook payloads
 * 
 * @param payload - Data to sign
 * @param secret - Signing secret
 * @returns HMAC-SHA256 signature as hex
 */
export function signPayload(payload: string, secret: string): string {
  return crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');
}

/**
 * Verify HMAC signature
 * 
 * @param payload - Original payload
 * @param signature - Signature to verify
 * @param secret - Signing secret
 * @returns true if signature is valid
 */
export function verifySignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  const expected = signPayload(payload, secret);
  
  try {
    return crypto.timingSafeEqual(
      Buffer.from(signature, 'hex'),
      Buffer.from(expected, 'hex')
    );
  } catch {
    return false;
  }
}

/**
 * Encrypt sensitive data using AES-256-GCM
 * 
 * @param plaintext - Data to encrypt
 * @param key - 32-byte encryption key (hex encoded)
 * @returns Encrypted data in format "iv:authTag:ciphertext"
 */
export function encrypt(plaintext: string, key: string): string {
  const keyBuffer = Buffer.from(key, 'hex');
  if (keyBuffer.length !== 32) {
    throw new Error('Encryption key must be 32 bytes (256 bits)');
  }
  
  const iv = crypto.randomBytes(12); // 96-bit IV for GCM
  const cipher = crypto.createCipheriv('aes-256-gcm', keyBuffer, iv);
  
  let encrypted = cipher.update(plaintext, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  const authTag = cipher.getAuthTag();
  
  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
}

/**
 * Decrypt data encrypted with encrypt()
 * 
 * @param ciphertext - Encrypted data in format "iv:authTag:ciphertext"
 * @param key - 32-byte encryption key (hex encoded)
 * @returns Decrypted plaintext
 */
export function decrypt(ciphertext: string, key: string): string {
  const keyBuffer = Buffer.from(key, 'hex');
  if (keyBuffer.length !== 32) {
    throw new Error('Encryption key must be 32 bytes (256 bits)');
  }
  
  const [ivHex, authTagHex, encrypted] = ciphertext.split(':');
  
  if (!ivHex || !authTagHex || !encrypted) {
    throw new Error('Invalid ciphertext format');
  }
  
  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');
  
  const decipher = crypto.createDecipheriv('aes-256-gcm', keyBuffer, iv);
  decipher.setAuthTag(authTag);
  
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
}

export default {
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
};
