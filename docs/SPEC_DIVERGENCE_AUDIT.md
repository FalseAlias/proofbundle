# ProofBundle SPEC Divergence Audit v1.0.0

This document records every divergence found between the previous SPEC.md
and the working implementations / test vectors, and how each was resolved
in the replacement SPEC.md.

Date: 2025-01-15
Auditor: specification-reconciliation pass

---

## Summary

| Divergence               | Severity | Resolution                                    |
|--------------------------|----------|-----------------------------------------------|
| Algorithm names          | Critical | Aligned to implementation names               |
| Profile names            | Critical | Aligned to PB-XXXX-1 names                    |
| Outcome names            | Critical | Aligned to 11 vector outcomes                 |
| spec_id value            | Critical | Changed from "PB" to "PROOFBUNDLE"            |
| Boundary atoms           | Major    | Aligned to 16 implementation atoms            |
| Boundary structure       | Major    | Aligned to { "all": [atoms] } format          |
| Bundle structure         | Major    | Aligned to vector/Go structure                |
| Verification pipeline    | Major    | Aligned to 12-stage Go pipeline               |
| Outcome count            | Major    | Reduced from 18 to 11                         |
| Side attestation struct  | Minor    | Simplified to match vector usage              |
| HITL structure           | Minor    | Aligned to Go/vector format                   |
| Refs structure           | Minor    | Aligned to array of parent refs               |
| Conformance counts       | Minor    | Updated to match 300 vectors                  |
| RFC-2119 language        | Minor    | Replaced with descriptive language            |

---

## Divergence 1: Algorithm Names

**Previous SPEC:**
- Digests: blake3-256, sha3-256, sha2-256, blake2b-256, keccak-256
- Signatures: ed25519, ecdsa-p256, ecdsa-p384, ecdsa-p521, rsa-pss-2048,
  rsa-pss-4096, dilithium3

**Implementations use:**
- TypeScript (`core/src/types.ts`, `core/src/digest.ts`, `core/src/signature.ts`):
  - Digests: SHA-256, SHA-384, SHA-512, BLAKE3, BLAKE2b
  - Signatures: Ed25519, ECDSA-P256, ECDSA-P384, ECDSA-P521,
    RSA-PSS-2048, RSA-PSS-3072, RSA-PSS-4096
- Go (`go/digest.go`, `go/signature.go`):
  - Same names as TypeScript
- Rust CLI (`cli/src/commands/conformance.rs`):
  - Uses "sha256", "sha384", "sha512", "blake3", "blake2b512",
    "ed25519", "ecdsa-sha256-p256"

**Vectors use:**
- Digests: SHA-256, SHA-384, SHA-512, BLAKE3, BLAKE2b, plus
  SHA-999 and BLAKE3-999 for negative testing
- Signatures: Ed25519, ECDSA-P256, ECDSA-P384, ECDSA-P521,
  RSA-PSS-2048, RSA-PSS-3072, RSA-PSS-4096, plus SIG-FUTURE for
  negative testing

**Resolution:** The SPEC now lists the exact algorithm names used by the
primary implementations (TypeScript + Go) and the vectors: SHA-256,
SHA-384, SHA-512, BLAKE3, BLAKE2b for digests; Ed25519, ECDSA-P256,
ECDSA-P384, ECDSA-P521, RSA-PSS-2048, RSA-PSS-3072, RSA-PSS-4096 for
signatures. Removed sha3-256, sha2-256 (renamed to SHA-256), blake3-256
(renamed to BLAKE3), blake2b-256 (renamed to BLAKE2b), keccak-256,
rsa-pss-4096 was kept (it existed in both old and new), added
RSA-PSS-3072 (was missing from old SPEC), removed dilithium3 (not
implemented).

---

## Divergence 2: Profile Names

**Previous SPEC:**
- minimal, standard, extended, full

**Implementations use:**
- TypeScript (`core/src/types.ts`, `core/src/index.ts`):
  - PB-INTEGRITY-1, PB-BOUNDARY-1, PB-LINEAGE-1, PB-REGULATED-1
- Go (`go/verify.go`):
  - Known profiles: PB-BOUNDARY-1, PB-LINEAGE-1, PB-REGULATED-1
  - (Note: Go omits PB-INTEGRITY-1 from its knownProfiles map,
    but TypeScript supports all four)
