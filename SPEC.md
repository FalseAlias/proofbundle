# ProofBundle Specification v1.0.0

## 0. Status

This document is a pre-normative descriptive specification. It describes the
ProofBundle claim format, canonical encoding, algorithm registry, verifier
pipeline, and conformance criteria. The intended audience is implementers,
auditors, and standardization bodies.

The specification is stable at version 1.0.0. Future versions follow the
deprecation cycle defined in Section 18.

## 1. Object

A ProofBundle is a JSON object with five top-level keys: `hdr`, `payload`,
`meta`, `refs`, and `seal`. The verifier returns `malformed` when the input
is not a JSON object containing exactly these five keys, or when any required
subfield is absent or malformed.

```
{
  "hdr":     { ... },
  "payload": "...",
  "meta":    { ... },
  "refs":    [ ... ],
  "seal":    { ... }
}
```

No additional top-level keys are permitted. The order of keys in the
serialized form is governed by the canonical encoding defined in Section 7.

### 1.1 Field summary

| Field   | Presence | Description                                |
|---------|----------|--------------------------------------------|
| hdr     | required | Header: identity and version metadata      |
| payload | required | Base64url-encoded opaque payload bytes     |
| meta    | required | Metadata: producer, time, algorithms       |
| refs    | required | References: lineage and parent linkage     |
| seal    | required | Seal: digest and cryptographic signature   |

The refs field is an array. When empty, lineage verification (Section 16)
is skipped. When containing one or more entries, each entry is treated as a
required parent reference and all fields within it are mandatory.

## 2. Header (hdr)

The header contains version and identity metadata.

| Field     | Type   | Presence | Description                              |
|-----------|--------|----------|------------------------------------------|
| spec_id   | string | required | Always `"PROOFBUNDLE"`                   |
| spec_ver  | string | required | Specification version, e.g. `"1.0.0"`    |
| profile   | string | required | Profile name (Section 9)                 |
| bundle_id | string | required | Unique bundle identifier                 |

The verifier returns `unknown-version` when `spec_id` is not `"PROOFBUNDLE"`.

The verifier returns `unknown-version` when `spec_ver` is not recognized by
the verifier's version policy (Section 18).

The verifier returns `unknown-version` when `profile` names a profile not
present in the profile registry (Section 9).

The verifier returns `malformed` when `bundle_id` is absent, not a string,
or empty.

## 3. Payload

The payload field is a base64url-encoded (RFC 4648, unpadded) string
representing opaque bytes. The verifier decodes this string and treats the
resulting byte sequence as the payload.

The verifier returns `malformed` when the payload field is absent, not a
string, or contains characters outside the base64url alphabet.

The payload bytes are opaque to the verifier. The verifier does not
interpret, parse, or validate the internal structure of the payload. Higher-
level applications define their own payload schemas.

## 4. Meta

The meta block contains metadata about the bundle, its producer, and its
verification constraints.

| Field                      | Type   | Presence | Description                              |
|----------------------------|--------|----------|------------------------------------------|
| producer_id                | string | required | Identifier of the bundle producer        |
| created_at                 | string | required | ISO 8601 timestamp                       |
| canonical_encoding         | string | required | Canonical encoding name (Section 7)      |
| digest_alg                 | string | required | Digest algorithm name (Section 8.1)      |
| sig_alg                    | string | required | Signature algorithm name (Section 8.2)   |
| proof_kind                 | string | required | Proof kind name (Section 8.3)            |
| boundary                   | object | optional | Boundary predicate (Section 12)          |
| side_attestations          | array  | optional | Side attestation descriptors (Section 13)|
| requires_side_attestations | bool   | optional | Whether side attestations are required   |
| hitl                       | object | optional | HITL approval block (Section 14)         |

The verifier returns `malformed` when any required meta field is absent,
or when any field has a type that does not match the table above.

The verifier returns `not-defined-in-this-version` when `digest_alg`,
`sig_alg`, or `proof_kind` names a value not present in the respective
registry (Section 8).

### 4.1 producer_id

A string identifying the entity that produced the bundle. The format is
application-defined. The verifier checks only that the field is present and
is a string.

