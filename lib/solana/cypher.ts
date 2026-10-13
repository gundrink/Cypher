import { PublicKey, Transaction } from "@solana/web3.js";

import {
  announceInstruction,
  fetchAnnouncements,
  fetchBalance,
  fetchOwnerUsername,
  fetchRegistry,
  fetchUsername,
  initializeInstruction,
  maxSolTransfer,
  registerUsernameInstruction,
  transferTransaction,
  type AnnouncementAccount,
  type UsernameAccount,
} from "@cypher/sdk";

import { getConnection } from "@/lib/solana/connection";
import {
  associatedTokenProgramId,
  cypherProgramId,
  tokenProgramId,
} from "@/lib/solana/env";

const programs = {
  tokenProgramId,
  associatedTokenProgramId,
};

function withPayer(transaction: Transaction, payer: PublicKey): Transaction {
  transaction.feePayer = payer;
  return transaction;
}

export function createInitializeTransaction(admin: PublicKey): Transaction {
  return withPayer(
    new Transaction().add(initializeInstruction(cypherProgramId, admin)),
    admin
  );
}

export function createRegisterUsernameTransaction(args: {
  owner: PublicKey;
  username: string;
  viewingKey: Uint8Array;
}): Transaction {
  return withPayer(
    new Transaction().add(
      registerUsernameInstruction({
        programId: cypherProgramId,
        owner: args.owner,
        username: args.username,
        viewingKey: args.viewingKey,
      })
    ),
    args.owner
  );
}

export async function createAnnounceTransaction(args: {
  sender: PublicKey;
  stealthAddress: Uint8Array;
  ephemeralPublicKey: Uint8Array;
  metadata: Uint8Array;
}): Promise<Transaction> {
  const registry = await fetchRegistry(getConnection(), cypherProgramId);
  if (!registry) {
    throw new Error("Cypher registry is not initialized.");
  }
  return withPayer(
    new Transaction().add(
      announceInstruction({
        programId: cypherProgramId,
        sender: args.sender,
        index: registry.announcementCount,
        stealthAddress: args.stealthAddress,
        ephemeralPublicKey: args.ephemeralPublicKey,
        metadata: args.metadata,
      })
    ),
    args.sender
  );
}

export async function createTransferTransaction(args: {
  from: PublicKey;
  to: PublicKey;
  mint: PublicKey | null;
  amount: bigint;
}): Promise<Transaction> {
  const transaction = transferTransaction({ ...args, programs });
  const connection = getConnection();
  const { blockhash, lastValidBlockHeight } =
    await connection.getLatestBlockhash("confirmed");
  transaction.feePayer = args.from;
  transaction.recentBlockhash = blockhash;
  transaction.lastValidBlockHeight = lastValidBlockHeight;
  return transaction;
}

export async function getRegistry() {
  return fetchRegistry(getConnection(), cypherProgramId);
}

export async function getUsername(
  username: string
): Promise<UsernameAccount | null> {
  return fetchUsername(getConnection(), cypherProgramId, username);
}

export async function isUsernameAvailable(username: string): Promise<boolean> {
  const record = await getUsername(username);
  return record === null;
}

export async function getUsernameByOwner(owner: PublicKey): Promise<string | null> {
  const record = await fetchOwnerUsername(
    getConnection(),
    cypherProgramId,
    owner
  );
  return record?.username ?? null;
}

export async function getAnnouncements(): Promise<AnnouncementAccount[]> {
  return fetchAnnouncements(getConnection(), cypherProgramId);
}

export async function getBalance(
  owner: PublicKey,
  mint: PublicKey | null
): Promise<bigint> {
  return fetchBalance(getConnection(), owner, mint, programs);
}

export { maxSolTransfer };
