# Architecture

## Overview

The ProofBundle system consists of a data model, a verifier pipeline, and
supporting tooling. This document describes the object model, the
verifier's internal stages, data flow, and module boundaries.

## Object Model

A ProofBundle is a tree-shaped JSON object with five top-level nodes:

```
Bundle
├── hdr     (Header)
├── payload (Opaque bytes, base64url encoded)
├── meta    (Metadata)
├── refs    (Lineage references, optional)
└── seal    (Cryptographic seal)
```

Each node is a distinct structural unit with its own validation rules.
The verifier treats each unit independently during the early stages and
combines them during the integrity and signature stages.

### Header

The header carries version metadata. It is the first field checked after
parsing because it determines which version of the specification applies
to the remainder of the bundle.

### Payload

The payload is opaque bytes. The verifier does not parse or interpret the
payload content. The payload is digested as raw bytes during the
integrity stage.

### Metadata

The metadata block carries producer identity, timestamps, algorithm
selection, boundary predicates, and optional extensions (side
attestations, HITL). It is the most complex node and drives the verifier's
behavior through the latter pipeline stages.

### Refs

The refs block carries a single parent reference. It forms a linked list
of bundles when traversed recursively. The refs block is optional; its
absence indicates a genesis bundle.

### Seal

The seal block carries the digest and signature over the canonical
encoding. It is the cryptographic root of trust for the bundle.

## Verifier Pipeline

The verifier is a sequential pipeline of 12 stages. Each stage is a pure
function from the current state to either a failure outcome or the next
state.

```
Input: raw bytes + public key + context + side attestations + clock
  │
  ▼
┌─────────────┐
│   Parse     │── invalid-schema ──►
│  (JSON)     │
└──────┬──────┘
       ▼
┌─────────────┐
│   Schema    │── invalid-schema ──►
│  (Structure)│
└──────┬──────┘
       ▼
┌─────────────┐
│   Resource  │── resource-limit ──►
│   Budget    │
└──────┬──────┘
       ▼
┌─────────────┐
│   Version   │── version-unsupported ──►
│   Check     │
└──────┬──────┘
       ▼
┌─────────────┐
│   Profile   │── profile-violation ──►
│   Validate  │
└──────┬──────┘
       ▼
┌─────────────┐
│  Canonical  │── invalid-encoding ──►
│   Encode    │
└──────┬──────┘
       ▼
┌─────────────┐
│  Integrity  │── integrity-mismatch ──►
│   (Digest)  │
└──────┬──────┘
       ▼
┌─────────────┐
│  Signature  │── invalid-signature ──►
│  (Verify)   │
└──────┬──────┘
       ▼
┌─────────────┐
│   Context   │── context-mismatch ──►
│ Commitment  │
└──────┬──────┘
       ▼
┌─────────────┐
│  Temporal   │── temporal-expired ──►
│   (Clock)   │
└──────┬──────┘
       ▼
┌─────────────┐
│   Boundary  │── out-of-bounds ──►
│  (Evaluate) │
└──────┬──────┘
       ▼
┌─────────────┐
│  Side Info  │── side-info-missing ──►
│  (Check)    │
└──────┬──────┘
       ▼
┌─────────────┐
│    HITL     │── hitl-required ──►
│  (Validate) │
└──────┬──────┘
       ▼
┌─────────────┐
│ Proof Kind  │── proof-refuted ──►
│  (Dispatch) │
└──────┬──────┘
       ▼
┌─────────────┐
│  Lineage    │── lineage-orphan ──►
│ (Resolve)   │── lineage-digest-mismatch ──►
└──────┬──────┘
       ▼
   valid
```

### Stage invariants

Each stage receives the output of the previous stage. A stage may read
any part of the bundle but may only write to the state object. Stages do
not modify the input bundle.

### Early exit

The pipeline exits on the first failure. No subsequent stages execute.
This property ensures that verification is total and deterministic.

### Stage composability

Individual stages can be extracted and tested in isolation. Each stage
has a well-defined input contract and output contract. The conformance
corpus tests each stage independently.

## Data Flow

### Encoding flow

```
Bundle object
     │
     ▼
Canonical encoder (PB-CANON-JSON-1)
     │
     ▼
UTF-8 byte sequence
     │
     ├───► Digest function ──► seal.digest_b64u (to check)
     │
     └───► Signature function ──► seal.signature_b64u (to check)
```

The canonical encoder produces the same byte sequence on all platforms.
The digest and signature functions consume this byte sequence.

### Verification flow

```
Raw JSON bytes
     │
     ▼
Parser ──► Bundle object
     │
     ▼
Schema validator ──► Validated bundle
     │
     ▼
Canonical encoder ──► Canonical bytes
     │
     ▼
Digest checker (compares computed vs claimed)
     │
     ▼
Signature checker (verifies with public key)
     │
     ▼
Context/Boundary/Temporal/Side/HITL/Proof/Lineage stages
```

## Module Boundaries

### Reference implementation modules

The reference implementations in TypeScript, Python, Rust, and Go share
the same module structure:

| Module          | Responsibility                              |
|-----------------|---------------------------------------------|
| parse           | JSON parsing                                |
| schema          | Structural validation                       |
| version         | Version policy lookup                       |
| profile         | Profile constraint validation               |
| canonical       | Canonical encoding (PB-CANON-JSON-1)        |
| digest          | Digest computation                          |
| signature       | Signature verification                      |
| boundary        | Boundary predicate evaluation               |
| side_attestation| Side attestation checking                   |
| hitl            | HITL validation                             |
| proof_kind      | Proof kind dispatch                         |
| lineage         | Lineage resolution                          |
| verifier        | Pipeline orchestration                      |
| cli             | Command-line interface                      |

### Dependency rules

- The `verifier` module depends on all other verification modules.
- The `canonical` module depends only on the JSON parser.
- The `digest` and `signature` modules depend only on cryptographic
  libraries.
- The `boundary` module depends only on the canonical module for string
  normalization.
- The `lineage` module depends on the `verifier` module for recursive
  parent verification.
- The `cli` module depends on the `verifier` module.

### Formal verification modules

The formal verification archive in `proofs/` contains:

| File         | Tool      | Property verified                        |
|--------------|-----------|------------------------------------------|
| canon.v      | Coq       | Canonical encoding is deterministic      |
| digest.v     | Coq       | Digest computation is correct            |
| boundary.v   | Coq       | Boundary evaluation is total             |
| pipeline.lean| Lean 4    | Pipeline produces exactly one outcome    |
| schema.lean  | Lean 4    | Schema validation rejects all invalid    |
| atoms.smt2   | Z3        | Boundary atoms are mutually exclusive    |
| lineage.smt2 | Z3        | Lineage depth limit prevents cycles      |
| api.v        | Coq       | Verifier API contract                    |
| profile.lean | Lean 4    | Profile validation is subset check       |
| soundness.v  | Coq       | valid outcome implies all checks passed  |

## Implementation notes

### Memory layout

The verifier processes the bundle as a stream of bytes until the parse
stage completes. After parsing, the bundle is held in memory as a tree
structure. The canonical encoder produces a second in-memory byte buffer.
The digest and signature stages consume this buffer without copying.

### Thread safety

All verifier stages are stateless. Multiple verifications may run
concurrently on the same verifier instance. Cryptographic contexts
(keys, digests) are the only shared state and are read-only after
initialization.

### Error propagation

Each stage returns a result type with two variants: success (carrying the
next state) and failure (carrying the outcome code and an optional
message). The pipeline combinator sequences stages and handles early exit.