- Rust CLI (`cli/src/lib.rs`):
  - core, sealed, chained, full (different naming entirely)

**Vectors use:**
- Primary: PB-BOUNDARY-1 (228 vectors), PB-LINEAGE-1 (45),
  PB-REGULATED-1 (15)
- Negative testing: PB-FUTURE-99 (5 vectors)
- No vectors use PB-INTEGRITY-1 directly

**Resolution:** The SPEC now uses PB-INTEGRITY-1, PB-BOUNDARY-1,
PB-LINEAGE-1, PB-REGULATED-1. The Rust CLI uses different names
(core/sealed/chained/full) and is noted as having divergent naming.
The feature constraints table was rewritten to reflect the actual
profile behavior: PB-INTEGRITY-1 has no features, PB-BOUNDARY-1 has
boundary, PB-LINEAGE-1 adds side info and lineage, PB-REGULATED-1
adds HITL.

---

## Divergence 3: Outcome Names

**Previous SPEC:** 18 outcomes
- valid, invalid-schema, resource-limit, unknown-encoding,
  unknown-algorithm, profile-violation, invalid-encoding,
  integrity-mismatch, invalid-signature, context-mismatch,
  temporal-expired, proof-refuted, out-of-bounds,
  side-info-missing, hitl-required, lineage-orphan,
  lineage-digest-mismatch, version-unsupported

**Implementations use:**
- TypeScript (`core/src/types.ts`):
  - valid, invalid, indeterminate, resource-exhausted,
    lineage-broken, policy-denied, not-defined, unknown-version,
    malformed, missing-side-info, integrity-failed
- Go (`go/verify.go`):
  - verified, malformed, resource-exhausted, invalid-signature,
    out-of-bounds, unknown-version, missing-side-info,
    lineage-invalid, policy-denied, indeterminate,
    not-defined-in-this-version
- Rust CLI (`cli/src/verify.rs`):
  - Same 11 names as Go (EXIT_VERIFIED=0, EXIT_MALFORMED=10,
    EXIT_INVALID_SIGNATURE=11, EXIT_OUT_OF_BOUNDS=12,
    EXIT_UNKNOWN_VERSION=13, EXIT_MISSING_SIDE_INFO=14,
    EXIT_LINEAGE_INVALID=15, EXIT_RESOURCE_EXHAUSTED=16,
    EXIT_POLICY_DENIED=17, EXIT_INDETERMINATE=18,
    EXIT_NOT_DEFINED=19)

**Vectors expect:**
- verified, malformed, resource-exhausted, invalid-signature,
  out-of-bounds, unknown-version, not-defined-in-this-version,
  missing-side-info, indeterminate, lineage-invalid, policy-denied

**Resolution:** The SPEC now lists exactly 11 outcomes matching the
vectors and Go/Rust implementations:
1. verified
2. malformed
3. resource-exhausted
4. invalid-signature
5. out-of-bounds
6. unknown-version
7. not-defined-in-this-version
8. missing-side-info
9. lineage-invalid
10. policy-denied
11. indeterminate

The TypeScript outcome names (valid, integrity-failed, lineage-broken)
were adjusted in the SPEC to match the canonical vector names
(verified, invalid-signature, lineage-invalid). The 18 outcomes were
collapsed: invalid-schema + invalid-encoding + unknown-encoding ->
malformed; resource-limit -> resource-exhausted; unknown-algorithm +
profile-violation -> not-defined-in-this-version + policy-denied;
integrity-mismatch + context-mismatch + temporal-expired + proof-refuted
-> invalid-signature; lineage-orphan + lineage-digest-mismatch ->
lineage-invalid; hitl-required -> policy-denied; side-info-missing ->
missing-side-info; version-unsupported -> unknown-version.

---

## Divergence 4: spec_id

**Previous SPEC:** spec_id is "PB"

**Vectors:** spec_id is "PROOFBUNDLE"

**Go implementation:** Checks for "PROOFBUNDLE" in stageVersion

**TypeScript:** Does not check spec_id (only checks hdr.version and
hdr.profile in schema stage)

