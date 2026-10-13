import { readFileSync } from "node:fs";

import {
  Connection,
  Keypair,
  PublicKey,
  sendAndConfirmTransaction,
  SystemProgram,
  Transaction,
  TransactionInstruction,
} from "@solana/web3.js";

const INITIALIZE_DISCRIMINATOR = [175, 175, 109, 31, 13, 152, 155, 237];

const rpcUrl = process.env.SOLANA_RPC_URL ?? "https://api.devnet.solana.com";
const programId = new PublicKey(
  process.env.CYPHER_PROGRAM_ID ?? "9TBbzTqU4PhnteAmzZE4Y9ZcHhrXjhpdkFoQS8LBKdEq"
);
const keypairPath = process.env.DEPLOYER_KEYPAIR_PATH ?? "keys/deployer.json";

const admin = Keypair.fromSecretKey(
  Uint8Array.from(JSON.parse(readFileSync(keypairPath, "utf8")))
);
const connection = new Connection(rpcUrl, "confirmed");
const [registry] = PublicKey.findProgramAddressSync(
  [Buffer.from("registry")],
  programId
);

if (await connection.getAccountInfo(registry)) {
  console.log(`Registry already initialized: ${registry.toBase58()}`);
  process.exit(0);
}

const instruction = new TransactionInstruction({
  programId,
  keys: [
    { pubkey: registry, isSigner: false, isWritable: true },
    { pubkey: admin.publicKey, isSigner: true, isWritable: true },
    { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
  ],
  data: Buffer.from(INITIALIZE_DISCRIMINATOR),
});

const signature = await sendAndConfirmTransaction(
  connection,
  new Transaction().add(instruction),
  [admin]
);
console.log(`Registry initialized: ${registry.toBase58()}`);
console.log(`Admin: ${admin.publicKey.toBase58()}`);
console.log(`Signature: ${signature}`);
