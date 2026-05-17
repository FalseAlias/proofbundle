# Controlled Corpus Boundary - 2026-05-17

This public repository is the ProofBundle public alpha surface. It is not the
full private formal-math archive.

## Published Here

- browser verifier and public entrypoint
- `status.json`, `STATUS.md`, `README.md`, and public manifest standing
- conformance vectors and committed cross-implementation status records
- current bridge head and live VM standing summaries
- Merkle manifest/root records generated from this repository snapshot
- OTS references where witness artifacts exist
- proof inventories, selected reviewed proof artifacts, and audit blockers
- quarantine evidence and standing notes

## Controlled Outside This Repo

- full formal mathematics corpus
- raw transcripts and large concat artifacts
- complete VM extracts and worker receipt archives
- unreviewed proof generations
- monetizable or licensable proof tranches
- personal, credential-adjacent, or unrelated evidence material
- consciousness-attribution-adjacent material unless separately scoped and
  quarantined as non-operative evidence

## Publication Rule

Additional proof source is published by reviewed tranche only. A tranche needs:

- exact file inventory and hashes
- source scope and origin standing
- build or audit logs
- Merkle root or external timestamp witness when available
- quarantine scan result
- standing note that distinguishes source presence, build success, and proof
  closure

## Merkle Rule

Every public-state update is treated as a Merkle event:

- each file or receipt is a leaf with byte count and cryptographic hashes
- leaves are combined as leaves -> stems -> knots -> branches -> trunk -> root
- deterministic branch-combined nodes preserve the append-only root history
- the root is recorded in `manifest/LATEST_REPO_MERKLE_ROOT.txt`
- the full leaf inventory is recorded in `manifest/LATEST_REPO_MERKLE_MANIFEST.json`
- prior roots are preserved as historical roots, not rewritten
- root updates happen after status, manifest, README, app, and evidence surfaces
  settle for that sync pass

Every proof, document, lemma, theorem, check, and claim that enters the public
standing surface is treated as a Merkle leaf and an OTS candidate. Actual OTS
standing is receipt-backed: if the receipt is absent, the standing is
`pending_ots`, not assumed.

This means the public repo publishes roots and verifiable leaves without
requiring uncontrolled publication of every private source artifact.

This policy protects the corpus while still giving reviewers hard receipts:
hashes, roots, indexes, selected source, audit logs, and visible blockers.

## Current Standing

The public alpha exposes proof-of-existence and review entrypoints. It does not
transfer the full private corpus and does not assert universal proof closure.
