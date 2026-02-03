const API_URL = import.meta.env.VITE_API_URL || "";

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary_string = window.atob(base64);
  const len = binary_string.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binary_string.charCodeAt(i);
  }
  return bytes.buffer;
}

/**
 * Store the encrypted secret in the external API
 */
export async function storeEncryptedSecret(
  encryptedSecret: string,
  expiration: number
) {
  const res = await fetch(`${API_URL}/api/v1/secrets`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      encryptedSecret,
      expiration,
    }),
  });

  if (!res.ok) {
    throw new Error(`Failed to store secret: ${res.status} ${res.statusText}`);
  }

  const data = await res.json();
  return data.id || data.secretId;
}

/**
 * Get the encrypted secret from the external API
 */
export async function getEncryptedSecret(secretId: string) {
  const res = await fetch(`${API_URL}/api/v1/secrets/${secretId}`, {
    cache: "no-store",
  });

  if (res.status === 404) {
    return null;
  }

  if (!res.ok) {
    console.error(`Failed to fetch secret: ${res.status} ${res.statusText}`);
    return null;
  }

  const data = await res.json();
  return data.encryptedSecret;
}

// --- New functions for File Sharing ---

export interface FileMetadata {
  originalFilename: string;
  contentType: string;
  iv: string; // Base64 encoded IV
}

/**
 * Store the encrypted file data and metadata in the external API
 */
export async function storeEncryptedFile(
  metadata: FileMetadata,
  encryptedFileData: ArrayBuffer,
  expiration: number
): Promise<string> {
  const base64EncryptedData = arrayBufferToBase64(encryptedFileData);

  const res = await fetch(`${API_URL}/api/v1/files`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      metadata,
      encryptedData: base64EncryptedData,
      expiration,
    }),
  });

  if (!res.ok) {
    throw new Error(`Failed to store file: ${res.status} ${res.statusText}`);
  }

  const data = await res.json();
  return data.id || data.fileId;
}

/**
 * Get the encrypted file data and metadata from the external API
 */
export async function getEncryptedFile(
  fileId: string
): Promise<{ metadata: FileMetadata; encryptedData: ArrayBuffer } | null> {
  const res = await fetch(`${API_URL}/api/v1/files/${fileId}`, {
    cache: "no-store",
  });

  if (res.status === 404) {
    return null;
  }

  if (!res.ok) {
    console.error(`Failed to fetch file: ${res.status} ${res.statusText}`);
    return null;
  }

  try {
    const data = await res.json();
    const encryptedDataBuffer = base64ToArrayBuffer(data.encryptedData);
    
    return {
      metadata: data.metadata,
      encryptedData: encryptedDataBuffer,
    };
  } catch (parseError) {
    console.error("Failed to parse API response:", parseError);
    throw new Error("Corrupted file data from API");
  }
}
