import { bytesToHex } from "@/lib/blockchain/bytes";

const WALLET_SIGNATURE_MESSAGE =
  "Cypher Wallet | Authorize Deterministic Key Generation";
const SIGNATURE_CACHE_KEY = "cypher_wallet_signature";
const SIGNATURE_ADDRESS_KEY = "cypher_wallet_signature_address";

export async function getOrCreateWalletSignature(
  signMessage: (message: Uint8Array) => Promise<Uint8Array>,
  walletAddress: string
): Promise<string> {
  if (typeof window === "undefined") {
    throw new Error("Wallet signature can only be created in browser");
  }

  const cachedAddress = localStorage.getItem(SIGNATURE_ADDRESS_KEY);
  const cachedSignature = localStorage.getItem(SIGNATURE_CACHE_KEY);

  if (cachedSignature && cachedAddress === walletAddress) {
    return cachedSignature;
  }

  const signature = bytesToHex(
    await signMessage(new TextEncoder().encode(WALLET_SIGNATURE_MESSAGE))
  );

  localStorage.setItem(SIGNATURE_CACHE_KEY, signature);
  localStorage.setItem(SIGNATURE_ADDRESS_KEY, walletAddress);

  return signature;
}

export function getCachedWalletSignature(walletAddress: string): string | null {
  if (typeof window === "undefined") {
    return null;
  }

  const cachedAddress = localStorage.getItem(SIGNATURE_ADDRESS_KEY);
  const cachedSignature = localStorage.getItem(SIGNATURE_CACHE_KEY);

  if (cachedSignature && cachedAddress === walletAddress) {
    return cachedSignature;
  }

  return null;
}

export function clearWalletSignature(): void {
  if (typeof window === "undefined") {
    return;
  }

  localStorage.removeItem(SIGNATURE_CACHE_KEY);
  localStorage.removeItem(SIGNATURE_ADDRESS_KEY);
}

export async function requestWalletSignature(
  signMessage: (message: Uint8Array) => Promise<Uint8Array>,
  walletAddress: string
): Promise<string> {
  return getOrCreateWalletSignature(signMessage, walletAddress);
}
