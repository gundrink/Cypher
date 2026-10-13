import type { Transaction } from "@solana/web3.js";

export interface WalletSender {
  address: string;
  signMessage: (message: Uint8Array) => Promise<Uint8Array>;
  sendTransaction: (transaction: Transaction) => Promise<string>;
}