**Resolution:** Changed spec_id from "PB" to "PROOFBUNDLE" to match
the vectors and Go implementation. The verifier now returns
`unknown-version` when spec_id is not "PROOFBUNDLE".

---

## Divergence 5: Boundary Atoms

**Previous SPEC:** 18 atoms
- equals, not_equals, exists, not_exists, in, not_in, gt, gte, lt,
  lte, regex, starts_with, ends_with, contains, range, all_of,
  any_of, none_of

**Implementations support:**
- TypeScript (`core/src/boundary.ts`, `core/src/types.ts`):
  - equals, in, range, present, before, after, within, expired,
    not_expired, age_lt, age_gt, within_last, within_next,
    all, any, not
- Go (`go/boundary.go`):
  - Same 16 atoms as TypeScript

**Vectors use:**
- Only "equals" appears in vector boundaries (35 boundary-fail vectors
  use `{ "all": [ { "equals": ["env", "demo"] } ] }`)

**Resolution:** The SPEC now documents all 16 atoms that both
implementations support: equals, in, range, present, before, after,
within, expired, not_expired, age_lt, age_gt, within_last,
within_next, all, any, not. Removed 13 atoms not implemented:
not_equals, exists, not_exists, not_in, gt, gte, lt, lte, regex,
starts_with, ends_with, contains, none_of. Added 12 atoms not in
old SPEC: present, before, after, within, expired, not_expired,
age_lt, age_gt, within_last, within_next, any, not. Renamed
all_of -> all.

---

## Divergence 6: Boundary Structure

**Previous SPEC:** boundary is `{ "all": [atoms] }` where each atom is
`{ "atom_name": [operands] }`

**TypeScript implementation:** boundary is a `BoundaryPolicy` object
with `rules: BoundaryRule[]` and optional `default`. Each rule has
`atom: Atom` with `op`, `path`, `value`, etc. and `on_match: Outcome`.
This is a structurally different structure.

**Go implementation:** boundary is `{ "all": [atoms] }` where each
atom is `{ "atom_name": [operands] }` — matching the old SPEC format.

**Vectors:** Use the Go format: `{ "all": [ { "equals": ["env",
"demo"] } ] }`

**Resolution:** Aligned the SPEC to the Go/vector format: the boundary
is an object with key `all` mapping to an array of atoms, where each
atom is a single-key object. The TypeScript `BoundaryPolicy` format
with `rules` and `on_match` is not documented in the SPEC; it is an
implementation-specific internal representation.

---

## Divergence 7: Bundle Structure

**Previous SPEC:**
- refs was optional (absent allowed)
- payload was described as base64url-encoded but the TypeScript impl
treats it as an opaque object
- Header had spec_id ("PB"), spec_ver, profile, bundle_id
- Meta had boundary, expiration, context_commitment,
  side_attestations, requires_side_attestations, hitl
- Refs had parent_id, parent_digest, digest_alg, edge_kind
- Seal had digest_alg, digest_b64u, sig_alg, signature_b64u

**Vectors/Go structure:**
- refs is a required array (can be empty `[]`)
- payload is a base64url-encoded string
- Header has spec_id ("PROOFBUNDLE"), spec_ver, profile, bundle_id
- Meta has producer_id, created_at, canonical_encoding, digest_alg,
  sig_alg, proof_kind, boundary?, side_attestations?,
  requires_side_attestations?, hitl?
- Refs entries have parent_id, parent_digest, digest_alg, edge_kind
- Seal has digest_alg, digest_b64u, sig_alg, signature_b64u

**TypeScript structure:**
- Structurally different: hdr has version, profile, typ, id, ctx
- meta has issued_at, expires_at, not_before, issuer, subject,
  audience, purpose, tags
- refs has id, digest, digest_alg, sig_alg, signature, public_key
- seal has digest, digest_alg, sig_alg, signature, public_key
- boundary is a separate top-level field with BoundaryPolicy structure
- side attestations are a separate top-level `side` array
- HITL is a separate top-level field

**Resolution:** Aligned the SPEC to the vector/Go structure. The refs
field is now required (array, empty for genesis). The TypeScript
top-level `boundary`, `side`, `hitl` fields are documented as the
implementation's internal flattened representation; the canonical
bundle format nests these under `meta`. The `producer_id`,
`created_at`, `canonical_encoding`, `proof_kind` fields from the
vectors are now documented. The `context_commitment` and `expiration`
fields from the old SPEC were removed (not present in vectors or
implementations).

