import { PublicKey } from "@solana/web3.js";

import { fetchAnnouncements } from "@cypher/sdk";

import { getConnection } from "@/lib/solana/connection";
import { cypherProgramId } from "@/lib/solana/env";

import { bytesToHex } from "./bytes";
import { computeStealthAddress } from "./stealth";

export interface AnnouncementEvent {
  sender: string;
  actor: string;
  stealthAddress: string;
  ephemeralPublicKey: string;
  metadata: string;
  timestamp: number;
  transactionHash: string;
}

export interface ParsedMetadata {
  amount?: string;
  tokenSymbol?: string;
  token?: string;
  message?: string;
  timestamp?: number;
}

function toEvent(account: {
  address: PublicKey;
  sender: PublicKey;
  stealthAddress: Uint8Array;
  ephemeralPublicKey: Uint8Array;
  metadata: Uint8Array;
}): AnnouncementEvent {
  const metadata = Buffer.from(account.metadata).toString("utf8");
  const parsed = parseMetadata(metadata);
  return {
    sender: account.sender.toBase58(),
    actor: account.sender.toBase58(),
    stealthAddress: new PublicKey(account.stealthAddress).toBase58(),
    ephemeralPublicKey: bytesToHex(account.ephemeralPublicKey),
    metadata,
    timestamp:
      typeof parsed.timestamp === "number"
        ? parsed.timestamp
        : Math.floor(Date.now() / 1000),
    transactionHash: account.address.toBase58(),
  };
}

export function parseMetadata(metadata: string): ParsedMetadata {
  try {
    return JSON.parse(metadata) as ParsedMetadata;
  } catch {
    return {};
  }
}

export async function scanForIncomingTransfers(
  _provider: unknown,
  viewingKeyPrivate: string
): Promise<AnnouncementEvent[]> {
  const accounts = await fetchAnnouncements(getConnection(), cypherProgramId);
  return accounts
    .map(toEvent)
    .filter((event) => {
      try {
        return (
          computeStealthAddress(
            viewingKeyPrivate,
            event.ephemeralPublicKey
          ) === event.stealthAddress
        );
      } catch {
        return false;
      }
    });
}

export async function scanForOutgoingTransfers(
  _provider: unknown,
  address: string
): Promise<AnnouncementEvent[]> {
  const accounts = await fetchAnnouncements(getConnection(), cypherProgramId);
  return accounts.map(toEvent).filter((event) => event.sender === address);
}

export async function getAnnouncementsForAddress(
  provider: unknown,
  address: string
): Promise<AnnouncementEvent[]> {
  return scanForOutgoingTransfers(provider, address);
}

export async function announceStealthAddress(): Promise<string> {
  throw new Error("Use announceStealthTransaction");
}
