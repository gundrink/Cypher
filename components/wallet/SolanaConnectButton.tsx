"use client";

import { useSyncExternalStore } from "react";

import { useAppKit, useAppKitAccount, useDisconnect } from "@reown/appkit/react";

import { Button } from "@/components/ui/button";

function shorten(address: string): string {
  return `${address.slice(0, 4)}…${address.slice(-4)}`;
}

function useIsClient(): boolean {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );
}

export function SolanaConnectButton() {
  const { open } = useAppKit();
  const { address, isConnected } = useAppKitAccount();
  const { disconnect } = useDisconnect();
  const mounted = useIsClient();

  if (!mounted) {
    return (
      <Button type="button" disabled>
        Connect
      </Button>
    );
  }

  if (isConnected && address) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-foreground">
          {shorten(address)}
        </span>
        <Button type="button" variant="outline" onClick={() => disconnect()}>
          Disconnect
        </Button>
      </div>
    );
  }

  return (
    <Button type="button" onClick={() => open()}>
      Connect
    </Button>
  );
}