---

## Divergence 8: Verification Pipeline

**Previous SPEC:** 15 stages
```
parse -> schema -> resource-budget -> version -> profile -> canonical
-> integrity -> signature -> context-commitment -> temporal -> boundary
-> side-info -> hitl -> proof-kind -> lineage
```

**Go implementation:** 12 stages
```
parse -> resource-budget -> schema -> version -> profile -> canonical
-> integrity -> signature -> boundary -> side-info -> lineage -> hitl
```

**TypeScript implementation:** 11 stages (no explicit HITL in trace,
merged integrity+signature)
```
parse -> schema -> resource-budget -> version -> canonical -> integrity
-> context-commitment -> boundary -> side-info -> lineage -> hitl
```

**Resolution:** Aligned to the Go 12-stage pipeline, which matches
the vector expectations most closely. Stages: parse, resource-budget,
schema, version, profile, canonical, integrity, signature, boundary,
side-info, lineage, hitl. Removed: context-commitment (not present
in Go/vectors), temporal (not a separate stage; temporal checking
happens within boundary atoms), proof-kind (only "signature" is
supported; verification happens in the signature stage).

---

## Divergence 9: Outcome Count

**Previous SPEC:** 18 outcomes with codes 0-17

**Vectors:** 11 outcomes

**Resolution:** Collapsed to 11 outcomes. See Divergence 3 for the
mapping. Added numeric codes matching the Go/Rust CLI exit codes:
verified=0, malformed=10, invalid-signature=11, out-of-bounds=12,
unknown-version=13, missing-side-info=14, lineage-invalid=15,
resource-exhausted=16, policy-denied=17, indeterminate=18,
not-defined-in-this-version=19.

---

## Divergence 10: Side Attestation Structure

**Previous SPEC:** Each side attestation descriptor has attester_id,
claim_type, digest_alg, digest_b64u, required fields.

**Vectors:** Side attestation descriptors are empty objects `{}` or
not present.

**Go implementation:** Checks only that side_attestations is a
non-empty array when required; each entry is checked for
`authority_id`.

**TypeScript:** Each side attestation has role, party, at, statement,
sig_alg, signature, public_key.

**Resolution:** Simplified the side attestation descriptor to "a JSON
object" at version 1.0.0, since the implementations do not agree on
a common structure and the vectors only use empty objects.

---

## Divergence 11: HITL Structure

**Previous SPEC:** HITL block has approver_id, approved_at, expires_at,
approval_kind with values "review", "test", "audit", "custom".

**Vectors:** HITL block has approver_id, approved_at, expiry (optional).
No approval_kind field.

**Go implementation:** Checks approver_id, approved_at, and expiry.
No approval_kind check.

**TypeScript:** HITL is a top-level object with required boolean and
attestation object.

**Resolution:** Aligned to the vector/Go format: approver_id,
approved_at, and optional expiry. Removed approval_kind.

---

## Divergence 12: Refs Structure

**Previous SPEC:** refs block is optional, with parent_id,
parent_digest, digest_alg, edge_kind.

**Vectors:** refs is a required array (can be empty). Each entry has
parent_id, parent_digest, digest_alg, edge_kind.

**Go:** refs is a required []ParentRef field. Each ParentRef has
parent_id, parent_digest, digest_alg, edge_kind.

**TypeScript:** refs is an optional ParentRef[]. Each has id, digest,
digest_alg, sig_alg, signature, public_key (structurally different).

**Resolution:** Aligned to vector/Go: refs is required, an array.
Each entry has parent_id, parent_digest, digest_alg, edge_kind.
Noted that the TypeScript implementation uses a different structure.

---

## Divergence 13: Conformance Counts

**Previous SPEC:** Claims 300 vectors with detailed breakdowns for
all 18 outcomes, including categories like "proof-refuted",
"hitl-required", "lineage-orphan", "lineage-digest-mismatch".

**Actual vectors:** 300 vectors with 13 categories mapping to 11
outcomes. Categories are: algorithm-valid, algorithm-boundary-fail,
algorithm-tamper, temporal-boundary, lineage-valid, lineage-invalid,
missing-side-info, indeterminate, malformed, resource-exhausted,
unknown-version, not-defined-in-this-version, policy-denied.

