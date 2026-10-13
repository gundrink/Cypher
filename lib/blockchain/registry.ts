import { PublicKey, Transaction } from "@solana/web3.js";

import {
  fetchOwnerUsername,
  fetchUsername,
  initializeInstruction,
  registerUsernameInstruction,
} from "@cypher/sdk";

import { getConnection } from "@/lib/solana/connection";
import { getRegistry } from "@/lib/solana/cypher";
import { cypherProgramId } from "@/lib/solana/env";

import { hexToBytes } from "./bytes";

import type { WalletSender } from "./wallet-sender";

async function prepare(
  transaction: Transaction,
  payer: PublicKey
): Promise<Transaction> {
  const { blockhash, lastValidBlockHeight } =
    await getConnection().getLatestBlockhash("confirmed");
  transaction.feePayer = payer;
  transaction.recentBlockhash = blockhash;
  transaction.lastValidBlockHeight = lastValidBlockHeight;
  return transaction;
}

export async function checkUsernameAvailability(
  _provider: unknown,
  username: string
): Promise<boolean> {
  const record = await fetchUsername(
    getConnection(),
    cypherProgramId,
    username.replace(/^@+/, "")
  );
  return record === null;
}

export async function getViewingKey(
  _provider: unknown,
  username: string
): Promise<string> {
  const record = await fetchUsername(
    getConnection(),
    cypherProgramId,
    username.replace(/^@+/, "")
  );
  if (!record) {
    throw new Error("Username not found");
  }
  return Buffer.from(record.viewingKey).toString("hex");
}

export async function getUsername(
  _provider: unknown,
  address: string
): Promise<string> {
  const record = await fetchOwnerUsername(
    getConnection(),
    cypherProgramId,
    new PublicKey(address)
  );
  return record?.username ?? "";
}

export async function getAddress(
  _provider: unknown,
  username: string
): Promise<string> {
  const record = await fetchUsername(
    getConnection(),
    cypherProgramId,
    username.replace(/^@+/, "")
  );
  if (!record) {
    throw new Error("Username not found");
  }
  return record.owner.toBase58();
}

export async function registerUsername(
  sender: WalletSender,
  username: string,
  viewingKey: string
): Promise<string> {
  const owner = new PublicKey(sender.address);
  const cleanUsername = username.replace(/^@+/, "");
  const transaction = new Transaction();
  const registry = await getRegistry();
  if (!registry) {
    transaction.add(initializeInstruction(cypherProgramId, owner));
  }
  transaction.add(
    registerUsernameInstruction({
      programId: cypherProgramId,
      owner,
      username: cleanUsername,
      viewingKey: hexToBytes(viewingKey),
    })
  );
  return sender.sendTransaction(await prepare(transaction, owner));
}

export function listenForRegistrations(
  _provider: unknown,
  _callback: (username: string) => void
): () => void {
  return () => {};
}