### 4.2 created_at

An ISO 8601 timestamp in UTC. The verifier returns `malformed` when the
timestamp cannot be parsed.

### 4.3 canonical_encoding

The name of the canonical encoding applied to produce the signed bytes.
At version 1.0.0, the only valid value is `"PB-CANON-JSON-1"`. The verifier
returns `malformed` when this field names a value not in the encoding
registry.

### 4.4 digest_alg

Names the digest algorithm used to compute the sealed content digest
(Section 15). See Section 8.1 for the algorithm registry.

### 4.5 sig_alg

Names the signature algorithm used to produce the seal signature. See
Section 8.2 for the algorithm registry.

### 4.6 proof_kind

Names the proof kind that governs how the verifier dispatches proof
checking. See Section 8.3 for the registry. At version 1.0.0, the only
valid proof kind is `"signature"`.

### 4.7 boundary

An optional boundary predicate object. When present, the verifier evaluates
it against the caller-supplied context during the boundary stage
(Section 11.9). When absent, the boundary stage is skipped for profiles
that do not require it.

The boundary object has a single required key: `all`. Its value is an array
of boundary atoms (Section 12). The verifier returns `indeterminate` when
the boundary object is present but cannot be parsed, or when any atom has
an invalid structure.

### 4.8 side_attestations

An optional array of side attestation descriptors (Section 13). Each
descriptor is an object with fields defined in Section 13. The verifier
collects available side attestations and checks them during the side-info
stage (Section 11.10).

### 4.9 requires_side_attestations

An optional boolean. When true, the verifier returns `missing-side-info`
when any required side attestation is absent or invalid. When false or
absent, missing side attestations are treated as non-fatal.

### 4.10 hitl

An optional HITL (human-in-the-loop) approval block (Section 14). When
present, the verifier checks the approval during the HITL stage
(Section 11.12).

## 5. Refs

The refs field is an array containing lineage metadata linking the bundle
to parent bundles.

| Field         | Type   | Presence | Description                              |
|---------------|--------|----------|------------------------------------------|
| parent_id     | string | required | Bundle ID of the parent bundle           |
| parent_digest | string | required | Base64url digest of the parent bundle    |
| digest_alg    | string | required | Digest algorithm used for parent_digest  |
| edge_kind     | string | required | Lineage edge kind (Section 8.4)          |

The verifier returns `malformed` when refs is absent or when any of its
entries has an absent or malformed field.

The verifier returns `lineage-invalid` when refs is non-empty and the
parent bundle cannot be resolved or its digest does not match
(Section 16).

When refs is empty, the lineage stage (Section 11.11) is skipped.

## 6. Seal

The seal block contains the cryptographic digest and signature over the
canonical encoding of the bundle.

| Field          | Type   | Presence | Description                              |
|----------------|--------|----------|------------------------------------------|
| digest_alg     | string | required | Digest algorithm name                    |
| digest_b64u    | string | required | Base64url-encoded digest                 |
| sig_alg        | string | required | Signature algorithm name                 |
| signature_b64u | string | required | Base64url-encoded signature              |

The verifier returns `malformed` when any seal field is absent or
malformed.

The verifier returns `invalid-signature` when the digest of the canonical
encoding does not match `digest_b64u`.

The verifier returns `invalid-signature` when the signature does not verify
against the public key supplied by the caller.

### 6.1 Signature input

The signed bytes are the canonical encoding (Section 7) of the bundle
object with the seal block excluded. The canonical encoding is computed
over the object containing `hdr`, `payload`, `meta`, and `refs`, with the
`seal` field omitted. This construction ensures the signature covers all
content fields while excluding the seal itself from the signed material.

## 7. Canonical Encoding PB-CANON-JSON-1

PB-CANON-JSON-1 is a restricted subset of JSON with deterministic
serialization rules. The canonical encoding of a bundle is the UTF-8 byte
sequence produced by applying these rules to the sealed content
(hdr + payload + meta + refs, excluding seal).

### 7.1 Restrictions

