import { Connection, PublicKey } from "@solana/web3.js";

import { base58Encode } from "./base58";
import {
  matchesDiscriminator,
  readBytes,
  readPubkey,
  readString,
} from "./codec";
import { ACCOUNT_SPACE, DISC } from "./constants";
import { ownerRecordAddress, registryAddress, usernameAddress } from "./pda";

export interface RegistryAccount {
  admin: PublicKey;
  bump: number;
  announcementCount: bigint;
}

export interface UsernameAccount {
  owner: PublicKey;
  username: string;
  viewingKey: Uint8Array;
  bump: number;
}

export interface OwnerAccount {
  username: string;
  bump: number;
}

export interface AnnouncementAccount {
  address: PublicKey;
  sender: PublicKey;
  stealthAddress: Uint8Array;
  ephemeralPublicKey: Uint8Array;
  metadata: Uint8Array;
  slot: bigint;
  index: bigint;
  bump: number;
}

function accountBuffer(data: Buffer | Uint8Array): Buffer {
  return Buffer.from(data);
}

export function decodeRegistry(data: Buffer | Uint8Array): RegistryAccount {
  const view = accountBuffer(data);
  if (!matchesDiscriminator(view, DISC.registry)) {
    throw new Error("Account is not a Cypher registry.");
  }
  let offset = 8;
  const admin = readPubkey(view, offset);
  offset = admin.offset;
  const bump = view.readUInt8(offset);
  offset += 1;
  const announcementCount = view.readBigUInt64LE(offset);
  return { admin: admin.value, bump, announcementCount };
}

export function decodeUsername(data: Buffer | Uint8Array): UsernameAccount {
  const view = accountBuffer(data);
  if (!matchesDiscriminator(view, DISC.username)) {
    throw new Error("Account is not a Cypher username.");
  }
  let offset = 8;
  const owner = readPubkey(view, offset);
  offset = owner.offset;
  const username = readString(view, offset);
  offset = username.offset;
  const viewingKey = readBytes(view, offset);
  offset = viewingKey.offset;
  return {
    owner: owner.value,
    username: username.value,
    viewingKey: viewingKey.value,
    bump: view.readUInt8(offset),
  };
}

export function decodeOwner(data: Buffer | Uint8Array): OwnerAccount {
  const view = accountBuffer(data);
  if (!matchesDiscriminator(view, DISC.owner)) {
    throw new Error("Account is not a Cypher owner record.");
  }
  const username = readString(view, 8);
  return {
    username: username.value,
    bump: view.readUInt8(username.offset),
  };
}

export function decodeAnnouncement(
  address: PublicKey,
  data: Buffer | Uint8Array
): AnnouncementAccount {
  const view = accountBuffer(data);
  if (!matchesDiscriminator(view, DISC.announcement)) {
    throw new Error("Account is not a Cypher announcement.");
  }
  let offset = 8;
  const sender = readPubkey(view, offset);
  offset = sender.offset;
  const stealthAddress = Uint8Array.from(view.subarray(offset, offset + 32));
  offset += 32;
  const ephemeralPublicKey = readBytes(view, offset);
  offset = ephemeralPublicKey.offset;
  const metadata = readBytes(view, offset);
  offset = metadata.offset;
  const slot = view.readBigUInt64LE(offset);
  offset += 8;
  const index = view.readBigUInt64LE(offset);
  offset += 8;
  return {
    address,
    sender: sender.value,
    stealthAddress,
    ephemeralPublicKey: ephemeralPublicKey.value,
    metadata: metadata.value,
    slot,
    index,
    bump: view.readUInt8(offset),
  };
}

export async function fetchRegistry(
  connection: Connection,
  programId: PublicKey
): Promise<RegistryAccount | null> {
  const info = await connection.getAccountInfo(registryAddress(programId));
  if (!info) return null;
  return decodeRegistry(info.data);
}

export async function fetchUsername(
  connection: Connection,
  programId: PublicKey,
  username: string
): Promise<UsernameAccount | null> {
  const info = await connection.getAccountInfo(
    usernameAddress(programId, username)
  );
  if (!info) return null;
  return decodeUsername(info.data);
}

export async function fetchOwnerUsername(
  connection: Connection,
  programId: PublicKey,
  owner: PublicKey
): Promise<OwnerAccount | null> {
  const info = await connection.getAccountInfo(
    ownerRecordAddress(programId, owner)
  );
  if (!info) return null;
  return decodeOwner(info.data);
}

export async function fetchAnnouncements(
  connection: Connection,
  programId: PublicKey
): Promise<AnnouncementAccount[]> {
  const accounts = await connection.getProgramAccounts(programId, {
    filters: [
      { dataSize: ACCOUNT_SPACE.announcement },
      {
        memcmp: {
          offset: 0,
          bytes: base58Encode(DISC.announcement),
        },
      },
    ],
  });

  return accounts
    .map((account) => decodeAnnouncement(account.pubkey, account.account.data))
    .sort((left, right) => {
      if (left.index < right.index) return -1;
      if (left.index > right.index) return 1;
      return 0;
    });
}
