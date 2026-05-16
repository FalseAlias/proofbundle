# Python Conformance Status 2026-05-16

Standing: blocked, not release-green.

The Python conformance test loader now reads the 300-vector corpus from the
`vectors` array in `conformance/vectors_v1.json` instead of iterating over the
top-level metadata keys.

Observed local run:

```text
python -m pytest python/tests/test_conformance.py -q
```

Result after loader repair:

- Total tests collected: 368
- Non-vector Python unit tests passed: 68
- Conformance vectors passed: 206
- Conformance vectors failed: 94

Failure profile:

- Signature stage: 60
- Boundary stage: 18
- Algorithm dispatch stage: 12
- Lineage stage: 2
- Canonical-integrity stage: 2

This file records implementation standing only. It does not change vector
expected outcomes and does not claim Python conformance closure.
