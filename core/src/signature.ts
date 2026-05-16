/**
 * Key generation, export, import, sign, and verify for ProofBundle.
 * Ed25519, ECDSA-P256/384/521, RSA-PSS-2048/3072/4096 via Web Crypto API.
 */

import { ed25519 } from '@noble/curves/ed25519';
import type { SignatureAlgorithm } from './types.js';

export class SignatureError extends Error {
  constructor(msg: string) {
    super(msg);
    this.name = 'SignatureError';
  }
}

function wc(): Crypto {
  if (typeof globalThis !== 'undefined' && globalThis.crypto) {
    return globalThis.crypto;
  }
  throw new SignatureError('Web Crypto not available');
}

export interface KeyPair {
  publicKey: CryptoKey;
  privateKey: CryptoKey;
}

type EcdsaAlg = 'ECDSA-P256' | 'ECDSA-P384' | 'ECDSA-P521';
type RsaAlg = 'RSA-PSS-2048' | 'RSA-PSS-3072' | 'RSA-PSS-4096';

function isEcdsa(alg: SignatureAlgorithm): alg is EcdsaAlg {
  return alg.startsWith('ECDSA-P');
}

function isRsa(alg: SignatureAlgorithm): alg is RsaAlg {
  return alg.startsWith('RSA-PSS-');
}

function ecdsaCurve(alg: EcdsaAlg): string {
  switch (alg) {
    case 'ECDSA-P256': return 'P-256';
    case 'ECDSA-P384': return 'P-384';
    case 'ECDSA-P521': return 'P-521';
  }
}

function rsaModulusBits(alg: RsaAlg): number {
  switch (alg) {
    case 'RSA-PSS-2048': return 2048;
    case 'RSA-PSS-3072': return 3072;
    case 'RSA-PSS-4096': return 4096;
  }
}

function asBuf(u8: Uint8Array): ArrayBuffer {
  return u8.buffer.slice(u8.byteOffset, u8.byteOffset + u8.byteLength) as ArrayBuffer;
}

export async function generateKeyPair(alg: SignatureAlgorithm): Promise<KeyPair> {
  const w = wc();

  if (alg === 'Ed25519') {
    return w.subtle.generateKey('Ed25519', true, ['sign', 'verify']) as Promise<KeyPair>;
  }

  if (isEcdsa(alg)) {
    return w.subtle.generateKey(
      { name: 'ECDSA', namedCurve: ecdsaCurve(alg) },
      true,
      ['sign', 'verify']
    ) as Promise<KeyPair>;
  }

  if (isRsa(alg)) {
    return w.subtle.generateKey(
      {
        name: 'RSA-PSS',
        modulusLength: rsaModulusBits(alg),
        publicExponent: new Uint8Array([1, 0, 1]),
        hash: 'SHA-256',
      },
      true,
      ['sign', 'verify']
    ) as Promise<KeyPair>;
  }

  throw new SignatureError(`unsupported algorithm: ${alg}`);
}

export async function exportKeyPair(pair: KeyPair, alg: SignatureAlgorithm): Promise<import('./types.js').SerializedKeyPair> {
  const w = wc();
  const pubBuf = await w.subtle.exportKey('spki', pair.publicKey);
  const privBuf = await w.subtle.exportKey('pkcs8', pair.privateKey);
  return {
    publicKey: encodeBase64(new Uint8Array(pubBuf)),
    privateKey: encodeBase64(new Uint8Array(privBuf)),
    algorithm: alg,
  };
}

export async function importPublicKey(alg: SignatureAlgorithm, keyBase64: string): Promise<CryptoKey> {
  const w = wc();
  const data = decodeBase64url(keyBase64);

  if (alg === 'Ed25519') {
    return w.subtle.importKey('spki', asBuf(data), 'Ed25519', true, ['verify']);
  }

  if (isEcdsa(alg)) {
    // Vectors use raw uncompressed point format (65/97/133 bytes)
    // SPKI format would be longer; detect by length
    const isRaw = (
      (alg === 'ECDSA-P256' && data.length === 65) ||
      (alg === 'ECDSA-P384' && data.length === 97) ||
      (alg === 'ECDSA-P521' && data.length === 133)
    );
    const format = isRaw ? 'raw' : 'spki';
    return w.subtle.importKey(format, asBuf(data), { name: 'ECDSA', namedCurve: ecdsaCurve(alg) }, true, ['verify']);
  }

  if (isRsa(alg)) {
    return w.subtle.importKey('spki', asBuf(data), { name: 'RSA-PSS', hash: 'SHA-256' }, true, ['verify']);
  }

  throw new SignatureError(`unsupported algorithm: ${alg}`);
}

