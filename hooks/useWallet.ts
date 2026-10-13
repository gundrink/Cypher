"use client";

import { useCallback, useSyncExternalStore } from "react";

import { useAppKitAccount, useAppKitProvider, useDisconnect } from "@reown/appkit/react";
import { Transaction } from "@solana/web3.js";

import { bytesToHex } from "@/lib/blockchain/bytes";
import { clearSession } from "@/lib/utils/session";
import { clearWalletSignature } from "@/lib/utils/wallet-signature";

import type { Provider } from "@reown/appkit-adapter-solana/react";

function useIsClient(): boolean {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );
}

function signatureOf(result: string | { signature: string }): string {
  return typeof result === "string" ? result : result.signature;
}

export function useWallet() {
  const mounted = useIsClient();
  const { address, isConnected, status } = useAppKitAccount();
  const { walletProvider } = useAppKitProvider<Provider>("solana");
  const { disconnect } = useDisconnect();
  const ready =
    mounted && status !== "connecting" && status !== "reconnecting";
  const walletAddress = address ?? null;

  const signMessage = useCallback(
    async (message: Uint8Array): Promise<Uint8Array> => {
      if (!walletProvider) {
        throw new Error("Please connect your wallet first");
      }
      const signed = await walletProvider.signMessage(message);
      return signed instanceof Uint8Array ? signed : new Uint8Array(signed);
    },
    [walletProvider]
  );

  const sendTransaction = useCallback(
    async (transaction: Transaction): Promise<string> => {
      if (!walletProvider) {
        throw new Error("Please connect your wallet first");
      }
      return signatureOf(await walletProvider.signAndSendTransaction(transaction));
    },
    [walletProvider]
  );

  const logout = useCallback(async () => {
    clearSession();
    clearWalletSignature();
    await disconnect();
  }, [disconnect]);

  return {
    address: walletAddress,
    walletAddress,
    isConnected: Boolean(isConnected && walletAddress),
    authenticated: Boolean(ready && isConnected && walletAddress),
    isLoading: !ready,
    ready,
    signMessage,
    sendTransaction,
    logout,
    sender: walletAddress
      ? {
          address: walletAddress,
          signMessage,
          sendTransaction,
        }
      : null,
  };
}

export function signatureHex(signature: Uint8Array): string {
  return bytesToHex(signature);
}
