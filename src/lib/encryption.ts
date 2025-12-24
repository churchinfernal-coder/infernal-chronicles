/**
 * End-to-End Encryption Utilities using Web Crypto API
 */

export interface KeyPair {
  publicKey: CryptoKey;
  privateKey: CryptoKey;
}

export interface ExportedKeyPair {
  publicKey: string;
  privateKey: string;
}

/**
 * Generate a new RSA key pair for encryption
 */
export async function generateKeyPair(): Promise<KeyPair> {
  const keyPair = await window.crypto.subtle.generateKey(
    {
      name: "RSA-OAEP",
      modulusLength: 2048,
      publicExponent: new Uint8Array([1, 0, 1]),
      hash: "SHA-256",
    },
    true,
    ["encrypt", "decrypt"]
  );

  return keyPair;
}

/**
 * Export keys to strings for storage
 */
export async function exportKeyPair(keyPair: KeyPair): Promise<ExportedKeyPair> {
  const publicKeyBuffer = await window.crypto.subtle.exportKey(
    "spki",
    keyPair.publicKey
  );
  const privateKeyBuffer = await window.crypto.subtle.exportKey(
    "pkcs8",
    keyPair.privateKey
  );

  return {
    publicKey: bufferToBase64(publicKeyBuffer),
    privateKey: bufferToBase64(privateKeyBuffer),
  };
}

/**
 * Import keys from strings
 */
export async function importPublicKey(publicKeyStr: string): Promise<CryptoKey> {
  const buffer = base64ToBuffer(publicKeyStr);
  return await window.crypto.subtle.importKey(
    "spki",
    buffer,
    {
      name: "RSA-OAEP",
      hash: "SHA-256",
    },
    true,
    ["encrypt"]
  );
}

export async function importPrivateKey(privateKeyStr: string): Promise<CryptoKey> {
  const buffer = base64ToBuffer(privateKeyStr);
  return await window.crypto.subtle.importKey(
    "pkcs8",
    buffer,
    {
      name: "RSA-OAEP",
      hash: "SHA-256",
    },
    true,
    ["decrypt"]
  );
}

/**
 * Encrypt a message with a public key
 */
export async function encryptMessage(
  message: string,
  publicKey: CryptoKey
): Promise<string> {
  const encoded = new TextEncoder().encode(message);
  const encrypted = await window.crypto.subtle.encrypt(
    {
      name: "RSA-OAEP",
    },
    publicKey,
    encoded
  );

  return bufferToBase64(encrypted);
}

/**
 * Decrypt a message with a private key
 */
export async function decryptMessage(
  encryptedMessage: string,
  privateKey: CryptoKey
): Promise<string> {
  const buffer = base64ToBuffer(encryptedMessage);
  const decrypted = await window.crypto.subtle.decrypt(
    {
      name: "RSA-OAEP",
    },
    privateKey,
    buffer
  );

  return new TextDecoder().decode(decrypted);
}

/**
 * Store private key in localStorage (encrypted with password in production)
 */
export function storePrivateKey(privateKey: string): void {
  localStorage.setItem("e2ee_private_key", privateKey);
}

/**
 * Retrieve private key from localStorage
 */
export function retrievePrivateKey(): string | null {
  return localStorage.getItem("e2ee_private_key");
}

/**
 * Check if user has encryption keys set up
 */
export function hasEncryptionKeys(): boolean {
  return retrievePrivateKey() !== null;
}

/**
 * Clear stored keys (for logout)
 */
export function clearStoredKeys(): void {
  localStorage.removeItem("e2ee_private_key");
}

// Helper functions
function bufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function base64ToBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}
