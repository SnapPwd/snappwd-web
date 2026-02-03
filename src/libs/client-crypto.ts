// Encryption version constants
const KEY_SIZE_V1 = 16; // AES-128 (legacy)
const KEY_SIZE_V2 = 32; // AES-256 (new)
const IV_SIZE = 12;
const VERSION_V1 = 1;
const VERSION_V2 = 2;

const BASE58_ALPHABET =
  "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";

// Precomputed lookup table for O(1) character-to-value conversion
const BASE58_MAP: Record<string, number> = {};
for (let i = 0; i < BASE58_ALPHABET.length; i++) {
  BASE58_MAP[BASE58_ALPHABET[i]] = i;
}

/**
 * Encode a Uint8Array to base58 string
 */
export function base58Encode(bytes: Uint8Array): string {
  const digits = [0];
  for (let b = 0; b < bytes.length; b++) {
    let carry = bytes[b];
    for (let i = 0; i < digits.length; i++) {
      carry += digits[i] << 8;
      digits[i] = carry % 58;
      carry = (carry / 58) | 0;
    }
    while (carry > 0) {
      digits.push(carry % 58);
      carry = (carry / 58) | 0;
    }
  }
  // Handle leading zeros
  let result = "";
  for (let b = 0; b < bytes.length; b++) {
    if (bytes[b] === 0) result += BASE58_ALPHABET[0];
    else break;
  }
  // Convert digits to base58 characters (reverse order)
  for (let i = digits.length - 1; i >= 0; i--) {
    result += BASE58_ALPHABET[digits[i]];
  }
  return result;
}

/**
 * Decode a base58 string to Uint8Array
 */
export function base58Decode(str: string): Uint8Array {
  const bytes = [0];
  for (let c = 0; c < str.length; c++) {
    const value = BASE58_MAP[str[c]];
    if (value === undefined) throw new Error("Invalid base58 character");
    let carry = value;
    for (let i = 0; i < bytes.length; i++) {
      carry += bytes[i] * 58;
      bytes[i] = carry & 0xff;
      carry >>= 8;
    }
    while (carry > 0) {
      bytes.push(carry & 0xff);
      carry >>= 8;
    }
  }
  // Handle leading '1's (zeros in base58)
  const leadingOnes = str.match(/^1*/)?.[0].length || 0;
  const result = new Uint8Array(leadingOnes + bytes.length);
  // Leading zeros
  for (let i = 0; i < leadingOnes; i++) {
    result[i] = 0;
  }
  // Reverse bytes into result
  for (let i = 0; i < bytes.length; i++) {
    result[leadingOnes + i] = bytes[bytes.length - 1 - i];
  }
  return result;
}

/**
 * Validate a base58 encryption key (must decode to 16 or 32 bytes)
 */
export function isValidBase58Key(key: string): boolean {
  if (
    !/^[123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz]+$/.test(key)
  ) {
    return false;
  }
  try {
    const decoded = base58Decode(key);
    return decoded.length === KEY_SIZE_V1 || decoded.length === KEY_SIZE_V2;
  } catch {
    return false;
  }
}

/**
 * Generate a random encryption key
 *
 * @returns Base58 string of the key (32 bytes / 256 bits for AES-256)
 */
export function generateEncryptionKey(): string {
  // Generate a random array of 32 bytes (256 bits) for AES-256
  const array = new Uint8Array(KEY_SIZE_V2);
  window.crypto.getRandomValues(array);

  // Convert to base58 string
  return base58Encode(array);
}

/**
 * Encrypt data with AES-GCM using the Web Crypto API
 *
 * @param plaintext
 * @param key Base58 string of the key (16 or 32 bytes)
 * @returns Base64 string of the encrypted data with version prefix
 */
export async function encryptData(
  plaintext: string,
  key: string
): Promise<string> {
  // Convert the base58 key to a CryptoKey
  const keyData = base58Decode(key);
  const keySize = keyData.length;
  const version = keySize === KEY_SIZE_V2 ? VERSION_V2 : VERSION_V1;

  const cryptoKey = await window.crypto.subtle.importKey(
    "raw",
    keyData.buffer.slice(
      keyData.byteOffset,
      keyData.byteOffset + keyData.byteLength
    ) as ArrayBuffer,
    { name: "AES-GCM" },
    false,
    ["encrypt"]
  );

  // Generate a random IV
  const iv = window.crypto.getRandomValues(new Uint8Array(IV_SIZE));

  // Encrypt the data
  const encoder = new TextEncoder();
  const encodedData = encoder.encode(plaintext);

  const encryptedData = await window.crypto.subtle.encrypt(
    {
      name: "AES-GCM",
      iv: iv as unknown as BufferSource,
    },
    cryptoKey,
    encodedData
  );

  // New format: [version | IV | ciphertext]
  const result = new Uint8Array(1 + iv.length + encryptedData.byteLength);
  result[0] = version;
  result.set(iv, 1);
  result.set(new Uint8Array(encryptedData), 1 + iv.length);

  // Convert Uint8Array to base64 using chunked String.fromCharCode for better performance
  const CHUNK_SIZE = 0x8000; // 32KB chunks to avoid stack overflow
  let binaryString = "";
  for (let i = 0; i < result.length; i += CHUNK_SIZE) {
    const chunk = result.subarray(i, Math.min(i + CHUNK_SIZE, result.length));
    binaryString += String.fromCharCode.apply(
      null,
      chunk as unknown as number[]
    );
  }

  return btoa(binaryString);
}

/**
 * Decrypt data with AES-GCM using the Web Crypto API
 * Supports both versioned format (v1/v2) and legacy format (no version byte)
 *
 * @param encryptedBase64
 * @param key Base58 string of the key (16 or 32 bytes)
 * @returns Decrypted plaintext
 */
export async function decryptData(
  encryptedBase64: string,
  key: string
): Promise<string> {
  // Convert the base58 key to a CryptoKey
  const keyData = base58Decode(key);
  const cryptoKey = await window.crypto.subtle.importKey(
    "raw",
    keyData.buffer.slice(
      keyData.byteOffset,
      keyData.byteOffset + keyData.byteLength
    ) as ArrayBuffer,
    { name: "AES-GCM" },
    false,
    ["decrypt"]
  );

  // Convert base64 to array buffer
  const binaryString = atob(encryptedBase64);
  const encryptedData = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    encryptedData[i] = binaryString.charCodeAt(i);
  }

  let iv: Uint8Array;
  let ciphertext: Uint8Array;

  // Detect format: versioned (first byte is VERSION_V1 or VERSION_V2) or legacy
  if (encryptedData[0] === VERSION_V1 || encryptedData[0] === VERSION_V2) {
    // Versioned format: [version | IV | ciphertext]
    iv = encryptedData.slice(1, 1 + IV_SIZE);
    ciphertext = encryptedData.slice(1 + IV_SIZE);
  } else {
    // Legacy format: [IV | ciphertext]
    iv = encryptedData.slice(0, IV_SIZE);
    ciphertext = encryptedData.slice(IV_SIZE);
  }

  // Decrypt the data
  const decryptedData = await window.crypto.subtle.decrypt(
    {
      name: "AES-GCM",
      iv: iv as unknown as BufferSource,
    },
    cryptoKey,
    ciphertext as unknown as BufferSource
  );

  // Convert the decrypted data to a string
  const decoder = new TextDecoder();
  return decoder.decode(decryptedData);
}
