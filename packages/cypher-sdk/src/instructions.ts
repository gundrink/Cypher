import {
  PublicKey,
  SystemProgram,
  TransactionInstruction,
} from "@solana/web3.js";

import { writeBytes, writeString, writeU64 } from "./codec";
import { DISC } from "./constants";
import {
  announcementAddress,
  ownerRecordAddress,
  registryAddress,
  usernameAddress,
} from "./pda";

function instruction(
  programId: PublicKey,
  data: Buffer,
  keys: {
    pubkey: PublicKey;
    isSigner: boolean;
    isWritable: boolean;
  }[]
): TransactionInstruction {
  return new TransactionInstruction({ programId, data, keys });
}

export function initializeInstruction(
  programId: PublicKey,
  admin: PublicKey
): TransactionInstruction {
  return instruction(programId, Buffer.from(DISC.initialize), [
    {
      pubkey: registryAddress(programId),
      isSigner: false,
      isWritable: true,
    },
    { pubkey: admin, isSigner: true, isWritable: true },
    { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
  ]);
}

export function registerUsernameInstruction(args: {
  programId: PublicKey;
  owner: PublicKey;
  username: string;
  viewingKey: Uint8Array;
}): TransactionInstruction {
  const data = Buffer.concat([
    Buffer.from(DISC.registerUsername),
    writeString(args.username),
    writeBytes(args.viewingKey),
  ]);
  return instruction(args.programId, data, [
    {
      pubkey: registryAddress(args.programId),
      isSigner: false,
      isWritable: false,
    },
    {
      pubkey: usernameAddress(args.programId, args.username),
      isSigner: false,
      isWritable: true,
    },
    {
      pubkey: ownerRecordAddress(args.programId, args.owner),
      isSigner: false,
      isWritable: true,
    },
    { pubkey: args.owner, isSigner: true, isWritable: true },
    { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
  ]);
}

export function announceInstruction(args: {
  programId: PublicKey;
  sender: PublicKey;
  index: bigint;
  stealthAddress: Uint8Array;
  ephemeralPublicKey: Uint8Array;
  metadata: Uint8Array;
}): TransactionInstruction {
  if (args.stealthAddress.length !== 32) {
    throw new Error("Stealth address must be 32 bytes.");
  }
  const data = Buffer.concat([
    Buffer.from(DISC.announce),
    writeU64(args.index),
    Buffer.from(args.stealthAddress),
    writeBytes(args.ephemeralPublicKey),
    writeBytes(args.metadata),
  ]);
  return instruction(args.programId, data, [
    {
      pubkey: registryAddress(args.programId),
      isSigner: false,
      isWritable: true,
    },
    {
      pubkey: announcementAddress(args.programId, args.sender, args.index),
      isSigner: false,
      isWritable: true,
    },
    { pubkey: args.sender, isSigner: true, isWritable: true },
    { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
  ]);
}
