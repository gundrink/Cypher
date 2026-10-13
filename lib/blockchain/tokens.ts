import { PublicKey } from "@solana/web3.js";

import { formatTokenAmount, parseTokenAmount } from "@cypher/sdk";

import type { AvailableToken } from "@/lib/constants/tokens";
import { getConnection } from "@/lib/solana/connection";
import { createTransferTransaction, getBalance } from "@/lib/solana/cypher";
import { referenceUsdcMint } from "@/lib/solana/env";

import { scanForIncomingTransfers } from "./scanner";

import type { WalletSender } from "./wallet-sender";

export interface TokenInfo {
  symbol: string;
  name: string;
  address: string;
  decimals: number;
  logoURI?: string;
}

export const BASE_TOKENS: Record<string, TokenInfo> = {
  SOL: {
    symbol: "SOL",
    name: "Solana",
    address: "native",
    decimals: 9,
  },
  USDC: {
    symbol: "USDC",
    name: "USD Coin",
    address: referenceUsdcMint.toBase58(),
    decimals: 6,
  },
};

function mintFor(token: Pick<TokenInfo, "address">): PublicKey | null {
  return token.address === "native" ? null : new PublicKey(token.address);
}

function addAmounts(left: string, right: string, decimals: number): string {
  const leftAmount = parseTokenAmount(left, decimals) ?? 0n;
  const rightAmount = parseTokenAmount(right, decimals) ?? 0n;
  return formatTokenAmount(leftAmount + rightAmount, decimals);
}

export async function getTokenBalance(
  _provider: unknown,
  tokenInfo: Pick<TokenInfo, "address" | "decimals">,
  userAddress: string
): Promise<string> {
  try {
    const amount = await getBalance(new PublicKey(userAddress), mintFor(tokenInfo));
    return formatTokenAmount(amount, tokenInfo.decimals);
  } catch {
    return "0";
  }
}

export async function getStealthAddresses(
  provider: unknown,
  viewingKeyPrivate: string
): Promise<string[]> {
  try {
    const events = await scanForIncomingTransfers(provider, viewingKeyPrivate);
    return [...new Set(events.map((event) => event.stealthAddress))];
  } catch {
    return [];
  }
}

export async function getTokenBalanceWithStealth(
  provider: unknown,
  tokenInfo: AvailableToken,
  mainAddress: string,
  stealthAddresses: string[]
): Promise<string> {
  try {
    let total = await getTokenBalance(provider, tokenInfo, mainAddress);
    for (const stealthAddress of stealthAddresses) {
      const balance = await getTokenBalance(provider, tokenInfo, stealthAddress);
      total = addAmounts(total, balance, tokenInfo.decimals);
    }
    return total;
  } catch (error) {
    console.error(`Error getting balance for ${tokenInfo.symbol}:`, error);
    return "0";
  }
}

export async function getMultipleTokenBalancesWithStealth(
  provider: unknown,
  tokens: AvailableToken[],
  mainAddress: string,
  viewingKeyPrivate: string | null
): Promise<Record<string, string>> {
  const stealthAddresses = viewingKeyPrivate
    ? await getStealthAddresses(provider, viewingKeyPrivate)
    : [];
  const balances: Record<string, string> = {};
  await Promise.all(
    tokens.map(async (token) => {
      balances[token.symbol] = await getTokenBalanceWithStealth(
        provider,
        token,
        mainAddress,
        stealthAddresses
      );
    })
  );
  return balances;
}

export async function sendToken(
  sender: WalletSender,
  tokenInfo: TokenInfo,
  toAddress: string,
  amount: string
): Promise<{ hash: string }> {
  const parsed = parseTokenAmount(amount, tokenInfo.decimals);
  if (parsed === null || parsed <= 0n) {
    throw new Error("Enter a valid amount");
  }
  const from = new PublicKey(sender.address);
  const mint = mintFor(tokenInfo);
  const balance = await getBalance(from, mint);
  if (balance < parsed) {
    throw new Error(`Insufficient ${tokenInfo.symbol} balance`);
  }
  const to = new PublicKey(toAddress);
  if (!mint && !(await getConnection().getAccountInfo(to))) {
    const minimum = BigInt(
      await getConnection().getMinimumBalanceForRentExemption(0)
    );
    if (parsed < minimum) {
      throw new Error(
        `Minimum ${formatTokenAmount(minimum, tokenInfo.decimals)} SOL is required to send to a new address`
      );
    }
  }
  const transaction = await createTransferTransaction({
    from,
    to,
    mint,
    amount: parsed,
  });
  const hash = await sender.sendTransaction(transaction);
  return { hash };
}
