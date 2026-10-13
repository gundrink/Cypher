import { PublicKey } from "@solana/web3.js";

function required(name: string, value: string | undefined): string {
  const trimmed = value?.trim() ?? "";
  if (!trimmed) {
    throw new Error(`${name} is not set`);
  }
  return trimmed;
}

function optional(value: string | undefined): string {
  return value?.trim() ?? "";
}

export const publicEnv = {
  reownProjectId: required(
    "NEXT_PUBLIC_REOWN_PROJECT_ID",
    process.env.NEXT_PUBLIC_REOWN_PROJECT_ID
  ),
  appUrl: optional(process.env.NEXT_PUBLIC_APP_URL) || "http://localhost:3000",
  cluster: required(
    "NEXT_PUBLIC_SOLANA_CLUSTER",
    process.env.NEXT_PUBLIC_SOLANA_CLUSTER
  ),
  rpcUrl: required(
    "NEXT_PUBLIC_SOLANA_RPC_URL",
    process.env.NEXT_PUBLIC_SOLANA_RPC_URL
  ),
  splTokenProgram: required(
    "NEXT_PUBLIC_SPL_TOKEN_PROGRAM",
    process.env.NEXT_PUBLIC_SPL_TOKEN_PROGRAM
  ),
  associatedTokenProgram: required(
    "NEXT_PUBLIC_ASSOCIATED_TOKEN_PROGRAM",
    process.env.NEXT_PUBLIC_ASSOCIATED_TOKEN_PROGRAM
  ),
  referenceUsdc: required(
    "NEXT_PUBLIC_REFERENCE_USDC_DEVNET",
    process.env.NEXT_PUBLIC_REFERENCE_USDC_DEVNET
  ),
  programId: required(
    "NEXT_PUBLIC_CYPHER_PROGRAM_ID",
    process.env.NEXT_PUBLIC_CYPHER_PROGRAM_ID
  ),
  xUrl: optional(process.env.NEXT_PUBLIC_X_URL),
  ca: optional(process.env.NEXT_PUBLIC_CA),
};

export const cypherProgramId = new PublicKey(publicEnv.programId);
export const tokenProgramId = new PublicKey(publicEnv.splTokenProgram);
export const associatedTokenProgramId = new PublicKey(
  publicEnv.associatedTokenProgram
);
export const referenceUsdcMint = new PublicKey(publicEnv.referenceUsdc);

export const walletTokens = [
  { symbol: "SOL", name: "Solana", decimals: 9, mint: null },
  {
    symbol: "USDC",
    name: "USD Coin",
    decimals: 6,
    mint: publicEnv.referenceUsdc,
  },
] as const;
