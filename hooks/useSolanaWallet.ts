"use client";

import { useAppKitAccount, useAppKitProvider } from "@reown/appkit/react";

import type { Provider } from "@reown/appkit-adapter-solana/react";

export function useSolanaWallet() {
  const { address, isConnected, status } = useAppKitAccount();
  const { walletProvider } = useAppKitProvider<Provider>("solana");

  return {
    address,
    isConnected,
    status,
    walletProvider,
  };
}
