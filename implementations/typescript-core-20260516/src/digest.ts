import { createHash } from "crypto";
import { blake3 } from "@noble/hashes/blake3.js";

export function digestBytes(data: Buffer, digestAlg: string): Buffer {
  if (digestAlg === "SHA-256") {
    return createHash("sha256").update(data).digest();
  }
  if (digestAlg === "SHA-384") {
    return createHash("sha384").update(data).digest();
  }
  if (digestAlg === "SHA-512") {
    return createHash("sha512").update(data).digest();
  }
  if (digestAlg === "BLAKE3") {
    return Buffer.from(blake3(data));
  }
  if (digestAlg === "BLAKE2b") {
    return createHash("blake2b512").update(data).digest();
  }
  throw new Error(`unknown digest algorithm: ${digestAlg}`);
}