- Object keys are sorted lexicographically by Unicode code point.
- No whitespace characters appear outside string literals.
- String literals contain only valid Unicode characters in NFC normalized
  form. Unpaired surrogate code points are rejected.
- Number literals contain no fractional part, no exponent, and no leading
  plus sign. Only integer values within the safe integer range
  (-9007199254740991 to 9007199254740991) are permitted.
- The literal values are `true`, `false`, and `null`.
- Arrays preserve element order.
- No duplicate keys are permitted in objects.
- UTF-8 encoding is applied to the resulting character sequence.

### 7.2 Sorting rule

Object keys are sorted by the binary UTF-8 representation of the key name,
compared lexicographically byte by byte. This is equivalent to sorting by
Unicode code point for ASCII keys and produces a total order for all valid
UTF-8 strings.

### 7.3 Number restriction

Only JSON number literals that match the regular expression `^-?(0|[1-9][0-9]*)$` are valid. Leading zeros are prohibited except for the single digit
`0`. Decimal points and exponent notation are prohibited. Values outside
the safe integer range are rejected.

### 7.4 Canonicalization procedure

The verifier produces the canonical encoding by:

1. Validating that the input is valid JSON.
2. Checking that all numbers are integers within the restricted format and
   safe integer range.
3. Normalizing all string values to Unicode NFC.
4. Sorting all object keys lexicographically.
5. Removing all whitespace outside string literals.
6. Serializing to a UTF-8 byte string.

The verifier returns `malformed` when any step fails.

## 8. Algorithm Registry

The algorithm registry is append-only. Entries are never removed, only
deprecated per Section 18.

### 8.1 Digest algorithms

| Name     | Description                       | Status  |
|----------|-----------------------------------|---------|
| SHA-256  | SHA-256 (32-byte output)          | active  |
| SHA-384  | SHA-384 (48-byte output)          | active  |
| SHA-512  | SHA-512 (64-byte output)          | active  |
| BLAKE3   | BLAKE3 with 256-bit output        | active  |
| BLAKE2b  | BLAKE2b with 512-bit output       | active  |

The verifier returns `not-defined-in-this-version` when `digest_alg` names
a value not in this table. The verifier computes digests according to the
respective specification for the named algorithm.

### 8.2 Signature algorithms

| Name          | Description                          | Status |
|---------------|--------------------------------------|--------|
| Ed25519       | Ed25519 (RFC 8032)                   | active |
| ECDSA-P256    | ECDSA with P-256 and SHA-256         | active |
| ECDSA-P384    | ECDSA with P-384 and SHA-384         | active |
| ECDSA-P521    | ECDSA with P-521 and SHA-512         | active |
| RSA-PSS-2048  | RSA-PSS with 2048-bit key, SHA-256   | active |
| RSA-PSS-3072  | RSA-PSS with 3072-bit key, SHA-256   | active |
| RSA-PSS-4096  | RSA-PSS with 4096-bit key, SHA-256   | active |

The verifier returns `not-defined-in-this-version` when `sig_alg` names a
value not in this table.

ECDSA-P256 signatures use SHA-256 as the hash function. ECDSA-P384
signatures use SHA-384. ECDSA-P521 signatures use SHA-512.

RSA-PSS signatures use SHA-256 as the hash function and PSS salt length
equals hash length.

### 8.3 Proof kinds

| Name      | Description                           | Status |
|-----------|---------------------------------------|--------|
| signature | Standard cryptographic signature      | active |

The verifier returns `not-defined-in-this-version` when `proof_kind` names
a value not in this table.

At version 1.0.0, the only active proof kind is `"signature"`. The
signature proof kind delegates verification to the cryptographic signature
stage (Section 11.8).

### 8.4 Lineage edge kinds

| Name                     | Description                               | Status |
|--------------------------|-------------------------------------------|--------|
| hash-conditioned-successor | Parent succeeded by this bundle         | active |

The verifier returns `malformed` when `edge_kind` names a value not in
this table.

## 9. Profiles

A profile constrains the set of features that a bundle uses. Each
profile includes all constraints of the profiles above it in the table.

