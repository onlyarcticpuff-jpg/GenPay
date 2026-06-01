import {
  BrowserProvider,
  JsonRpcProvider,
  Mnemonic,
  TransactionRequest,
  Wallet,
  formatEther,
  getAddress,
  isAddress,
  parseEther,
} from 'ethers';

export type NetworkConfig = {
  chainId: number;
  name: string;
  nativeCurrency: string;
  rpcUrl: string;
  blockExplorerUrl?: string;
};

export type WalletAccount = {
  address: string;
  publicKey: string;
  phrase?: string;
};

export type Balance = {
  address: string;
  wei: string;
  formatted: string;
  symbol: string;
};

export type TransferDraft = {
  to: string;
  amount: string;
  gasLimit?: bigint;
};

export const DEFAULT_NETWORKS: NetworkConfig[] = [
  {
    chainId: 11155111,
    name: 'Ethereum Sepolia',
    nativeCurrency: 'SepoliaETH',
    rpcUrl: 'https://rpc.sepolia.org',
    blockExplorerUrl: 'https://sepolia.etherscan.io',
  },
  {
    chainId: 137,
    name: 'Polygon',
    nativeCurrency: 'MATIC',
    rpcUrl: 'https://polygon-rpc.com',
    blockExplorerUrl: 'https://polygonscan.com',
  },
];

export function createProvider(network: NetworkConfig): JsonRpcProvider {
  return new JsonRpcProvider(network.rpcUrl, network.chainId);
}

export function createRandomAccount(): WalletAccount {
  const wallet = Wallet.createRandom();

  return {
    address: wallet.address,
    publicKey: wallet.signingKey.publicKey,
    phrase: wallet.mnemonic?.phrase,
  };
}

export function accountFromMnemonic(phrase: string, accountIndex = 0): WalletAccount {
  const normalizedPhrase = Mnemonic.fromPhrase(phrase).phrase;
  const path = `m/44'/60'/0'/0/${accountIndex}`;
  const wallet = Wallet.fromPhrase(normalizedPhrase, undefined, path);

  return {
    address: wallet.address,
    publicKey: wallet.signingKey.publicKey,
    phrase: wallet.mnemonic?.phrase ?? normalizedPhrase,
  };
}

export function normalizeAddress(address: string): string {
  if (!isAddress(address)) {
    throw new Error('Invalid EVM address.');
  }

  return getAddress(address);
}

export async function encryptMnemonic(phrase: string, password: string): Promise<string> {
  const wallet = Wallet.fromPhrase(phrase);
  return wallet.encrypt(password);
}

export async function decryptKeystore(json: string, password: string): Promise<WalletAccount> {
  const wallet = await Wallet.fromEncryptedJson(json, password);

  return {
    address: wallet.address,
    publicKey: wallet.signingKey.publicKey,
    phrase: wallet.mnemonic?.phrase,
  };
}

export async function getNativeBalance(
  address: string,
  network: NetworkConfig,
): Promise<Balance> {
  const provider = createProvider(network);
  const checksumAddress = normalizeAddress(address);
  const wei = await provider.getBalance(checksumAddress);

  return {
    address: checksumAddress,
    wei: wei.toString(),
    formatted: formatEther(wei),
    symbol: network.nativeCurrency,
  };
}

export function buildNativeTransfer(draft: TransferDraft): TransactionRequest {
  return {
    to: normalizeAddress(draft.to),
    value: parseEther(draft.amount),
    gasLimit: draft.gasLimit,
  };
}

export async function signMessageWithMnemonic(
  phrase: string,
  message: string,
  accountIndex = 0,
): Promise<string> {
  const wallet = Wallet.fromPhrase(phrase, undefined, `m/44'/60'/0'/0/${accountIndex}`);
  return wallet.signMessage(message);
}

export async function sendNativeTransfer(
  phrase: string,
  network: NetworkConfig,
  draft: TransferDraft,
  accountIndex = 0,
): Promise<string> {
  const provider = createProvider(network);
  const wallet = Wallet.fromPhrase(phrase, provider, `m/44'/60'/0'/0/${accountIndex}`);
  const response = await wallet.sendTransaction(buildNativeTransfer(draft));
  return response.hash;
}

export async function requestBrowserWalletAddress(): Promise<string> {
  const ethereum = (globalThis as { ethereum?: unknown }).ethereum;

  if (!ethereum) {
    throw new Error('No injected browser wallet was found.');
  }

  const provider = new BrowserProvider(ethereum as never);
  const signer = await provider.getSigner();
  return signer.getAddress();
}