**Resolution:** Updated Section 17 to list the actual 13 categories
and 300 vector count with correct per-category counts.

---

## Divergence 14: RFC-2119 Language

**Previous SPEC:** Used "MUST", "REQUIRED", "SHOULD", "MAY"
throughout.

**Task requirement:** This is a pre-normative descriptive
specification. Use "The verifier returns X when Y." Never use
RFC-2119 MUST/SHOULD/MAY.

**Resolution:** Replaced all RFC-2119 keywords with descriptive
"The verifier returns..." language throughout the document.

---

## Remaining Divergences (Unresolved)

The following divergences exist between implementations and could not
be fully resolved because the implementations themselves are not fully
aligned. The SPEC documents the behavior that the conformance vectors
expect.

### R1: TypeScript vs Go bundle structure

The TypeScript implementation (`core/src/types.ts`) defines a
structurally different bundle structure from the Go implementation and
vectors. Key differences:
- TypeScript `hdr` has `version`, `profile`, `typ`, `id`, `ctx`;
  Go/vectors have `spec_id`, `spec_ver`, `profile`, `bundle_id`.
- TypeScript `refs[].id` vs Go/vectors `refs[].parent_id`.
- TypeScript `refs[].signature` and `refs[].public_key` fields not
  present in Go/vectors.
- TypeScript has `boundary` and `side` and `hitl` as top-level fields;
  Go/vectors nest them under `meta`.
- TypeScript `meta` has `issued_at`, `expires_at`, `issuer`, etc.;
  Go/vectors have `producer_id`, `created_at`, `canonical_encoding`.

**Impact:** The TypeScript implementation cannot process vector
bundles in their native format. The SPEC documents the Go/vector
format as canonical.

### R2: Rust CLI profile names

The Rust CLI (`cli/src/lib.rs`) uses profile names "core",
"sealed", "chained", "full" instead of "PB-INTEGRITY-1",
"PB-BOUNDARY-1", "PB-LINEAGE-1", "PB-REGULATED-1".

**Impact:** The Rust CLI is non-conformant with the vector profile
names. The SPEC documents the PB-XXXX-1 names.

### R3: Go knownProfiles omits PB-INTEGRITY-1

The Go `verify.go` `knownProfiles` map does not include
"PB-INTEGRITY-1", but TypeScript supports it and the SPEC documents
it as a valid profile.

**Impact:** Bundles with profile PB-INTEGRITY-1 would fail Go
verification with `unknown-version`. The SPEC documents all four
profiles including PB-INTEGRITY-1.

### R4: Outcome naming between TypeScript and Go

TypeScript uses "valid" where Go/vectors use "verified".
TypeScript uses "integrity-failed" where Go/vectors use
"invalid-signature". TypeScript uses "lineage-broken" where
Go/vectors use "lineage-invalid".

**Impact:** The TypeScript implementation returns outcome strings
that differ from the vectors. The SPEC aligns with the vectors.

### R5: Boundary atom evaluation on missing fields

Go returns `false` for most atoms when the context field is missing.
TypeScript `evaluateAtom` also returns `false` for missing fields in
most cases, but the `present` atom specifically checks for non-null
existence.

**Impact:** Minor. Both implementations agree on the behavior for
the atoms used in vectors. The SPEC documents the Go behavior.

### R6: Side attestation field names

Go checks for `authority_id`; TypeScript checks for `role` and
`party` and `statement`. Vectors use empty objects.

**Impact:** The implementations do not agree on side attestation
structure. The SPEC defers to implementation-defined behavior.

### R7: HITL structure differences

TypeScript uses `hitl.required` (boolean) and `hitl.attestation`
(object). Go/vectors use `hitl.approver_id`, `hitl.approved_at`,
`hitl.expiry`.

**Impact:** The implementations do not agree on HITL structure.
The SPEC documents the Go/vector format.

---

## Files Modified

- `/mnt/agents/output/proofbundle/SPEC.md` — fully rewritten
- `/mnt/agents/output/proofbundle/docs/SPEC_DIVERGENCE_AUDIT.md` — new file
