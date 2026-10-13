import {
  checkPINLockout,
  hashPIN,
  storePINHash,
  verifyPIN,
} from "@/lib/utils/pin";
import {
  getCachedWalletSignature,
  requestWalletSignature,
} from "@/lib/utils/wallet-signature";

import { deriveMetaKeys, type MetaKeys } from "./meta-keys";
import { getUsername, getViewingKey } from "./registry";

export async function recoverMetaKeys(
  walletAddress: string,
  pin: string,
  signMessage: (message: Uint8Array) => Promise<Uint8Array>
): Promise<MetaKeys> {
  const lockoutStatus = checkPINLockout(walletAddress);
  if (lockoutStatus.locked) {
    throw new Error(
      `Wallet is locked. Please try again in ${lockoutStatus.remainingTime} seconds.`
    );
  }

  const hasStoredPINHash =
    typeof window !== "undefined" &&
    !!localStorage.getItem(`cypher_pin_hash_${walletAddress}`);

  let signature = getCachedWalletSignature(walletAddress);
  if (!signature) {
    signature = await requestWalletSignature(signMessage, walletAddress);
  }

  if (hasStoredPINHash) {
    if (!verifyPIN(pin, walletAddress)) {
      throw new Error("PIN is invalid");
    }
    return deriveMetaKeys(walletAddress, signature, pin);
  }

  const username = await getUsername(null, walletAddress);
  if (!username) {
    throw new Error("User is not registered");
  }

  const keys = await deriveMetaKeys(walletAddress, signature, pin);
  if (keys.metaViewPub.toLowerCase() !== (await getViewingKey(null, username)).toLowerCase()) {
    throw new Error("PIN is invalid");
  }

  storePINHash(hashPIN(pin), walletAddress);
  return keys;
}
