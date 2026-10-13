import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { ed25519, x25519 } from "@noble/curves/ed25519";
import { sha256 } from "@noble/hashes/sha2";
import {
  Connection,
  Keypair,
  LAMPORTS_PER_SOL,
  sendAndConfirmTransaction,
  SystemProgram,
  Transaction,
} from "@solana/web3.js";
import { createJiti } from "jiti";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");

for (const line of readFileSync(resolve(root, ".env"), "utf8").split("\n")) {
  const match = line.match(/^(NEXT_PUBLIC_[A-Z0-9_]+)=(.*)$/);
  if (match && !process.env[match[1]]) process.env[match[1]] = match[2].trim();
}

const store = new Map();
globalThis.window = globalThis;
globalThis.localStorage = {
  getItem: (key) => (store.has(key) ? store.get(key) : null),
  setItem: (key, value) => store.set(key, String(value)),
  removeItem: (key) => store.delete(key),
  clear: () => store.clear(),
};

const jiti = createJiti(import.meta.url, {
  alias: {
    "@cypher/sdk": resolve(root, "packages/cypher-sdk/src/index.ts"),
    "@": root,
  },
});

const registry = await jiti.import("@/lib/blockchain/registry.ts");
const stealth = await jiti.import("@/lib/blockchain/stealth.ts");
const metaKeys = await jiti.import("@/lib/blockchain/meta-keys.ts");
const scanner = await jiti.import("@/lib/blockchain/scanner.ts");
const announcement = await jiti.import("@/lib/blockchain/announcement.ts");
const tokens = await jiti.import("@/lib/blockchain/tokens.ts");
const recovery = await jiti.import("@/lib/blockchain/recovery.ts");
const walletSignature = await jiti.import("@/lib/utils/wallet-signature.ts");
const { getConnection } = await jiti.import("@/lib/solana/connection.ts");
const { hexToBytes } = await jiti.import("@/lib/blockchain/bytes.ts");

const connection = getConnection();
const deployer = Keypair.fromSecretKey(
  Uint8Array.from(
    JSON.parse(readFileSync(resolve(root, "keys/deployer.json"), "utf8"))
  )
);

const results = [];
async function step(name, fn) {
  try {
    const detail = await fn();
    results.push({ name, ok: true, detail: detail ?? "" });
    console.log(`PASS  ${name}${detail ? `  (${detail})` : ""}`);
  } catch (error) {
    results.push({ name, ok: false, detail: error.message });
    console.log(`FAIL  ${name}  -> ${error.message}`);
  }
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function senderFor(keypair) {
  return {
    address: keypair.publicKey.toBase58(),
    signMessage: async (message) =>
      ed25519.sign(message, keypair.secretKey.slice(0, 32)),
    sendTransaction: async (transaction) => {
      transaction.sign(keypair);
      const signature = await connection.sendRawTransaction(
        transaction.serialize()
      );
      const { blockhash, lastValidBlockHeight } =
        await connection.getLatestBlockhash("confirmed");
      const confirmation = await connection.confirmTransaction(
        {
          signature,
          blockhash: transaction.recentBlockhash ?? blockhash,
          lastValidBlockHeight:
            transaction.lastValidBlockHeight ?? lastValidBlockHeight,
        },
        "confirmed"
      );
      if (confirmation.value.err) {
        throw new Error(`Transaction failed: ${JSON.stringify(confirmation.value.err)}`);
      }
      return signature;
    },
  };
}

async function fund(keypair, sol) {
  await sendAndConfirmTransaction(
    connection,
    new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: deployer.publicKey,
        toPubkey: keypair.publicKey,
        lamports: Math.round(sol * LAMPORTS_PER_SOL),
      })
    ),
    [deployer]
  );
}

const suffix = Date.now().toString(36).slice(-6);
const alice = { keypair: Keypair.generate(), name: `e2e_alice_${suffix}`, pin: "123456" };
const bob = { keypair: Keypair.generate(), name: `e2e_bob_${suffix}`, pin: "654321" };
alice.sender = senderFor(alice.keypair);
bob.sender = senderFor(bob.keypair);

let stealthAddress = "";
let ephemeralPublicKey = "";

