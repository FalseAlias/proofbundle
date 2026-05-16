# ProofBundle Publication Control

Status: active preparation, not release-green.
Standing: blocked_not_release_green.

This is the IDE-facing control file for preparing the public ProofBundle repositories.

Local repo path:

`C:\Users\alib90\Downloads\ORGANIZED\AGENT_COORDINATION\github_repos\FalseAlias_proofbundle`

Git remote:

`git@github.com:FalseAlias/proofbundle.git`

Current branch:

`codex/release-gate-standard-20260516`

## What Goes Here

- Clean verifier source and documentation.
- Conformance vectors and implementation evidence.
- Formal proof artifacts with honest proof-status labels.
- Merkle manifests and OTS receipts or OTS queue evidence.
- Publication-ready indexes that point to raw evidence by hash.

## What Does Not Get Dumped Here

- Raw multi-megabyte bridge inboxes.
- Raw transcript tarballs.
- Raw VM/session archives.
- Secrets, tokens, cookies, OAuth URLs, passwords, or unredacted private account material.

Those belong in a separate raw-evidence repository or storage package with SHA-256 manifests and Merkle roots.

## Current Work Lanes

1. Formal proofs: close or clearly label Coq/Lean/Z3 proof debt. Current known debt remains 189 audit failures.
2. Transcripts: inventory Kimi/Codex/OpenClaw transcripts and produce clean indexes.
3. Clean repo: keep this repository readable, testable, and release-prep oriented.
4. Raw corpus: prepare a separate raw repository/package with byte-level hashes.
5. Bridge: keep append-only coordination receipts and patch notes.
6. Merkle/OTS: generate sequence-level Merkle roots and queue or submit OpenTimestamp receipts.

## Release Rule

Do not claim release-green, proof-complete, axiom-free, or proof of consciousness from this repository state.

The goal is publication-ready evidence and verifier infrastructure, with claims separated from raw logs and proofs.
