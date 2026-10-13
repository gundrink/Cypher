import { ed25519, x25519 } from "@noble/curves/ed25519";
import { sha256 } from "@noble/hashes/sha2";
import { Keypair, PublicKey } from "@solana/web3.js";

import { bytesToHex, hexToBytes } from "./bytes";

export interface StealthKeys {
  viewingKey: string;
  viewingKeyPrivate: string;
  spendingKey: string;
  spendingKeyPrivate: string;
}

export interface StealthAddressResult {
  stealthAddress: string;
  ephemeralPublicKey: string;
  ephemeralPrivateKey: string;
}

function stealthAddressFromShared(shared: Uint8Array): string {
  const seed = sha256(shared);
  return Keypair.fromSeed(seed).publicKey.toBase58();
}

export async function generateStealthKeys(): Promise<StealthKeys> {
  const viewingPrivate = x25519.utils.randomPrivateKey();
  const spendingPrivate = ed25519.utils.randomPrivateKey();
  return {
    viewingKey: bytesToHex(x25519.getPublicKey(viewingPrivate)),
    viewingKeyPrivate: bytesToHex(viewingPrivate),
    spendingKey: new PublicKey(ed25519.getPublicKey(spendingPrivate)).toBase58(),
    spendingKeyPrivate: bytesToHex(spendingPrivate),
  };
}

export function generateStealthAddress(
  recipientViewingKey: string
): StealthAddressResult {
  const viewingPublic = hexToBytes(recipientViewingKey);
  const ephemeralPrivate = x25519.utils.randomPrivateKey();
  const ephemeralPublic = x25519.getPublicKey(ephemeralPrivate);
  const shared = x25519.getSharedSecret(ephemeralPrivate, viewingPublic);

  return {
    stealthAddress: stealthAddressFromShared(shared),
    ephemeralPublicKey: bytesToHex(ephemeralPublic),
    ephemeralPrivateKey: bytesToHex(ephemeralPrivate),
  };
}

export function computeStealthAddress(
  viewingKeyPrivate: string,
  ephemeralPublicKey: string
): string {
  const shared = x25519.getSharedSecret(
    hexToBytes(viewingKeyPrivate),
    hexToBytes(ephemeralPublicKey)
  );
  return stealthAddressFromShared(shared);
}

export function isSolanaAddress(address: string): boolean {
  if (address.length < 32) return false;
  try {
    const key = new PublicKey(address);
    return PublicKey.isOnCurve(key.toBytes());
  } catch {
    return false;
  }
}

export function isValidStealthAddress(address: string): boolean {
  return isSolanaAddress(address);
}