await step("Fund test wallets from deployer", async () => {
  await fund(alice.keypair, 0.06);
  await fund(bob.keypair, 0.02);
  return `alice=${alice.sender.address.slice(0, 6)}… bob=${bob.sender.address.slice(0, 6)}…`;
});

for (const user of [alice, bob]) {
  await step(`Onboarding: register @${user.name}`, async () => {
    assert(
      await registry.checkUsernameAvailability(null, user.name),
      "username reported as taken before registration"
    );
    store.clear();
    const signature = await walletSignature.getOrCreateWalletSignature(
      user.sender.signMessage,
      user.sender.address
    );
    user.signature = signature;
    user.keys = await metaKeys.deriveMetaKeys(user.sender.address, signature, user.pin);
    const tx = await registry.registerUsername(user.sender, user.name, user.keys.metaViewPub);
    assert(
      !(await registry.checkUsernameAvailability(null, user.name)),
      "username still available after registration"
    );
    assert(
      (await registry.getUsername(null, user.sender.address)) === user.name,
      "reverse lookup (owner -> username) mismatch"
    );
    assert(
      (await registry.getViewingKey(null, user.name)) === user.keys.metaViewPub,
      "on-chain viewing key mismatch"
    );
    assert(
      (await registry.getAddress(null, user.name)) === user.sender.address,
      "username -> owner address mismatch"
    );
    return `tx ${tx.slice(0, 10)}…`;
  });
}

await step("Onboarding: duplicate username is rejected", async () => {
  const intruder = Keypair.generate();
  await fund(intruder, 0.01);
  try {
    await registry.registerUsername(senderFor(intruder), bob.name, alice.keys.metaViewPub);
  } catch {
    return "rejected on-chain";
  }
  throw new Error("second registration of the same username succeeded");
});

await step("Recovery: same wallet + PIN re-derives the same keys", async () => {
  store.clear();
  const keys = await recovery.recoverMetaKeys(bob.sender.address, bob.pin, bob.sender.signMessage);
  assert(keys.metaViewPriv === bob.keys.metaViewPriv, "view key differs after recovery");
  assert(keys.metaSpendPriv === bob.keys.metaSpendPriv, "spend key differs after recovery");
});

await step("Recovery: wrong PIN is rejected", async () => {
  store.clear();
  try {
    await recovery.recoverMetaKeys(bob.sender.address, "000000", bob.sender.signMessage);
  } catch (error) {
    assert(error.message.includes("PIN is invalid"), `unexpected error: ${error.message}`);
    return "PIN is invalid";
  }
  throw new Error("wrong PIN was accepted");
});

await step("Private send: 0.01 SOL from @alice to @bob via stealth address", async () => {
  const viewingKey = await registry.getViewingKey(null, bob.name);
  const result = stealth.generateStealthAddress(viewingKey);
  stealthAddress = result.stealthAddress;
  ephemeralPublicKey = result.ephemeralPublicKey;
  const receipt = await tokens.sendToken(alice.sender, tokens.BASE_TOKENS.SOL, stealthAddress, "0.01");
  const balance = await connection.getBalance(new (await import("@solana/web3.js")).PublicKey(stealthAddress));
  assert(balance === 0.01 * LAMPORTS_PER_SOL, `stealth balance is ${balance}`);
  return `stealth ${stealthAddress.slice(0, 6)}…, tx ${receipt.hash.slice(0, 10)}…`;
});

await step("Private send: announcement recorded on-chain", async () => {
  const tx = await announcement.announceStealthTransaction(
    alice.sender,
    stealthAddress,
    ephemeralPublicKey,
    { amount: "0.01", tokenSymbol: "SOL" }
  );
  return `tx ${tx.slice(0, 10)}…`;
});

await step("Receive: @bob's scanner finds the payment", async () => {
  let events = [];
  let match;
  for (let attempt = 0; attempt < 6 && !match; attempt += 1) {
    if (attempt) await new Promise((done) => setTimeout(done, 2000));
    events = await scanner.scanForIncomingTransfers(null, bob.keys.metaViewPriv);
    match = events.find((event) => event.stealthAddress === stealthAddress);
  }
  assert(match, `not found among ${events.length} matching announcements`);
  const meta = scanner.parseMetadata(match.metadata);
  assert(meta.amount === "0.01" && meta.tokenSymbol === "SOL", `metadata ${match.metadata}`);
  return `${events.length} incoming, metadata ok`;
});