| Profile       | Boundary | Side Info | Lineage | HITL   |
|---------------|----------|-----------|---------|--------|
| PB-INTEGRITY-1| no       | no        | no      | no     |
| PB-BOUNDARY-1 | yes      | no        | no      | no     |
| PB-LINEAGE-1  | yes      | yes       | yes     | no     |
| PB-REGULATED-1| yes      | yes       | yes     | yes    |

The verifier returns `not-defined-in-this-version` when the bundle's
profile is not in the profile registry.

The verifier returns `policy-denied` when the bundle uses a feature not
permitted by its declared profile.

Profile validation occurs after version validation and before algorithm
lookup. The verifier checks:

1. The profile name is in the profile registry.
2. The bundle does not use features outside the profile's permitted set.

### 9.1 Feature constraints

PB-INTEGRITY-1: The bundle contains no boundary, no side attestations,
no lineage refs, and no HITL block.

PB-BOUNDARY-1: The bundle contains a boundary predicate. The bundle
does not contain side attestations, lineage refs, or a HITL block.

PB-LINEAGE-1: The bundle contains a boundary predicate, side
attestations, and lineage refs. The bundle does not contain a HITL block.

PB-REGULATED-1: The bundle contains all features including boundary,
side attestations, lineage refs, and HITL approval.

## 10. Verification Outcomes

The verifier returns one of 11 outcomes. Each outcome has a numeric code
for CLI exit status and a string identifier.

| Code | Identifier                | Description                                          |
|------|---------------------------|------------------------------------------------------|
| 0    | verified                  | Bundle is fully verified                             |
| 10   | malformed                 | JSON structure or required field is malformed        |
| 11   | invalid-signature         | Signature verification failed                        |
| 12   | out-of-bounds             | Boundary predicate evaluated to false                |
| 13   | unknown-version           | spec_ver or spec_id not recognized                   |
| 14   | missing-side-info         | Required side attestation is absent or invalid       |
| 15   | lineage-invalid           | Parent bundle cannot be resolved or digest mismatch  |
| 16   | resource-exhausted        | Verification exceeded resource budget                |
| 17   | policy-denied             | Profile constraint violated                          |
| 18   | indeterminate             | Boundary atom malformed or evaluation error          |
| 19   | not-defined-in-this-version | Algorithm, profile, or proof kind not in registry  |

The verifier returns exactly one outcome per verification. The outcome is
determined by the first stage that fails, evaluated in the order defined
in Section 11.

### 10.1 Outcome determinism

Given the same bundle, public key, context, and available side
attestations, the verifier outcome is deterministic. All implementations
in the conformance corpus agree on the outcome for all 300 vectors.

## 11. Verifier Stages

The verifier evaluates a bundle in 12 sequential stages. Each stage
produces either a failure outcome or continues to the next stage.

### 11.1 Stage order

```
parse -> resource-budget -> schema -> version -> profile -> canonical
-> integrity -> signature -> boundary -> side-info -> lineage -> hitl
```

### 11.2 Parse stage

The verifier parses the input as JSON. The verifier returns `malformed`
when the input is not valid JSON.

### 11.3 Resource budget stage

The verifier checks that the bundle size is within the caller-supplied or
implementation-defined limit. The verifier returns `resource-exhausted`
when the bundle size exceeds the limit. The minimum required limit is
1 MiB.

### 11.4 Schema stage

The verifier checks that the parsed JSON is an object containing the
required top-level keys (`hdr`, `payload`, `meta`, `refs`, `seal`). The
verifier checks that each field conforms to the type and structure defined
in Sections 2-6. The verifier returns `malformed` on any check failure.

### 11.5 Version stage

The verifier checks `hdr.spec_id` is `"PROOFBUNDLE"` and `hdr.spec_ver`
against its supported version set. The verifier returns `unknown-version`
when either check fails.

At version 1.0.0, verifiers support `"1.0.0"`.

### 11.6 Profile stage

The verifier checks `hdr.profile` against the profile registry (Section 9)
and validates that the bundle content conforms to the profile's
constraints. The verifier returns `not-defined-in-this-version` when the
profile is not in the registry. The verifier returns `policy-denied` when
the bundle content violates the profile's feature constraints.

