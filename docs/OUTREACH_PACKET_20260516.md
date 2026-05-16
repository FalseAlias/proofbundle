# Outreach Packet - 2026-05-16

Use this packet only after verifying the public app URL and repository state.
Keep the claims bounded by `status.json` and `docs/CURRENT_STATE_20260516.md`.

## Primary Public Post

ProofBundle public alpha is public: a self-contained browser verifier/sealer
for cryptographic provenance receipts, with a 300-vector conformance corpus,
an indexed formal-proof and verification corpus snapshot, bridge/OTS receipts,
Merkle lineage standing, audit exceptions, and quarantine evidence.

Current standing is intentionally not release-green. The repository lists the
remaining implementation and proof-assistant blockers. I am looking for
adversarial technical review of the verifier model, evidence schema,
conformance vectors, proof standing, and AI-governance mapping.

App: https://falsealias.github.io/proofbundle/

Current bounded number line:

- indexed formal-proof and verification files: 13,236
- bridge records in source report: 2,639
- OTS artifacts present in source report: 2,634 / 2,634
- JavaScript conformance: 303 / 303
- TypeScript conformance: 300 / 300
- canonical proof audit exceptions: 189
- current standing: public alpha, not release-green

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
- consciousness proof

Allowed framing:

- static browser verifier
- sealed provenance/evidence receipts
- current alpha standing
- current blockers visible in-repo
- adversarial review requested