await step("Receive: @alice's scanner does NOT see @bob's payment", async () => {
  const events = await scanner.scanForIncomingTransfers(null, alice.keys.metaViewPriv);
  assert(!events.some((event) => event.stealthAddress === stealthAddress), "privacy leak");
});

await step("History: @alice's outgoing scan lists the announcement", async () => {
  const events = await scanner.scanForOutgoingTransfers(null, alice.sender.address);
  assert(events.some((event) => event.stealthAddress === stealthAddress), "outgoing missing");
});

await step("Dashboard: @bob's balance includes the stealth payment", async () => {
  const balances = await tokens.getMultipleTokenBalancesWithStealth(
    null,
    [{ symbol: "SOL", name: "Solana", address: "native", decimals: 9 }],
    bob.sender.address,
    bob.keys.metaViewPriv
  );
  const main = await connection.getBalance(bob.keypair.publicKey);
  const expected = (main + 0.01 * LAMPORTS_PER_SOL) / LAMPORTS_PER_SOL;
  assert(Math.abs(Number(balances.SOL) - expected) < 1e-9, `SOL=${balances.SOL}, expected ${expected}`);
  return `SOL ${balances.SOL}`;
});

await step("Public send: 0.001 SOL from @alice to @bob by username", async () => {
  const before = await connection.getBalance(bob.keypair.publicKey);
  const to = await registry.getAddress(null, bob.name);
  await tokens.sendToken(alice.sender, tokens.BASE_TOKENS.SOL, to, "0.001");
  const after = await connection.getBalance(bob.keypair.publicKey);
  assert(after - before === 0.001 * LAMPORTS_PER_SOL, `delta ${after - before}`);
});

await step("Send guard: insufficient USDC is caught before signing", async () => {
  try {
    await tokens.sendToken(alice.sender, tokens.BASE_TOKENS.USDC, bob.sender.address, "1");
  } catch (error) {
    assert(error.message.includes("Insufficient USDC"), error.message);
    return error.message;
  }
  throw new Error("USDC send without balance did not fail");
});

await step("Send guard: private send below rent minimum to a fresh stealth address", async () => {
  const fresh = stealth.generateStealthAddress(bob.keys.metaViewPub);
  try {
    await tokens.sendToken(alice.sender, tokens.BASE_TOKENS.SOL, fresh.stealthAddress, "0.0005");
  } catch (error) {
    assert(error.message.includes("Minimum"), `unfriendly error: ${error.message.slice(0, 80)}`);
    return error.message;
  }
  throw new Error("0.0005 SOL to a fresh account unexpectedly succeeded");
});

await step("Spend: @bob can derive the stealth key and withdraw", async () => {
  const shared = x25519.getSharedSecret(
    hexToBytes(bob.keys.metaViewPriv),
    hexToBytes(ephemeralPublicKey)
  );
  const stealthKeypair = Keypair.fromSeed(sha256(shared));
  assert(stealthKeypair.publicKey.toBase58() === stealthAddress, "derived key mismatch");
  const balance = await connection.getBalance(stealthKeypair.publicKey);
  const fee = 5000;
  await sendAndConfirmTransaction(
    connection,
    new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: stealthKeypair.publicKey,
        toPubkey: bob.keypair.publicKey,
        lamports: balance - fee,
      })
    ),
    [stealthKeypair]
  );
  return `withdrew ${(balance - fee) / LAMPORTS_PER_SOL} SOL (manual, no UI)`;
});

await step("Cleanup: return leftover test SOL to deployer", async () => {
  let total = 0;
  for (const keypair of [alice.keypair, bob.keypair]) {
    const balance = await connection.getBalance(keypair.publicKey);
    if (balance <= 5000) continue;
    await sendAndConfirmTransaction(
      connection,
      new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: keypair.publicKey,
          toPubkey: deployer.publicKey,
          lamports: balance - 5000,
        })
      ),
      [keypair]
    );
    total += balance - 5000;
  }
  return `${total / LAMPORTS_PER_SOL} SOL returned`;
});

const failed = results.filter((result) => !result.ok);
console.log(`\n${results.length - failed.length}/${results.length} passed`);
process.exit(failed.length ? 1 : 0);
