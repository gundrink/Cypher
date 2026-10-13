import { ed25519, x25519 } from "@noble/curves/ed25519";
import { sha512 } from "@noble/hashes/sha2";
import { concatBytes, utf8ToBytes } from "@noble/hashes/utils";
import { PublicKey } from "@solana/web3.js";

import { bytesToHex, hexToBytes } from "./bytes";

export interface MetaKeys {
  metaViewPriv: string;
  metaViewPub: string;
  metaSpendPriv: string;
  metaSpendPub: string;
}

const VIEW_DOMAIN = "Cypher View Authority | Deterministic Derivation";
const SPEND_DOMAIN = "Cypher Spend Authority | Deterministic Derivation";

function seedFor(
  walletAddress: string,
  walletSignature: string,
  pin: string,
  domain: string
): Uint8Array {
  const material = concatBytes(
    new PublicKey(walletAddress).toBytes(),
    hexToBytes(walletSignature),
    utf8ToBytes(pin),
    utf8ToBytes(domain)
  );
  return sha512(material).slice(0, 32);
}

export async function deriveMetaKeys(
  walletAddress: string,
  walletSignature: string,
  pin: string
): Promise<MetaKeys> {
  const viewSeed = seedFor(walletAddress, walletSignature, pin, VIEW_DOMAIN);
  const spendSeed = seedFor(walletAddress, walletSignature, pin, SPEND_DOMAIN);

  return {
    metaViewPriv: bytesToHex(viewSeed),
    metaViewPub: bytesToHex(x25519.getPublicKey(viewSeed)),
    metaSpendPriv: bytesToHex(spendSeed),
    metaSpendPub: new PublicKey(ed25519.getPublicKey(spendSeed)).toBase58(),
  };
}
