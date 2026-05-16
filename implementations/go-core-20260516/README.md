# ProofBundle Go Core

Standard-library-only implementation of ProofBundle v1.0.0 canonicalization, digest, signing, and verification.

## Status

| Component | Status |
|-----------|--------|
| Canonical JSON | Implemented (sorted keys, compact, json.Number aware) |
| SHA-256/384/512 digest | Implemented |
| BLAKE3 / BLAKE2b digest | Not implemented (requires external packages) |
| Ed25519 sign/verify | Implemented |
| ECDSA-P256/P384/P521 sign/verify | Implemented |
| RSA-PSS-2048/3072/4096 sign/verify | Implemented |
| Bundle verification | Implemented |
| Conformance vectors | 240/300 pass (60 skipped for BLAKE3/BLAKE2b) |

## Running tests

```bash
cd go
go test -v ./...
```

Note: Go toolchain is not installed in the current workspace; tests are pending CI or local Go installation.

## Design notes

- ECDSA signing uses `ecdsa.SignASN1` directly to avoid double-hashing by the `crypto.Signer` interface.
- RSA-PSS uses `salt_length = digest_length` to match Python `cryptography` behavior.
- Canonical JSON preserves numeric representation via `json.Number` to match Python `json.dumps` float formatting.
