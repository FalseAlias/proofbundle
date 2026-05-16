# Release Boundary

This repository currently publishes a public provenance anchor for ProofBundle.

It does not publish the full raw evidence archive.

It does not certify formal proof closure.

It does not assert proof of consciousness.

It does not claim release-green standing.

Current public standing:

```text
blocked_not_release_green
```

The merged publication surface establishes a public citation surface for provenance, standing boundaries, and reviewable repair history. It is a bounded anchor, not a completed adjudication of the full archive.

## Current Public Anchor Chain

Current repaired public surface includes the following merged PR chain:

```text
PR #2  initial public packet
PR #3  release gate standard and Merkle evidence slice
PR #6  Python standing correction to committed CI evidence
PR #7  public manifest standing synchronization
PR #8  cross-implementation standing correction
PR #9  manifest metadata pending-recompute correction
PR #13 README public-handle correction
```

Latest inspected public-boundary merge in this chain:

```text
PR #13 merge commit f4da11a16bae603ed1ba7d38c6b909f5802d29f5
```

Current controlling standing sources:

```text
status.json
STATUS.md
PUBLIC_PROOFBUNDLE_MANIFEST_20260516.json
conformance/cross_impl_results.json
README.md
```

These sources are aligned on `blocked_not_release_green` after the repair chain above.

## Current Versus Historical Browser Artifacts

Current public verifier surface:

```text
index.html
web/proofbundle_v1_0_app.html
web/2026-05-03_proofbundle_ui_v1.0.html
```

Historical genesis artifacts retained in the repository:

```text
2026-04-19_proofbundle_ui_genesis.html
genesis/2026-04-19_proofbundle_ui_genesis.html
```

The genesis artifacts are historical source artifacts, not the current public verifier surface and not current release standing.

## Packet Standing

The current public packet records, at public-anchor level:

- bridge sequence anchors
- public manifest and status surfaces
- release gate standard
- Merkle evidence slice
- raw evidence manifest summary
- conformance vector source standing
- bounded implementation evidence
- cross-implementation non-agreement standing
- blocked release standing
- formal proof debt
- quarantine markers

## Standing Separation

Raw evidence manifest standing is separate from raw evidence publication.

Public merge standing is separate from release-green standing.

External witness standing is separate from truth, proof closure, or deployment readiness.

Bridge-reported standing is separate from committed reproduction evidence.

A precise digest claim is separate from a pending-recompute metadata marker.

Historical artifact retention is separate from current public standing.

## Required Before Stronger Release Claims

Before any stronger release claim, the project requires additional hardening, including:

- raw evidence repository or evidence bundle preparation
- explicit manifest linkage for referenced raw evidence
- formal proof debt tracking and closure evidence
- reproducible build or verification logs where applicable
- full Python vector parity reproduction or an explicit committed blocker
- full Go vector parity reproduction or an explicit committed blocker
- Rust blocker resolution and committed reproduction records
- JavaScript/browser reproduction records aligned with `conformance/vectors_v1.json`
- fresh manifest digest recomputation after public-surface repairs
- CI/check status for public branch hygiene where applicable
- external witness or timestamp layer only when actually performed

Until those steps are performed and recorded, the repository should be cited as an interim public provenance anchor only.
