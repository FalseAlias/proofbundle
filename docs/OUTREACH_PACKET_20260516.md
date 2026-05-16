# Outreach Packet - 2026-05-16

Use this packet only after verifying the public app URL and repository state.
Keep the claims bounded by `status.json`, `STATUS.md`, `PUBLIC_PROOFBUNDLE_MANIFEST_20260516.json`, and `conformance/cross_impl_results.json`.

## Primary Public Post

ProofBundle public alpha is public: a self-contained browser verifier/sealer
for cryptographic provenance receipts, with a 300-vector conformance corpus,
an indexed formal-proof and verification corpus snapshot, bridge/OTS receipts,
bounded Merkle-lineage standing, audit exceptions, and quarantine evidence.

Current standing is intentionally not release-green. The repository lists the
remaining implementation and proof-assistant blockers. Adversarial technical
review is requested for the verifier model, evidence schema, conformance
vectors, proof standing, committed CI evidence, and governance mapping where
present.

App: https://falsealias.github.io/proofbundle/

Current bounded number line:

- indexed formal-proof and verification files: 13,236
- bridge records in source report: 2,639
- OTS artifacts present in source report: 2,634 / 2,634
- TypeScript committed CI conformance: 300-vector gate passed
- Python committed CI evidence: schema/import/smoke gate only; full 300-vector parity is not claimed
- Go committed CI evidence: current test gate only; full vector parity is not claimed
- JavaScript/browser conformance: bridge-reported standing data pending committed reproduction records
- canonical proof audit exceptions: 189
- current standing: blocked_not_release_green

## Reviewer Targets

- supply-chain provenance reviewers
- AI governance and audit-tooling researchers
- cryptographic receipt and transparency-log builders
- formal-methods reviewers
- browser/offline-verifier implementers

## What To Link

- `README.md`
- `STATUS.md`
- `status.json`
- `PUBLIC_PROOFBUNDLE_MANIFEST_20260516.json`
- `conformance/cross_impl_results.json`
- `docs/CURRENT_STATE_20260516.md`
- `conformance/vectors_v1.json`
- `proofs/PROOF_STATUS.md`
- `proofs/PROOF_STATUS.generated.json`

## Boundaries

Do not claim:

- release-green
- proof closure
- legal compliance
- regulator approval
- full cross-implementation agreement
- full Python, Go, Rust, or JavaScript parity without committed reproduction records

Allowed framing:

- static browser verifier
- sealed provenance/evidence receipts
- current public alpha standing
- current blockers visible in-repo
- TypeScript 300-vector CI evidence
- Python schema/import/smoke CI evidence
- Go current test-gate CI evidence
- bridge-reported counts as standing data, not independent reproduction
- adversarial review requested
