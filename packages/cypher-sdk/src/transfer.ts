import {
  createAssociatedTokenAccountIdempotentInstruction,
  createTransferInstruction,
  getAssociatedTokenAddressSync,
} from "@solana/spl-token";
import {
  Connection,
  PublicKey,
  SystemProgram,
  Transaction,
} from "@solana/web3.js";

import { SOL_FEE_RESERVE } from "./constants";

export interface TokenProgramIds {
  tokenProgramId: PublicKey;
  associatedTokenProgramId: PublicKey;
}

export function associatedTokenAddress(
  mint: PublicKey,
  owner: PublicKey,
  programs: TokenProgramIds
): PublicKey {
  return getAssociatedTokenAddressSync(
    mint,
    owner,
    false,
    programs.tokenProgramId,
    programs.associatedTokenProgramId
  );
}

export async function fetchBalance(
  connection: Connection,
  owner: PublicKey,
  mint: PublicKey | null,
  programs: TokenProgramIds
): Promise<bigint> {
  if (!mint) return BigInt(await connection.getBalance(owner));
  const info = await connection.getAccountInfo(
    associatedTokenAddress(mint, owner, programs)
  );
  if (!info) return 0n;
  return Buffer.from(info.data).readBigUInt64LE(64);
}

export function transferTransaction(args: {
  from: PublicKey;
  to: PublicKey;
  mint: PublicKey | null;
  amount: bigint;
  programs: TokenProgramIds;
}): Transaction {
  if (args.from.equals(args.to)) {
    throw new Error("Choose a different wallet.");
  }
  if (args.amount <= 0n) {
    throw new Error("Enter an amount.");
  }
  if (args.amount > BigInt(Number.MAX_SAFE_INTEGER)) {
    throw new Error("Amount is too large.");
  }

  const transaction = new Transaction();
  if (!args.mint) {
    transaction.add(
      SystemProgram.transfer({
        fromPubkey: args.from,
        toPubkey: args.to,
        lamports: Number(args.amount),
      })
    );
    return transaction;
  }

  const source = associatedTokenAddress(args.mint, args.from, args.programs);
  const destination = associatedTokenAddress(
    args.mint,
    args.to,
    args.programs
  );
  transaction.add(
    createAssociatedTokenAccountIdempotentInstruction(
      args.from,
      destination,
      args.to,
      args.mint,
      args.programs.tokenProgramId,
      args.programs.associatedTokenProgramId
    ),
    createTransferInstruction(
      source,
      destination,
      args.from,
      args.amount,
      [],
      args.programs.tokenProgramId
    )
  );
  return transaction;
}

export function maxSolTransfer(balance: bigint): bigint {
  return balance > SOL_FEE_RESERVE ? balance - SOL_FEE_RESERVE : 0n;
}
