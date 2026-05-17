# Current State - 2026-05-17 live sync

This is a current-state snapshot for the public ProofBundle repository. It is
not a release-green claim and not a proof-closed claim.

## Public App

- GitHub Pages root: `https://falsealias.github.io/proofbundle/`
- Browser app path: `https://falsealias.github.io/proofbundle/web/proofbundle_v1_0_app.html`
- local app file: `web/proofbundle_v1_0_app.html`
- public app bytes: 182,016
- public app SHA-256: `5B0FEAAA56B0A12CD0D3D8C2C463B579B208C265F524C78EC825D7466B6CB2C2`
- public app SHA-384: `975149C2134F2A753FEDD1111405E13DEA81AF7205B504DA27D2E4F84225B6616089755E84AB729E22FDBD5E5934F333`
- public app SHA-512: `465168661D4DEF86C63F2EA7861CE737E132398BCD8F3B5B561919A5B68784E8F43005EAFAFB5A62CF72B8853A7673B4956A9287B413D9B082173774E21CBDF0`
- note: public app hashes use Git blob / GitHub Pages LF bytes, not Windows CRLF working-tree bytes.
- dated browser artifact: `web/2026-05-03_proofbundle_ui_v1.0.html`

## Conformance Vectors

- vector file: `conformance/vectors_v1.json`
- vector count: 300
- vector SHA-256: `7ACAF3C90DB8DF28BF250433FB29E31DC156482B3F1CEB30E08062E9C0560C1B`
- copied into this repository snapshot from the May 15 working tree
- standing: present, not by itself proof closure

## Proof Sources

Proof sources have been added under `proofs/` from the May 15 working tree.

Current VM-reported proof audit standing from bridge sequence 2661:

- total proof files checked by Kimi VM audit: 8
- Coq files compiling: 1
- Coq/Lean files failing: 6
- Z3 file completed: 1
- notable pass: `2026-05-03_pb3_pb9_robust.v`
- standing: blocked, not release-green

Known blockers reported by the VM audit:

- `criterion_improvements.v`: incomplete proof around `corruption_transitive`
- `pb1_robust.v`: unification failure in `sem_eq2`
- `pb2_robust.v`: tactic failure around `PB_LINEAGE_1`
- `pb_proofs_1248.v`: equality direction mismatch
- `pb_proofs_3567.v`: equality direction mismatch
- `pb_proofs_combined.lean`: Lean termination and constructor equality failures
- `pb_proofs_z3.smt2`: solver completed with mixed `unsat`, `sat`, and `unknown`

The older `189` audit-failure count remains a standing blocker unless replaced
by a narrower, reproducible proof audit with preserved logs and exact scope.

## Bridge-Reported Indexed Corpus Snapshot

The bridge-reported public alpha snapshot relayed for publication records:

- formal proof and verification files indexed: 13,236
- Coq: 9,181
- Lean 4: 2,840
- Isabelle: 981
- Z3: 121
- Python: 113
- verified bridge records in the older source report: 2,639
- current verified bridge sequence in this live sync pass: 2,744
- current verified bridge head: `1EDF83040612EBA2D83191005207F06C37F51E596E0D020EBD36617CF172FB3F`
- OTS artifacts present in the source report: 2,634 / 2,634
- Python source-report conformance: 4 / 4
- Python local full-vector check, 2026-05-17T07:22Z: 274 passed / 94 failed
- JavaScript conformance: 303 / 303
- TypeScript local full-vector check, 2026-05-17T07:22Z: 300 passed / 0 failed
- canonical proof audit exceptions: 189
- quarantine files: 1
- large-file dedup scan: 432 files over 10 MB, 63 duplicate groups
- duplicate data identified: 25.79 GB
- unique bytes: 4.61 GB
- active VM instances: 2
- VM migration archives: 3
- pending VM swarm work orders: 2

These numbers describe indexed corpus and standing. They do not claim the
indexed proof corpus has universal closure.

## VM State

Primary worker VM, fresh SSH check at `2026-05-17T05:28:44Z`:

- `proofbundle-dev-20260513`
- 8 vCPUs
- 193GB mounted root disk
- 34GB used, 159GB available
- 71 tmux sessions observed
- load average: `17.32, 18.68, 13.18`
- fresh scavenger and worker receipts observed through `2026-05-17T05:26Z`

Second worker VM, fresh SSH check at `2026-05-17T05:28:44Z`:

- `proofbundle-dev-20260516-b`
- 4 vCPUs
- 49GB mounted root disk
- 8GB used, 40GB available
- 51 tmux sessions observed
- load average: `33.10, 32.07, 19.67`
- fresh scavenger and worker receipts observed through `2026-05-17T05:26Z`

Current resource reading: storage is not the bottleneck. CPU is saturated.

## Controlled Corpus Boundary

The full formal mathematics corpus is not committed to this public repository
by default. Public alpha publishes receipts, hashes, Merkle roots, indexes,
selected reviewed artifacts, standing records, and quarantine evidence.

Publication of additional proof source happens by tranche:

- reviewed proof source
- exact inventory hash
- build or audit log
- Merkle root or external timestamp witness
- standing note

This preserves adversarial review while avoiding an uncontrolled transfer of
the full private corpus.

## OTS And Merkle Standing

Bridge sequences are being written with record hashes and OTS submit receipts
when fresh Tor checks pass. The source report states OTS artifacts are present
for 2,634 / 2,634 reported artifacts and Merkle roots were computed across four
major sequences. This repository snapshot records its current repo Merkle root
in `manifest/LATEST_REPO_MERKLE_ROOT.txt` and the leaf inventory in
`manifest/LATEST_REPO_MERKLE_MANIFEST.json`. Repo Merkle tick
`20260517T052916Z` was submitted to OTS over a fresh Tor-true path for both the
root file and the Merkle manifest file, and the resulting `.ots` files and
receipts are indexed in
`manifest/ots_submission_index_20260517T072225Z.json`. Later OTS/index files
are captured by the next Merkle tick rather than claiming a root contains its
own future witness. Missing or pending attestations remain operational evidence
tasks, not release-green.

## Current Standing

`blocked_not_release_green`

No release-green, proof-closed, legal-compliance, or consciousness-proof claim is
made by this repository snapshot.
