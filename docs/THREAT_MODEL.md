# Threat Model

## Scope

This document describes the threats that ProofBundle is designed to
address, the threats that are out of scope, and the known limitations of
the design.

## In-scope threats

### Tampering

An attacker modifies the payload, metadata, or any other field of a
bundle after it is sealed. The integrity stage (Section 11.8) and
signature stage (Section 11.9) detect this attack. The verifier returns
`integrity-mismatch` or `invalid-signature`.

### Replay

An attacker captures a valid bundle and presents it in a different
context or at a different time. The context-commitment stage
(Section 11.10) and temporal stage (Section 11.11) detect this attack.
The verifier returns `context-mismatch` or `temporal-expired`.

### Context confusion

An attacker presents a bundle in a context where its claims do not apply.
The boundary stage (Section 11.12) detects this attack by evaluating the
boundary predicate against the caller-supplied context. The verifier
returns `out-of-bounds`.

### Substitution

An attacker replaces a bundle with a different bundle bearing a different
identity. The bundle_id field and the signature over the canonical
encoding prevent this. The verifier returns `invalid-signature` when the
signature does not match the expected public key.

### Downgrade

An attacker presents an old version of a bundle as current. The refs
block and lineage resolution (Section 16) allow the verifier to trace
the bundle's history and detect when a superseded bundle is presented.

## Out-of-scope threats

### Key compromise

If the private key used to seal a bundle is compromised, an attacker can
produce valid bundles indistinguishable from legitimate ones. Key
management is the responsibility of the bundle producer. ProofBundle does
not provide key escrow, rotation, or revocation mechanisms.

### Social engineering

If a human operator is deceived into approving a malicious bundle via the
HITL mechanism, the verifier accepts the bundle. The HITL block records
that approval occurred, not that the approval was correct.

### Side-channel attacks

Timing attacks against the signature verification implementation, cache
attacks against the digest computation, and similar side-channel attacks
are not addressed by the specification. Implementations apply standard
countermeasures.

### Denial of service

An attacker may present bundles designed to consume excessive resources
during verification. The resource-budget stage (Section 11.4) sets limits
on size, depth, and array length. Implementations may set additional
limits.

### Clock manipulation

An attacker may manipulate the verifier's system clock to bypass
temporal checks. The temporal stage depends on an accurate clock.
Implementations use trusted time sources where available.

### Transport security

The security of the channel over which bundles are transmitted is out of
scope. Bundles are self-contained and do not depend on transport-layer
security.

## Known limitations

### Canonical number format

The canonical encoding (Section 7) restricts numbers to integers. Bundles
carrying non-integer numeric data must encode it as strings. This is a
deliberate simplification to avoid cross-platform floating-point
inconsistencies.

### Simplified BLAKE3 reference

The BLAKE3 reference implementation in the conformance test suite is a
simplified version for testing purposes. Production implementations use
the official BLAKE3 library.

### ECDSA-P521 runtime variability

ECDSA-P521 signatures may have multiple valid encodings for the same
mathematical signature. Verifiers normalize P521 signatures before
verification. This normalization is not standardized across all
cryptographic libraries.

### Temporal clock non-determinism

The temporal check depends on the verifier's local clock. Bundles with
narrow expiration windows may exhibit non-deterministic outcomes when
verified near the expiration boundary. The outcome depends on clock
synchronization between the producer and the verifier.

### Boundary predicate expressiveness

The boundary atom grammar (Section 12) is intentionally limited. It does
not support arithmetic, array indexing, or function application.
Applications requiring complex boundary conditions must encode them
within the payload or use side attestations.

### Side attestation availability

The verifier cannot verify side attestations that are not provided by
the caller. A bundle requiring side attestations fails verification when
the caller does not supply them, even if the attestations exist.

### Lineage resolver dependency

Lineage resolution depends on an external resolver (local file system,
HTTP registry, etc.). If the resolver is unavailable, the verifier
returns `lineage-orphan`. The bundle itself does not embed parent
bundles.

### Human-in-the-loop non-cryptographic

The HITL approval block is a record of human review, not a cryptographic
proof. The approver_id string is not bound to a public key. A compromised
bundle producer can forge HITL entries.

## Attack tree summary

```
Attacker goal: bypass verification
│
├─── Tamper with sealed content
│    └─── Countermeasure: integrity stage + signature stage
│
├─── Replay in wrong context
│    └─── Countermeasure: context-commitment stage + boundary stage
│
├─── Replay after expiration
│    └─── Countermeasure: temporal stage
│
├─── Present revoked bundle
│    └─── Countermeasure: lineage resolution
│
├─── Forge signature
│    └─── Countermeasure: cryptographic signature algorithm
│    └─── Limitation: no defense against key compromise
│
├─── Trick human approver
│    └─── Limitation: out of scope
│
└─── Exhaust verifier resources
     └─── Countermeasure: resource-budget stage
     └─── Limitation: limits are implementation-defined
```

## Trust assumptions

- The bundle producer holds their private key confidential.
- The verifier holds the correct public key for the producer.
- The verifier's clock is accurate (for temporal checks).
- The lineage resolver returns the authentic parent bundle.
- Side attestation providers are trusted by the application.
- Human approvers identified in HITL blocks are trusted by the
  application.
