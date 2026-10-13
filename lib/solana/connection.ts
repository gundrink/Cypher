import { Connection } from "@solana/web3.js";

import { publicEnv } from "@/lib/solana/env";

let connection: Connection | null = null;

export function getConnection(): Connection {
  if (!connection) {
    connection = new Connection(publicEnv.rpcUrl, "confirmed");
  }
  return connection;
}
