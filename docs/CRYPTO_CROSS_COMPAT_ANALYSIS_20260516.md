# Cryptographic Cross-Compatibility Analysis

**Date:** 2026-05-16  
**Author:** kimi-code-cli-current  
**Scope:** JS/TS ↔ Python ECDSA and RSA-PSS signature verification compatibility

---

## Problem Statement

The ProofBundle JS/TypeScript implementation failed to verify 38 of 282 conformance vectors (later expanded to 300). All failures were in signature verification for:
- **RSA-PSS** (all key sizes and hash algorithms)
- **ECDSA cross-size combinations** (e.g., P-384 + SHA-256, P-256 + SHA-384)

The Python reference implementation verified all vectors successfully.

---

## Root Cause 1: RSA-PSS Salt Length

### Python Behavior
```python
public_key.verify(
    signature,
    digest,
    padding.PSS(mgf=padding.MGF1(h), salt_length=h.digest_size),
    utils.Prehashed(h),
)
```

Python `cryptography` uses `salt_length=h.digest_size` (32 for SHA-256, 48 for SHA-384, 64 for SHA-512).

### JS Bug
```javascript
// BROKEN
rsaPriv.signWithMessageHashPSS(digestHex, hashName, -2);
```

In `jsrsasign`, `-2` is a special value that does NOT reliably match Python's `h.digest_size`. Verification failed with `0x01 marker not found` because the salt length used during signing did not match what the verifier expected.

### Fix
```javascript
// CORRECT
rsaPriv.signWithMessageHashPSS(digestHex, hashName, digest.length);
rsaPub.verifyWithMessageHashPSS(digestHex, sigHex, hashName, digest.length);
```

Explicit `saltLength = digest.length` (32, 48, or 64) matches Python exactly.

---

## Root Cause 2: ECDSA Cross-Size Verification

### Python Behavior
```python
public_key.verify(signature, digest, ec.ECDSA(utils.Prehashed(h)))
```

Python `cryptography` with `Prehashed(h)` treats the input `digest` as the **final hash** and does NOT hash it again. This means:
- For P-384 + SHA-256: Python signs the 32-byte digest directly
- For P-256 + SHA-384: Python signs the 48-byte digest directly

### JS Bug
```javascript
// BROKEN - @noble/curves
curve.verify(sigBytes, digest, rawPub, { prehash: false });
```

With `prehash: false`, `@noble/curves` expects the caller to supply a prehashed digest. However, `@noble/curves` P-384/P-521 verification was found to reject valid Python-generated signatures for cross-size combinations. The exact reason is unclear but appears to be an incompatibility between `@noble/curves` and Python `cryptography` ECDSA implementations for certain digest lengths.

### Fix
Switched ECDSA verification to `jsrsasign`:

```javascript
const ECDSA = (KJUR as any).crypto.ECDSA;
const ecdsa = new ECDSA({ curve: curveName, pub: pubHex });
ecdsa.verifyWithMessageHash(digestHex, sigHex);
```

`jsrsasign`'s `verifyWithMessageHash` takes the precomputed digest hash and signature hex, matching Python's `Prehashed` behavior exactly. All cross-size combinations verify correctly.

---

## Root Cause 3: ECDSA-P521 DER Encoding

### Problem
P-521 signatures have r and s values of 66 bytes each. The total DER-encoded signature can exceed 127 bytes, requiring **long-form length encoding**.

### Bug
```javascript
// BROKEN - only handles short-form DER length
return Buffer.concat([Buffer.from([0x30, totalLen]), intR, intS]);
```

When `totalLen` > 127, this produces invalid DER.

### Fix
```javascript
let lenBytes;
if (totalLen < 128) {
  lenBytes = Buffer.from([totalLen]);
} else if (totalLen < 256) {
  lenBytes = Buffer.from([0x81, totalLen]);
} else {
  lenBytes = Buffer.from([0x82, totalLen >> 8, totalLen & 0xff]);
}
return Buffer.concat([Buffer.from([0x30]), lenBytes, intR, intS]);
```

---

## Cross-Compatibility Verification

Verified both directions:

| Direction | Algorithms Tested | Result |
|-----------|------------------|--------|
| JS sign → Python verify | All 10 algorithm+digest combinations | ✅ Pass |
| Python sign → JS verify | All 10 algorithm+digest combinations | ✅ Pass |

Tested combinations:
- ECDSA-P256 + SHA-256, SHA-384
- ECDSA-P384 + SHA-256, SHA-384
- ECDSA-P521 + SHA-256, SHA-512
- RSA-PSS-2048 + SHA-256, SHA-384
- RSA-PSS-3072 + SHA-256
- RSA-PSS-4096 + SHA-512

---

## Browser App Note

The browser app (`web/proofbundle_v1_0_app.html`) uses Web Crypto API (`crypto.subtle`) which:
- Does NOT support `Prehashed` ECDSA behavior
- Has fixed hash-to-curve mappings (e.g., P-384 always uses SHA-384)

However, the browser app generates AND verifies its own signatures using the same Web Crypto API, so it is **self-consistent**. Cross-size verification of Python-generated signatures would require embedding `jsrsasign` or another library that supports prehashed verification.

---

## Files Changed

- `core/src/signature.ts` — Main fix
- `scripts/generate_conformance.py` — Removed RSA-PSS + BLAKE skip
- `conformance/vectors.generated.json` — Regenerated 300 vectors

---

## Standing

Release standing remains `blocked_not_release_green` due to 189 formal proof audit failures.
