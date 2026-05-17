# Proof Tranche Publication Policy - 2026-05-17

ProofBundle proof publication is append-only and tranche-based.

## Tranche Classes

- `inventory-only`: file counts, hashes, paths, Merkle roots, and standing
  without public source transfer.
- `sample-reviewed`: selected source files published for technical review with
  exact standing and known blockers.
- `build-reviewed`: selected source files plus preserved build or solver logs.
- `closure-candidate`: source, build logs, assumption scan, dependency record,
  and reviewer notes ready for adversarial review.
- `closed`: only used after the relevant proof assistant build and assumption
  scans support that standing for the stated scope.

## Required Records

Each tranche records:

- tranche name and date
- source paths or external archive references
- SHA-256, SHA-384, and SHA-512 where practical
- Merkle root or repository manifest root
- OTS or other external witness standing where available
- `pending_ots` when an external timestamp receipt has not landed yet
- proof assistant/toolchain version
- build command and exit status when run
- admits/sorries/axioms/parameters scan result
- quarantine scan result
- public standing label

Every public proof, document, lemma, theorem, check, and claim is treated as a
Merkle leaf for the tranche. Witness language is receipt-backed: no tranche
claims OTS standing unless the referenced `.ots` or equivalent external witness
artifact exists.

## Non-Claims

Publishing a proof tranche does not by itself assert:

- release-green standing
- universal proof closure
- legal compliance
- identity authority
- factual truth of payload claims
- transfer of the full private corpus

## Current Release Boundary

The current public alpha may publish selected reviewed artifacts and indexes.
The full formal-math corpus remains controlled unless a tranche is explicitly
selected and documented under this policy.