export async function importPrivateKey(alg: SignatureAlgorithm, pkcs8Base64: string): Promise<CryptoKey> {
  const w = wc();
  const data = decodeBase64(pkcs8Base64);

  if (alg === 'Ed25519') {
    return w.subtle.importKey('pkcs8', asBuf(data), 'Ed25519', true, ['sign']);
  }

  if (isEcdsa(alg)) {
    return w.subtle.importKey('pkcs8', asBuf(data), { name: 'ECDSA', namedCurve: ecdsaCurve(alg) }, true, ['sign']);
  }

  if (isRsa(alg)) {
    return w.subtle.importKey('pkcs8', asBuf(data), { name: 'RSA-PSS', hash: 'SHA-256' }, true, ['sign']);
  }

  throw new SignatureError(`unsupported algorithm: ${alg}`);
}

export async function importKeyPair(serialized: import('./types.js').SerializedKeyPair): Promise<KeyPair> {
  const [publicKey, privateKey] = await Promise.all([
    importPublicKey(serialized.algorithm, serialized.publicKey),
    importPrivateKey(serialized.algorithm, serialized.privateKey),
  ]);
  return { publicKey, privateKey };
}

export async function sign(alg: SignatureAlgorithm, privateKey: CryptoKey, data: Uint8Array): Promise<Uint8Array> {
  const w = wc();

  if (alg === 'Ed25519') {
    const sig = await w.subtle.sign('Ed25519', privateKey, asBuf(data));
    return new Uint8Array(sig);
  }

  if (isEcdsa(alg)) {
    const hash = alg === 'ECDSA-P256' ? 'SHA-256' : alg === 'ECDSA-P384' ? 'SHA-384' : 'SHA-512';
    const sig = await w.subtle.sign({ name: 'ECDSA', hash }, privateKey, asBuf(data));
    return new Uint8Array(sig);
  }

  if (isRsa(alg)) {
    const saltLength = alg === 'RSA-PSS-2048' ? 32 : alg === 'RSA-PSS-3072' ? 32 : 64;
    const sig = await w.subtle.sign(
      { name: 'RSA-PSS', saltLength },
      privateKey,
      asBuf(data)
    );
    return new Uint8Array(sig);
  }

  throw new SignatureError(`unsupported algorithm: ${alg}`);
}

export async function verify(
  alg: SignatureAlgorithm,
  publicKey: CryptoKey | Uint8Array,
  data: Uint8Array,
  signature: Uint8Array
): Promise<boolean> {
  const w = wc();

  if (alg === 'Ed25519') {
    // Use @noble/curves for Ed25519 - accepts raw 32-byte public key
    if (publicKey instanceof Uint8Array) {
      return ed25519.verify(signature, data, publicKey);
    }
    return w.subtle.verify('Ed25519', publicKey, asBuf(signature), asBuf(data));
  }

  if (isEcdsa(alg)) {
    const hash = alg === 'ECDSA-P256' ? 'SHA-256' : alg === 'ECDSA-P384' ? 'SHA-384' : 'SHA-512';
    return w.subtle.verify({ name: 'ECDSA', hash }, publicKey as CryptoKey, asBuf(signature), asBuf(data));
  }

  if (isRsa(alg)) {
    const saltLength = alg === 'RSA-PSS-2048' ? 32 : alg === 'RSA-PSS-3072' ? 32 : 64;
    return w.subtle.verify(
      { name: 'RSA-PSS', saltLength },
      publicKey as CryptoKey,
      asBuf(signature),
      asBuf(data)
    );
  }

  throw new SignatureError(`unsupported algorithm: ${alg}`);
}

export function encodeBase64(u8: Uint8Array): string {
  if (typeof globalThis !== 'undefined' && 'Buffer' in globalThis) {
    return (globalThis as unknown as { Buffer: { from: (u: Uint8Array) => { toString: (enc: string) => string } } }).Buffer.from(u8).toString('base64');
  }
  const bin = Array.from(u8, b => String.fromCharCode(b)).join('');
  return btoa(bin);
}

export function decodeBase64(s: string): Uint8Array {
  if (typeof globalThis !== 'undefined' && 'Buffer' in globalThis) {
    return new Uint8Array((globalThis as unknown as { Buffer: { from: (s: string, enc: string) => Uint8Array } }).Buffer.from(s, 'base64'));
  }
  const bin = atob(s);
  const u8 = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) {
    u8[i] = bin.charCodeAt(i);
  }
  return u8;
}

export function decodeBase64url(s: string): Uint8Array {
  // Convert base64url to base64, then decode
  let base64 = s.replace(/-/g, '+').replace(/_/g, '/');
  // Add padding if needed
  while (base64.length % 4 !== 0) {
    base64 += '=';
  }
  return decodeBase64(base64);
}
