import { Connection } from "@solana/web3.js";

import { getConnection } from "@/lib/solana/connection";

export function useBaseProvider(): Connection {
  return getConnection();
}
