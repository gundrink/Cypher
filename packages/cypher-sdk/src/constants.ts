/** Account sizes must match `programs/cypher/src/lib.rs`. */
export const ACCOUNT_SPACE = {
  registry: 49,
  username: 114,
  owner: 45,
  announcement: 289,
} as const;

export const MAX_USERNAME_LEN = 32;
export const MAX_METADATA_LEN = 128;

export const DISC = {
  initialize: Uint8Array.from([175, 175, 109, 31, 13, 152, 155, 237]),
  registerUsername: Uint8Array.from([134, 54, 123, 181, 28, 151, 36, 0]),
  announce: Uint8Array.from([7, 30, 100, 250, 110, 253, 3, 149]),
  registry: Uint8Array.from([47, 174, 110, 246, 184, 182, 252, 218]),
  username: Uint8Array.from([42, 172, 136, 41, 240, 123, 100, 204]),
  owner: Uint8Array.from([5, 36, 17, 69, 246, 236, 83, 166]),
  announcement: Uint8Array.from([73, 38, 210, 135, 9, 143, 191, 105]),
} as const;

/** Left on the sender so the account stays rent-exempt and the fee can be paid. */
export const SOL_FEE_RESERVE = 890_880n + 10_000n;
export const LAMPORTS_PER_SOL = 1_000_000_000n;
