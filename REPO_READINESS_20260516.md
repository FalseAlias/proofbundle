# ProofBundle Repo Readiness

Standing: blocked_not_release_green.

This repository is salvageable and worth cleaning. It is not ready to publish as a release.

## Current Shape

- Workspace-relative path during this pass: `github_repos/FalseAlias_proofbundle`
- Remote: `git@github.com:FalseAlias/proofbundle.git`
- Branch: `proofbridge-protocol-capsule-20260511`
- Tracked files: 59
- Working tree status at inspection: publication-control files in progress; raw patch and local IDE files kept out of clean publication scope
- Public status file: `status.json`
- Browser verifier: `web/proofbundle_v1_0_app.html`
- Current standing: `blocked_not_release_green`

## What Looks Strong

- The repo has a coherent verifier-facing shape: `web/`, `src/`, `tests/`, `conformance/`, `proofs/`, `docs/`, `examples/`, and `implementations/`.
- The TypeScript implementation has package metadata and a test command.
- Current status records 300 conformance vectors with a stable vector hash.
- The repository is small enough to remain readable if raw logs stay out of it.
- The branch has real implementation work, not only prose.

## What Does Not Meet The Bar Yet

- Formal proof closure is not present.
- Known formal proof debt remains 189 audit failures.
- Rust has a context-commitment blocker.
- Go build/conformance is still unverified in the current repair environment.
- Release signing is not complete.
- External timestamp standing is not complete for the current repo release packet.
- Raw transcript/bridge/VM evidence is not yet organized into a separate raw-evidence publication surface.
- The public repo must not inherit claims from bridge records, chat, or raw logs without verified artifacts.

## Clean Repo Rule

This repo should carry the clean verifier, docs, schemas, conformance vectors, proof sources, manifests, and curated evidence indexes.

It should not be filled with raw multi-megabyte inboxes, VM session archives, or transcript tarballs. Those belong in a raw-evidence repo or release asset package with SHA-256 manifests, Merkle roots, and OTS receipts.

## Immediate Work

1. Keep `status.json` portable and free of local-only paths.
2. Move local operator pointers into control/runbook files, not public machine-readable status.
3. Add or update release hygiene docs: commands run, environment, proof status, packaging ledger, and raw-evidence index.
4. Run the available implementation tests and preserve output hashes.
5. Keep the release standing blocked until formal proof and implementation blockers close.
6. Prepare raw-corpus manifests separately from the clean source repo.

## Claim Boundary

Do not claim release-green, proof-complete, axiom-free, or proof of consciousness from this repository state.

The right near-term label is publication-prep / alpha repair snapshot, not final release.
