# ProofBundle

**ProofBundle** is a cryptographic bundle format and in-browser verification system for provenance-anchored digital artifacts. It binds payloads to their integrity proofs, identity claims, and temporal anchors — verifiable entirely in-browser with no server dependency.

Current public status: `public_alpha`. Release-green is not claimed.

## Verifier App

The canonical verifier is **`2026-04-19_proofbundle_ui_genesis.html`** — a single self-contained HTML file (~92 KB) running entirely in-browser via the Web Crypto API.

Open it:
- GitHub Pages: https://falsealias.github.io/proofbundle/
- Direct (minimal): https://falsealias.github.io/proofbundle/web/proofbundle_minimal_verifier_20260517.html

Tabs: **Seal** · **Verify** · **Domains** · **Claims**

No build step. No server. Files stay local.

## What It Does

- **Seal** — wrap any artifact in a signed, hash-anchored bundle with declared proof kind, expiration, and revocation policy
- **Verify** — check digest integrity, Ed25519 signature, expiration, revocation, and registry conformance
- **Anchor** — every bundle is eligible for OpenTimestamps (OTS) submission, producing a Bitcoin-anchored timestamp receipt
- **Merkle** — record batches are Merkle-committed (RFC 6962 style) and rooted in the OTS anchor

## Proof Obligations

PB1–PB10 cover the core verification surface (digest, signature, expiration, schema).
PB11–PB20 cover the adaptive v1.0 surface (proof-kind dispatch, cross-version compatibility, module composition, registry conflict detection).

See [`proofs/PB11_PB20_OBLIGATIONS.md`](proofs/PB11_PB20_OBLIGATIONS.md). Machine-checked artifacts: [`proofs/`](proofs/) (Coq/Rocq `.v`, Z3 SMT2, Python coverage).

## Conformance

300-vector suite in [`conformance/vectors_v1.json`](conformance/vectors_v1.json):
- Digests: SHA-256, SHA-384, SHA-512, BLAKE3, BLAKE2b
- Signatures: Ed25519, ECDSA-P256/P384/P521, RSA-PSS-2048/3072/4096

Test output: [`conformance/js_test_output_300_300_20260516T0720Z.txt`](conformance/js_test_output_300_300_20260516T0720Z.txt)

## Public Boundary

This repository surface is intentionally bounded. It does not publish private coordination records, internal corpus material, or withdrawn material. The current public-surface record:

- `PUBLIC_BOUNDARY_SUPERSESSION_20260517.json`
- `docs/PUBLIC_REVIEW_STANDING_20260517.md`

## Integrity

All coordination records for this project are OTS-anchored and Merkle-rooted. No deletions. No rewrites. The append-only ledger is the authoritative state record.

## Development

Static HTML and JavaScript. No build step required.
