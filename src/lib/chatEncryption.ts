// Secure message encryption using Web Crypto API
// Messages are encrypted client-side before being sent to Supabase

const ALGORITHM = 'AES-GCM';
const KEY_LENGTH = 256;
const IV_LENGTH = 12;

export async function generateEncryptionKey(): Promise<CryptoKey> {
  return await crypto.subtle.generateKey(
    {
      name: ALGORITHM,
      length: KEY_LENGTH,
    },
    true,
    ['encrypt', 'decrypt']
  );
}

export async function exportKey(key: CryptoKey): Promise<string> {
  const exported = await crypto.subtle.exportKey('jwk', key);
  return JSON.stringify(exported);
}

export async function importKey(keyData: string): Promise<CryptoKey> {
  const keyObject = JSON.parse(keyData);
  return await crypto.subtle.importKey(
    'jwk',
    keyObject,
    {
      name: ALGORITHM,
      length: KEY_LENGTH,
    },
    true,
    ['encrypt', 'decrypt']
  );
}

export async function encryptMessage(message: string, key: CryptoKey): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(message);
  
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));
  
  const encrypted = await crypto.subtle.encrypt(
    {
      name: ALGORITHM,
      iv: iv,
    },
    key,
    data
  );

  // Combine IV and encrypted data
  const combined = new Uint8Array(iv.length + encrypted.byteLength);
  combined.set(iv, 0);
  combined.set(new Uint8Array(encrypted), iv.length);

  // Convert to base64
  return btoa(String.fromCharCode(...combined));
}

export async function decryptMessage(encryptedData: string, key: CryptoKey): Promise<string> {
  try {
    // Check if data is valid base64 and has minimum length
    if (!encryptedData || encryptedData.length < IV_LENGTH) {
      console.warn('Invalid encrypted data format');
      return encryptedData || '[Invalid Message]';
    }
    
    // Decode from base64
    const combined = Uint8Array.from(atob(encryptedData), c => c.charCodeAt(0));
    
    // Validate minimum length (IV + at least some data)
    if (combined.length <= IV_LENGTH) {
      console.warn('Encrypted data too short');
      return encryptedData;
    }
    
    // Extract IV and encrypted data
    const iv = combined.slice(0, IV_LENGTH);
    const data = combined.slice(IV_LENGTH);

    const decrypted = await crypto.subtle.decrypt(
      {
        name: ALGORITHM,
        iv: iv,
      },
      key,
      data
    );

    const decoder = new TextDecoder();
    return decoder.decode(decrypted);
  } catch (error) {
    console.warn('Decryption failed, returning original text:', error);
    // Return original text if decryption fails (might be unencrypted)
    return encryptedData || '[Encrypted Message]';
  }
}

// Session storage for encryption key (cleared on logout)
const STORAGE_KEY = 'chat_encryption_key';

export function storeEncryptionKey(keyData: string): void {
  sessionStorage.setItem(STORAGE_KEY, keyData);
}

export function getStoredEncryptionKey(): string | null {
  return sessionStorage.getItem(STORAGE_KEY);
}

export function clearEncryptionKey(): void {
  sessionStorage.removeItem(STORAGE_KEY);
}

export async function initializeEncryption(): Promise<CryptoKey> {
  const stored = getStoredEncryptionKey();
  
  if (stored) {
    return await importKey(stored);
  }
  
  const key = await generateEncryptionKey();
  const exported = await exportKey(key);
  storeEncryptionKey(exported);
  
  return key;
}