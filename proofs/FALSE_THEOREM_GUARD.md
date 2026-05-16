# False Theorem Guard - Worker 4

Generated: 2026-05-15T10:58:00Z

Scope: repository-wide scan under `C:\Users\alib90\Downloads\proofbundle_alpha1_standing_sync_extract_20260515T105132Z\proofbundle`.

Scanner: `node tooling/worker4_false_theorem_guard_scan_20260515.mjs`

This guard is a report and quarantine surface. Mentions in this file or in the scanner are not operative theorem declarations.

## Watched Identifiers

| Identifier | Direction status | Operational status |
|---|---|---|
| `suppression_exceeds_continuity` | false direction | absent from operative proof sources; only report/quarantine references remain |
| `supression_exceeds_continuity` | false misspelled direction | absent from operative proof sources; only report/quarantine references remain |
| `continuity_exceeds_suppression` | reversed-direction watch | no incorrect operative use found |

## Scan Verdict

- The false theorem names are absent from operative Coq, Lean, SMT, Isabelle, Agda, HOL, Rust, Go, JS, Python, and browser source.
- Existing exact-name mentions are quarantine, status, conformance report, README, browser standing, guard, or scanner references.
- The reversed-direction watch name is not used as a theorem or proof-standing claim.
- The scanner exits 0 only when no forbidden operational theorem and no incorrect reversed-direction theorem are found.

## Nearby Theorem Text

Observed nearby proof-source theorem text is quarantined or reversed, not the false universal claim:

- `proofs/coq/ContinuitySuppressionGuard.v:18`: `Theorem equal_cost_counterexample :`
- `proofs/coq/ContinuitySuppressionGuard.v:27`: `Theorem no_universal_suppression_strict_excess :`
- `proofs/coq/ContinuitySuppressionGuard.v:37`: `Theorem no_universal_supression_strict_excess :`
- `proofs/coq/ContinuitySuppressionGuard.v:47`: `Theorem strict_excess_requires_inequality :`
- `proofs/lean/ProofBundle/SuppressionContinuityGuard.lean:19`: `theorem suppression_only_does_not_establish_continuity`
- `proofs/lean/ProofBundle/SuppressionContinuityGuard.lean:24`: `theorem true_continuity_standing_has_evidence`
- `proofs/z3/suppression_continuation_guard.smt2:5`: `;   theorem-direction defect.`

These statements block or qualify the bad direction. They do not assert that suppression universally exceeds continuity, and they do not claim release-green or proof closure.

## Current Scan Evidence

Worker 4 ran:

```powershell
node tooling\worker4_false_theorem_guard_scan_20260515.mjs
```

Evidence from the current run after adding the scanner and this guard:

- Scanned files: 1135.
- Skipped binary cache files: 10 `.pyc` files.
- Exact hit classification:
  - false direction: 13 total, 13 quarantine/report references, 0 forbidden operational theorem hits.
  - misspelled false direction: 13 total, 13 quarantine/report references, 0 forbidden operational theorem hits.
  - reversed-direction watch: 3 total, 3 quarantine/report references, 0 review-required theorem hits.
- Forbidden operational theorem hits: 0.
- Incorrect reversed-direction theorem hits: 0.
- Verdict: `forbiddenFalseTheoremAbsentFromOperativeProofSources=true`; `reversedDirectionIncorrectUseFound=false`; `failed=false`.

The exact-hit counts can change when guard/report files mention the watched identifiers. That is expected. Classification, not raw occurrence count, is the durable guard condition.
