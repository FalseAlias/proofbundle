/**
 * Digest dispatch for ProofBundle.
 * SHA-256, SHA-384, SHA-512 via Web Crypto.
 * BLAKE3 and BLAKE2b via @noble/hashes.
 */

import { blake3 } from '@noble/hashes/blake3';
import { blake2b } from '@noble/hashes/blake2b';
import type { DigestAlgorithm } from './types.js';

const webAlgMap: Record<string, string> = {
  'SHA-256': 'SHA-256',
  'SHA-384': 'SHA-384',
  'SHA-512': 'SHA-512',
};

export class DigestError extends Error {
  constructor(msg: string) {
    super(msg);
    this.name = 'DigestError';
  }
}

function getWebCrypto(): Crypto {
  if (typeof globalThis !== 'undefined' && globalThis.crypto) {
    return globalThis.crypto;
  }
  throw new DigestError('Web Crypto not available');
}

export async function digest(alg: DigestAlgorithm, data: Uint8Array): Promise<Uint8Array> {
  if (webAlgMap[alg]) {
    const wc = getWebCrypto();
    const buf = await wc.subtle.digest(webAlgMap[alg], data as unknown as ArrayBuffer);
    return new Uint8Array(buf);
  }

  if (alg === 'BLAKE3') {
    return blake3(data);
  }

  if (alg === 'BLAKE2b') {
    return blake2b(data, { dkLen: 64 });
  }

  throw new DigestError(`unknown digest algorithm: ${alg}`);
}

export function digestSync(alg: DigestAlgorithm, data: Uint8Array): Uint8Array {
  if (alg === 'BLAKE3') {
    return blake3(data);
  }
  if (alg === 'BLAKE2b') {
    return blake2b(data, { dkLen: 64 });
  }
  throw new DigestError(`synchronous digest only for noble algorithms, got: ${alg}`);
}
