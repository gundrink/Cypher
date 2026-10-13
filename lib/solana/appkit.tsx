"use client";

import { Buffer } from "buffer";

import type { ReactNode } from "react";

import { solana, solanaDevnet, solanaTestnet } from "@reown/appkit/networks";
import { createAppKit, type CreateAppKit } from "@reown/appkit/react";
import { SolanaAdapter } from "@reown/appkit-adapter-solana/react";

import { publicEnv } from "@/lib/solana/env";

if (typeof globalThis.Buffer === "undefined") {
  globalThis.Buffer = Buffer;
}

const solanaAdapter = new SolanaAdapter();
const origin =
  typeof window === "undefined" ? publicEnv.appUrl : window.location.origin;

function networkFor(cluster: string) {
  if (cluster === "testnet") return solanaTestnet;
  if (cluster === "mainnet" || cluster === "mainnet-beta") return solana;
  return solanaDevnet;
}

const network = networkFor(publicEnv.cluster);

createAppKit({
  adapters: [solanaAdapter],
  networks: [network],
  defaultNetwork: network,
  projectId: publicEnv.reownProjectId,
  metadata: {
    name: "Cypher",
    description: "Your crypto, truly private.",
    url: origin,
    icons: [`${origin}/icon.svg`],
  },
  features: {
    analytics: false,
    email: false,
    socials: false,
  },
  themeMode: "dark",
  themeVariables: {
    "--w3m-accent": "#0052FF",
    "--w3m-color-mix": "#0f172a",
    "--w3m-color-mix-strength": 20,
  },
  basic: true,
} as unknown as CreateAppKit);

export function CypherWalletProvider({ children }: { children: ReactNode }) {
  return children;
}
