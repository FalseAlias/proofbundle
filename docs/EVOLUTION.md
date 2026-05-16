# Evolution

## Overview

This document describes the stability properties of the ProofBundle
specification, what may change between versions, and the deprecation
cycle that governs changes.

## Adaptive property

The specification has an adaptive property: certain aspects are stable
across all versions, while others may evolve. This property allows
implementations to plan for compatibility.

### Stable across all versions

The following are guaranteed to remain stable across all future versions:

- The five top-level keys (`hdr`, `payload`, `meta`, `refs`, `seal`).
- The existence of a canonical encoding that produces deterministic
  byte sequences.
- The append-only property of the algorithm registry.
- The existence of a verifier pipeline with defined stages.
- The outcome code 0 for `valid`.

### May evolve between versions

The following may change between minor versions:

- New registry entries (algorithms, proof kinds, edge kinds).
- New boundary atoms.
- New optional fields in existing blocks.
- New profiles.
- Resource limit defaults.
- Side attestation descriptor fields.

The following may change between major versions:

- Required fields may become optional or be removed.
- The canonical encoding rules may change.
- New required fields may be added.
- Registry entries may be removed (after deprecation).
- The stage order may change.
- The JSON structure may change.

## Deprecation cycle

Registry entries and features follow a three-phase deprecation cycle.
Each phase spans at least one minor version.

### Phase 1: Announced

The deprecation is documented in the specification and release notes.
The entry remains active. Verifiers continue to accept it without
warning.

Duration: at least one minor version.

### Phase 2: Soft-deprecated

Verifiers emit a warning when the deprecated entry is used but continue
to accept it. The warning includes the version in which the entry will
be removed.

Duration: at least one minor version.

### Phase 3: Removed

Verifiers reject the removed entry. The specific outcome depends on the
entry type:

- Algorithm: `unknown-algorithm`
- Proof kind: `unknown-algorithm`
- Feature: `version-unsupported` or `invalid-schema`

## Version governance

Changes to the specification are governed by the ProofBundle version
policy (PB20). PB20 defines:

- Who may propose changes.
- The review process for changes.
- The criteria for minor vs. major version changes.
- The deprecation timeline.
- The conformance requirements for new versions.

### PB20 rules

1. All changes are proposed via specification change requests.
2. Changes that add new optional features or registry entries are minor
   version changes.
3. Changes that modify existing behavior or remove features are major
   version changes.
4. All changes must include conformance test vectors.
5. No registry entry is removed without completing the deprecation
cycle.
6. The canonical encoding is never changed in a minor version.

## Version 1.0.0 stability

At version 1.0.0:

- No entries are deprecated.
- All registry entries are in the active state.
- No warnings are emitted for any registered entry.
- The conformance corpus covers all features.

## Future version roadmap

The following items are candidates for future minor versions. They are
not commitments.

- Additional digest algorithms (e.g., sha3-512).
- Additional signature algorithms (e.g., Falcon-512).
- Additional proof kinds (e.g., `tla`, `cbmc`).
- Additional boundary atoms (e.g., `before`, `after` for temporal
  comparison).
- Additional profiles (e.g., `quantum-safe`).
- Array indexing in boundary paths.
- Compressed payload support.
- Multi-signature seals.

## Migration between versions

When a new major version is released, implementations may support both
the old and new versions during a transition period. The verifier
selects the version based on `hdr.spec_ver`.

Bundles produced for an older version remain valid when the verifier
supports that version. Bundles do not need to be re-sealed for new
minor versions.
