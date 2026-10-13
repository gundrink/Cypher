import { PublicKey, Transaction } from "@solana/web3.js";

import { announceInstruction, initializeInstruction } from "@cypher/sdk";

import { getConnection } from "@/lib/solana/connection";
import { getRegistry } from "@/lib/solana/cypher";
import { cypherProgramId } from "@/lib/solana/env";

import { hexToBytes } from "./bytes";

import type { WalletSender } from "./wallet-sender";

export interface StealthMetadata {
  amount?: string;
  tokenSymbol?: string;
  message?: string;
  timestamp?: number;
}

export async function announceStealthTransaction(
  sender: WalletSender,
  stealthAddress: string,
  ephemeralPublicKey: string,
  metadata?: StealthMetadata
): Promise<string> {
  const payer = new PublicKey(sender.address);
  const registry = await getRegistry();
  const transaction = new Transaction();
  if (!registry) {
    transaction.add(initializeInstruction(cypherProgramId, payer));
  }
  const payload = new TextEncoder().encode(
    JSON.stringify({
      amount: metadata?.amount ?? "0",
      tokenSymbol: metadata?.tokenSymbol ?? "SOL",
      timestamp: metadata?.timestamp ?? Math.floor(Date.now() / 1000),
    })
  );
  if (payload.length > 128) {
    throw new Error("Announcement metadata is too long");
  }
  transaction.add(
    announceInstruction({
      programId: cypherProgramId,
      sender: payer,
      index: registry?.announcementCount ?? 0n,
      stealthAddress: new PublicKey(stealthAddress).toBytes(),
      ephemeralPublicKey: hexToBytes(ephemeralPublicKey),
      metadata: payload,
    })
  );
  const { blockhash, lastValidBlockHeight } =
    await getConnection().getLatestBlockhash("confirmed");
  transaction.feePayer = payer;
  transaction.recentBlockhash = blockhash;
  transaction.lastValidBlockHeight = lastValidBlockHeight;
  return sender.sendTransaction(transaction);
}

export function listenForAnnouncements(
  _provider: unknown,
  _callback: (event: unknown) => void
): () => void {
  return () => {};
}
