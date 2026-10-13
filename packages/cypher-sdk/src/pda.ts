import { PublicKey } from "@solana/web3.js";

import { writeU64 } from "./codec";

export function registryAddress(programId: PublicKey): PublicKey {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("registry")],
    programId
  )[0];
}

export function usernameAddress(
  programId: PublicKey,
  username: string
): PublicKey {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("username"), Buffer.from(username, "utf8")],
    programId
  )[0];
}

export function ownerRecordAddress(
  programId: PublicKey,
  owner: PublicKey
): PublicKey {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("owner"), owner.toBuffer()],
    programId
  )[0];
}

export function announcementAddress(
  programId: PublicKey,
  sender: PublicKey,
  index: bigint
): PublicKey {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("announce"), sender.toBuffer(), writeU64(index)],
    programId
  )[0];
}