### 11.7 Canonical stage

The verifier produces the canonical encoding (Section 7) of the bundle's
sealed content (hdr, payload, meta, refs, excluding seal). The verifier
returns `malformed` when canonicalization fails.

### 11.8 Integrity stage

The verifier computes the digest of the canonical encoding using the
algorithm named in `seal.digest_alg`. The verifier compares this digest
to the base64url-decoded value of `seal.digest_b64u`. The verifier
returns `invalid-signature` when the values differ.

### 11.9 Signature stage

The verifier verifies the signature in `seal.signature_b64u` against the
canonical encoding bytes using the algorithm named in `seal.sig_alg` and
the public key supplied by the caller. The verifier returns
`invalid-signature` when verification fails.

### 11.10 Boundary stage

When the bundle's profile permits boundary evaluation and `meta.boundary`
is present, the verifier evaluates the boundary predicate against the
caller-supplied context object. The verifier returns `out-of-bounds`
when the predicate evaluates to false. The verifier returns
`indeterminate` when the boundary expression is malformed or an atom
cannot be evaluated. When absent and the profile does not require it,
this stage is skipped.

### 11.11 Side-info stage

When `meta.requires_side_attestations` is true, the verifier checks each
side attestation descriptor in `meta.side_attestations` (Section 13). The
verifier returns `missing-side-info` when a required side attestation is
absent or invalid. When not required, this stage is skipped.

### 11.12 Lineage stage

When the bundle's profile permits lineage and `refs` is non-empty, the
verifier resolves each parent bundle (Section 16) and checks the parent
digest. The verifier returns `lineage-invalid` when a parent cannot be
resolved, when the parent digest does not match, when a cycle is detected,
or when the maximum lineage depth is exceeded. When refs is empty or the
profile does not permit lineage, this stage is skipped.

### 11.13 HITL stage

When the bundle's profile requires HITL approval (`PB-REGULATED-1`), the
verifier checks the HITL approval block (Section 14). The verifier
returns `policy-denied` when the HITL block is missing, when required
fields are absent, or when the HITL approval has expired. When the
profile does not require HITL, this stage is skipped.

## 12. Boundary Atom Grammar

The boundary predicate is an object with key `all` mapping to an array of
boundary atoms. The verifier evaluates the predicate by evaluating each
atom and returning true only when all atoms evaluate to true.

### 12.1 Atom structure

Each atom is a single-key object. The key names the atom type and the
value is an array of operands specific to that atom type.

Example:
```json
{
  "all": [
    { "equals": ["env", "demo"] },
    { "range": ["age", 18, 65] }
  ]
}
```

### 12.2 Atom types

#### Field atoms

| Atom         | Operands             | Description                                         |
|--------------|----------------------|-----------------------------------------------------|
| equals       | [field, value]       | Context value at field equals value                 |
| in           | [field, [values]]    | Context value is in the value list                  |
| range        | [field, min, max]    | Numeric context value is between min and max (incl) |
| present      | field (string)       | Context contains the named field                    |
| before       | [field, timestamp]   | Context timestamp is before the bound timestamp     |
| after        | [field, timestamp]   | Context timestamp is after the bound timestamp      |
| within       | [field, start, end]  | Context timestamp is between start and end (incl)   |
| expired      | field (string)       | Context timestamp is before the reference time      |
| not_expired  | field (string)       | Context timestamp is at or after the reference time |
| age_lt       | [field, seconds]     | Age of context timestamp is less than seconds       |
| age_gt       | [field, seconds]     | Age of context timestamp is greater than seconds    |
| within_last  | [field, seconds]     | Context timestamp is within the last seconds        |
| within_next  | [field, seconds]     | Context timestamp is within the next seconds        |

#### Logical atoms

| Atom | Operands             | Description                                         |
|------|----------------------|-----------------------------------------------------|
| all  | [atom, ...]          | All nested atoms evaluate to true                   |
| any  | [atom, ...]          | At least one nested atom evaluates to true          |
| not  | atom (single)        | The nested atom evaluates to false                  |

### 12.3 Field resolution

