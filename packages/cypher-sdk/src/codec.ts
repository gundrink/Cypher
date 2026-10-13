import { PublicKey } from "@solana/web3.js";

export function writeString(value: string): Buffer {
  const bytes = Buffer.from(value, "utf8");
  const out = Buffer.alloc(4 + bytes.length);
  out.writeUInt32LE(bytes.length, 0);
  bytes.copy(out, 4);
  return out;
}

export function writeBytes(value: Uint8Array): Buffer {
  const out = Buffer.alloc(4 + value.length);
  out.writeUInt32LE(value.length, 0);
  Buffer.from(value).copy(out, 4);
  return out;
}

// Browser Buffer polyfills (Next.js ships buffer@5) lack the BigInt read/write methods.
export function readU64(data: Uint8Array, offset: number): bigint {
  assertLength(data, offset, 8);
  return new DataView(
    data.buffer,
    data.byteOffset,
    data.byteLength
  ).getBigUint64(offset, true);
}

export function writeU64(value: bigint): Buffer {
  const out = Buffer.alloc(8);
  new DataView(out.buffer, out.byteOffset, out.byteLength).setBigUint64(
    0,
    value,
    true
  );
  return out;
}

export function assertLength(
  data: Uint8Array,
  offset: number,
  size: number
): void {
  if (offset + size > data.length) {
    throw new Error("Account data is truncated.");
  }
}

export function readPubkey(
  data: Buffer,
  offset: number
): { value: PublicKey; offset: number } {
  assertLength(data, offset, 32);
  return {
    value: new PublicKey(data.subarray(offset, offset + 32)),
    offset: offset + 32,
  };
}

export function readString(
  data: Buffer,
  offset: number
): { value: string; offset: number } {
  assertLength(data, offset, 4);
  const length = data.readUInt32LE(offset);
  const start = offset + 4;
  assertLength(data, start, length);
  return {
    value: data.subarray(start, start + length).toString("utf8"),
    offset: start + length,
  };
}

export function readBytes(
  data: Buffer,
  offset: number
): { value: Uint8Array; offset: number } {
  assertLength(data, offset, 4);
  const length = data.readUInt32LE(offset);
  const start = offset + 4;
  assertLength(data, start, length);
  return {
    value: Uint8Array.from(data.subarray(start, start + length)),
    offset: start + length,
  };
}

export function matchesDiscriminator(
  data: Uint8Array,
  discriminator: Uint8Array
): boolean {
  if (data.length < discriminator.length) return false;
  for (let index = 0; index < discriminator.length; index += 1) {
    if (data[index] !== discriminator[index]) return false;
  }
  return true;
}
