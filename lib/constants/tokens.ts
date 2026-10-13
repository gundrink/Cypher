export interface AvailableToken {
  name: string;
  symbol: string;
  address: string;
  decimals: number;
  logoURI?: string;
  tradable?: boolean;
  priceUSD?: number;
}

/** Icon path (under public) for each token used in Send UI */
export const TOKEN_ICONS: Record<string, string> = {
  ETH: "/assets/eth.png",
  CDT: "/assets/cdt.png",
} as const;

export interface SendTokenOption {
  symbol: "SOL" | "USDC";
  name: string;
  logoURI?: string;
}

/** Token options for Send page (symbol, name, icon from constants) */
export const SEND_TOKEN_OPTIONS: SendTokenOption[] = [
  { symbol: "SOL", name: "Solana" },
  { symbol: "USDC", name: "USD Coin" },
];

export const AVAILABLE_TOKENS: AvailableToken[] = [
  {
    name: "Solana",
    symbol: "SOL",
    address: "native",
    decimals: 9,
    tradable: true,
  },
  {
    name: "USD Coin",
    symbol: "USDC",
    address: "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU",
    decimals: 6,
    tradable: true,
  },
];