A field name is a string that identifies a key in the caller-supplied
context object. The context object is a flat JSON object; nested field
paths are not supported in version 1.0.0.

Example: `"env"` selects `context.env`.

### 12.4 Evaluation rules

- The verifier resolves the field name against the caller-supplied context
  object. When the field is not present, field atoms other than `present`
  evaluate to false.
- String comparisons in `equals` and `in` are exact and case-sensitive.
- Numeric comparisons in `range`, `age_lt`, `age_gt` use the numeric
  values from the context. When the context value is not a number, the
  atom evaluates to false.
- The `range` atom is inclusive at both endpoints.
- Timestamp atoms (`before`, `after`, `within`, `expired`, `not_expired`,
  `age_lt`, `age_gt`, `within_last`, `within_next`) parse the context
  value and bound as ISO 8601 timestamps. When a timestamp cannot be
  parsed, the atom evaluates to false.
- The `expired` atom compares the context timestamp against the reference
time (the verifier's current clock or a caller-supplied reference time).
It evaluates to true when the context timestamp is strictly before the
reference time.
- The `not_expired` atom is the negation of `expired`.
- The `age_lt` and `age_gt` atoms measure the elapsed time between the
context timestamp and the reference time in seconds.
- The `within_last` atom evaluates to true when the context timestamp is
between 0 and `seconds` before the reference time.
- The `within_next` atom evaluates to true when the context timestamp is
between 0 and `seconds` after the reference time.
- The `present` atom evaluates to true when the named field exists in the
context, regardless of its value (including null).
- Logical atoms (`all`, `any`, `not`) evaluate nested atoms recursively.
The `all` atom returns true when every nested atom returns true. The
`any` atom returns true when at least one nested atom returns true. The
`not` atom returns the logical negation of its single nested atom.

### 12.5 Malformed atoms

When a boundary atom has an incorrect operand count, an unsupported atom
type, or operands of the wrong type, the verifier returns
`indeterminate` from the boundary stage.

## 13. Side Attestations

A side attestation is evidence provided by a third party that is checked
during verification but is not part of the sealed bundle.

### 13.1 Side attestation descriptor

Each entry in `meta.side_attestations` is an object. At version 1.0.0,
the descriptor structure is implementation-defined. The verifier checks
only that the descriptor is a JSON object.

### 13.2 Side attestation checking

When `meta.requires_side_attestations` is true, the verifier checks that
`meta.side_attestations` is a non-empty array. The verifier returns
`missing-side-info` when the array is empty or absent. The verifier
returns `indeterminate` when any entry is not a JSON object.

## 14. HITL Approval

The HITL (human-in-the-loop) block records that a human operator reviewed
and approved the bundle.

### 14.1 HITL block structure

| Field         | Type   | Presence | Description                              |
|---------------|--------|----------|------------------------------------------|
| approver_id   | string | required | Identifier of the approving human        |
| approved_at   | string | required | ISO 8601 timestamp of approval           |
| expiry        | string | optional | ISO 8601 expiration of the approval      |

### 14.2 HITL validation

The verifier checks:

1. `approver_id` is a non-empty string.
2. `approved_at` is a valid ISO 8601 timestamp.
3. When `expiry` is present, the reference time is before the expiry
timestamp.

Any failure produces `policy-denied`.

## 15. Sealed Content Digest

The sealed content digest is computed over the canonical encoding of the
bundle object with the seal block excluded. The digest algorithm is named
in `seal.digest_alg`.

The input to the digest function is the UTF-8 byte sequence of the
canonical encoding (Section 7) of the object containing `hdr`, `payload`,
`meta`, and `refs`.

The verifier compares the computed digest to the base64url-decoded value
of `seal.digest_b64u`. The verifier returns `invalid-signature` when
the values differ.

## 16. Lineage Resolution

When `refs` is non-empty and the profile permits lineage, the verifier
resolves each parent bundle and validates the lineage link.

### 16.1 Resolution procedure

1. The verifier locates the parent bundle by `parent_id` through the
caller-supplied parent bundle set.
2. The verifier computes the sealed content digest of the parent bundle
using `digest_alg`.
3. The verifier compares the computed digest to the base64url-decoded
value of `parent_digest`.
4. On digest mismatch, the verifier returns `lineage-invalid`.
5. On parent not found, the verifier returns `lineage-invalid`.

### 16.2 Lineage depth limit

The verifier enforces a maximum lineage depth. The default maximum depth
is 100. The verifier returns `lineage-invalid` when this limit is
exceeded.

### 16.3 Cycle detection

The verifier detects cycles in the lineage chain by tracking visited
parent IDs. The verifier returns `lineage-invalid` when a cycle is
detected.

## 17. Conformance

The conformance corpus consists of 300 test vectors covering all 11
outcomes and 4 profiles.

| Category                      | Count | Outcome                       |
|-------------------------------|-------|-------------------------------|
| algorithm-valid               | 35    | verified                      |
| algorithm-boundary-fail       | 35    | out-of-bounds                 |
| algorithm-tamper              | 35    | invalid-signature             |
| temporal-boundary             | 25    | out-of-bounds / verified      |
| lineage-valid                 | 12    | verified                      |
| lineage-invalid               | 23    | lineage-invalid               |
| missing-side-info             | 20    | missing-side-info             |
| indeterminate                 | 20    | indeterminate                 |
| malformed                     | 15    | malformed                     |
| resource-exhausted            | 15    | resource-exhausted            |
| unknown-version               | 20    | unknown-version               |
| not-defined-in-this-version   | 25    | not-defined-in-this-version   |
| policy-denied                 | 15    | policy-denied                 |

### 17.1 Cross-implementation agreement

All three reference implementations (TypeScript, Rust, Go) are run against
all 300 vectors. A vector passes conformance when all implementations
return the same outcome string. The recorded results are in
`conformance/vectors_v1.json`.

## 18. Versioning

### 18.1 Version format

Versions follow semantic versioning: MAJOR.MINOR.PATCH. The spec_ver
field encodes the version as a string.

### 18.2 Compatibility rules

A MAJOR version change indicates incompatible format changes. Verifiers
supporting version N.x.x are not required to support version N+1.x.x.

A MINOR version change indicates backward-compatible additions such as new
optional fields and new registry entries. Verifiers supporting version
N.M.x also support N.M+1.x.

A PATCH version change indicates clarifications and corrections with no
format change.

### 18.3 Deprecation cycle

Registry entries and features follow a three-phase deprecation cycle:

1. **Announced**: The deprecation is documented in the specification and
release notes. The entry remains active.
2. **Soft-deprecated**: Verifiers emit a warning when the deprecated
entry is used but continue to accept it.
3. **Removed**: Verifiers return `not-defined-in-this-version` when the
removed entry is encountered.

Each phase lasts at least one minor version. The full cycle spans at
least two minor versions.

### 18.4 Version 1.0.0 stability

At version 1.0.0, no entries are deprecated. All registry entries defined
in this specification are in the active state.

## 19. Plugin Registration

Implementations support additional algorithms, proof kinds, profiles,
and boundary atoms through a plugin mechanism.

### 19.1 Registration interface

A plugin registers an entry with:

- A unique identifier string
- The registry table being extended (digest, signature, proof_kind, profile, boundary_atom)
- A handler function or module
- A minimum spec_ver

### 19.2 Verification behavior

When a bundle uses a plugin-registered entry:

- The verifier returns `not-defined-in-this-version` when the plugin is
not loaded.
- The verifier invokes the plugin handler when the plugin is loaded.
- The plugin handler returns a stage outcome that is treated like any
built-in outcome.

### 19.3 Conformance note

Bundles using plugin-registered entries are not covered by the 300-vector
conformance corpus. Cross-implementation agreement for plugin content is
the responsibility of the plugin authors.

## 20. Genesis

A genesis bundle is a bundle with an empty `refs` array. It has no parent
and no lineage history. Genesis bundles are used to anchor lineage chains.

The verifier accepts genesis bundles when all other stages pass. An empty
`refs` array does not produce any warning or error.

The first bundle in any lineage chain is always a genesis bundle. All
subsequent bundles reference their immediate parent via `refs`.
