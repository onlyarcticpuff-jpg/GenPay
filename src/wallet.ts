const STORAGE_KEY = 'genpay.encryptedWallet.v1';
const KDF_ITERATIONS = 250_000;
const SALT_BYTES = 16;
const IV_BYTES = 12;
const SECRET_BYTES = 32;

export type WalletAccount = {
  id: string;
  publicAddress: string;
  createdAt: string;
};

export type LocalWallet = WalletAccount & {
  recoverySecret: string;
};

export type EncryptedWallet = WalletAccount & {
  version: 1;
  cipherText: string;
  salt: string;
  iv: string;
  kdf: 'PBKDF2-SHA-256';
  iterations: number;
};

export type TransferPreview = {
  from: string;
  to: string;
  amount: string;
  memo?: string;
  createdAt: string;
};

export async function createLocalWallet(): Promise<LocalWallet> {
  const secret = crypto.getRandomValues(new Uint8Array(SECRET_BYTES));
  const recoverySecret = bytesToHex(secret);
  const publicAddress = await derivePublicAddress(secret);

  return {
    id: crypto.randomUUID(),
    publicAddress,
    createdAt: new Date().toISOString(),
    recoverySecret,
  };
}

export async function encryptWallet(wallet: LocalWallet, password: string): Promise<EncryptedWallet> {
  assertPassword(password);

  const salt = crypto.getRandomValues(new Uint8Array(SALT_BYTES));
  const iv = crypto.getRandomValues(new Uint8Array(IV_BYTES));
  const key = await deriveEncryptionKey(password, salt);
  const plainText = new TextEncoder().encode(wallet.recoverySecret);
  const cipherText = await crypto.subtle.encrypt({ name: 'AES-GCM', iv: toBufferSource(iv) }, key, toBufferSource(plainText));

  return {
    version: 1,
    id: wallet.id,
    publicAddress: wallet.publicAddress,
    createdAt: wallet.createdAt,
    cipherText: bytesToBase64(new Uint8Array(cipherText)),
    salt: bytesToBase64(salt),
    iv: bytesToBase64(iv),
    kdf: 'PBKDF2-SHA-256',
    iterations: KDF_ITERATIONS,
  };
}

export async function decryptWallet(encryptedWallet: EncryptedWallet, password: string): Promise<LocalWallet> {
  assertPassword(password);

  const salt = base64ToBytes(encryptedWallet.salt);
  const iv = base64ToBytes(encryptedWallet.iv);
  const cipherText = base64ToBytes(encryptedWallet.cipherText);
  const key = await deriveEncryptionKey(password, salt);
  const plainText = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: toBufferSource(iv) }, key, toBufferSource(cipherText));
  const recoverySecret = new TextDecoder().decode(plainText);

  return {
    id: encryptedWallet.id,
    publicAddress: encryptedWallet.publicAddress,
    createdAt: encryptedWallet.createdAt,
    recoverySecret,
  };
}

export function saveEncryptedWallet(encryptedWallet: EncryptedWallet): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(encryptedWallet));
}

export function loadEncryptedWallet(): EncryptedWallet | null {
  const stored = localStorage.getItem(STORAGE_KEY);

  if (!stored) {
    return null;
  }

  const parsed = JSON.parse(stored) as EncryptedWallet;

  if (parsed.version !== 1 || parsed.kdf !== 'PBKDF2-SHA-256') {
    throw new Error('Unsupported wallet backup format.');
  }

  return parsed;
}

export function clearEncryptedWallet(): void {
  localStorage.removeItem(STORAGE_KEY);
}

export function createTransferPreview(from: string, to: string, amount: string, memo?: string): TransferPreview {
  if (!from.trim() || !to.trim()) {
    throw new Error('Both sender and recipient are required.');
  }

  if (!Number.isFinite(Number(amount)) || Number(amount) <= 0) {
    throw new Error('Amount must be greater than zero.');
  }

  return {
    from: from.trim(),
    to: to.trim(),
    amount: amount.trim(),
    memo: memo?.trim() || undefined,
    createdAt: new Date().toISOString(),
  };
}

async function derivePublicAddress(secret: Uint8Array): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', toBufferSource(secret));
  return `gen_${bytesToHex(new Uint8Array(digest)).slice(0, 40)}`;
}

async function deriveEncryptionKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
  const passwordKey = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(password),
    'PBKDF2',
    false,
    ['deriveKey'],
  );

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: toBufferSource(salt),
      iterations: KDF_ITERATIONS,
      hash: 'SHA-256',
    },
    passwordKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt'],
  );
}

function assertPassword(password: string): void {
  if (password.length < 8) {
    throw new Error('Use a wallet password with at least 8 characters.');
  }
}

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

function bytesToBase64(bytes: Uint8Array): string {
  return btoa(String.fromCharCode(...bytes));
}

function base64ToBytes(value: string): Uint8Array {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  return bytes;
}

function toBufferSource(bytes: Uint8Array): ArrayBuffer {
  return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
}
