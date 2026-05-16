# Standing Claim Audit

Standing: blocked_not_release_green.

## Supported In Current Evidence

- Browser app static tests passed locally.
- TypeScript implementation passed the 300-vector conformance test locally after `npm ci`.
- The repository carries 300 conformance vectors.
- A repo Merkle manifest tool exists and writes append-only Merkle log events.

## Downgraded Or Blocked

- `release-green`: blocked. Present only in negative statements.
- `proof-complete`, `proof-closed`, `formal verification complete`: blocked. Proof sources exist, but proof-assistant toolchains were not available and audit debt remains.
- `all implementations agree`: blocked. Current `cross_impl_results.json` records partial standing, not all-implementation agreement.
- `EU AI Act compliant`, `legally compliant`, `certified`, `regulator-approved`: not claimed.
- `persistent state hashing` and `state continuity`: not promoted as current-lane closure unless implementation, vectors, and cross-implementation agreement are present.
- `proof of consciousness` or `consciousness proof`: not a current repo claim.

## Action

Keep unsupported terms in negative, blocked, quarantine, or audit context only. Remove or quarantine any occurrence that reads as an operative claim.
