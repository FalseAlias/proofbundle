# Extending

## Overview

The ProofBundle specification is designed to accommodate extensions
without breaking existing implementations. This document describes how
to add new proof kinds, domain templates, digest algorithms, signature
algorithms, and boundary atoms.

## Extension model

Extensions are registered in an append-only registry. Once registered,
an entry is never removed. Deprecated entries follow the deprecation
cycle (Section 18). This append-only property ensures that bundles
produced today remain verifiable in the future.

## Adding a proof kind

To add a new proof kind:

1. Choose a unique identifier string. It must not conflict with existing
   entries in the proof kind registry (Section 8.3).
2. Define the verification procedure. The procedure must produce either
   success or `proof-refuted`.
3. Specify the payload format. The payload format must be documented.
4. Specify the profile requirements. Which profiles permit the new proof
   kind.
5. Submit a registration request to the ProofBundle specification
   maintainers.
6. Upon acceptance, the entry is added to the registry in the next
   minor version.

### Proof kind registration template

```
Identifier: (unique string)
Description: (human-readable description)
Verification procedure: (step-by-step)
Payload format: (format specification)
Permitted profiles: (list of profile names)
Reference implementation: (URL or code)
Security considerations: (text)
```

## Adding a digest algorithm

To add a new digest algorithm:

1. Choose a unique identifier string. It must not conflict with existing
   entries in the digest algorithm registry (Section 8.1).
2. Specify the algorithm. Reference the specification (RFC, NIST
   document, etc.).
3. Specify the output length in bits.
4. Provide a reference implementation.
5. Submit a registration request.

### Digest registration template

```
Identifier: (unique string)
Algorithm: (name and reference)
Output length: (bits)
Reference implementation: (URL or code)
Security level: (equivalent symmetric bits)
```

## Adding a signature algorithm

To add a new signature algorithm:

1. Choose a unique identifier string. It must not conflict with existing
   entries in the signature algorithm registry (Section 8.2).
2. Specify the algorithm. Reference the specification.
3. Specify the key size and signature size.
4. Note any runtime variability (e.g., ECDSA signature encoding).
5. Provide a reference implementation.
6. Submit a registration request.

### Signature registration template

```
Identifier: (unique string)
Algorithm: (name and reference)
Key size: (bits)
Signature size: (bytes)
Runtime variability: (yes/no, description)
Reference implementation: (URL or code)
Security level: (equivalent symmetric bits)
```

## Adding a boundary atom

To add a new boundary atom:

1. Choose a unique atom name. It must not conflict with existing atoms
   (Section 12).
2. Define the operand structure (number and type of operands).
3. Define the evaluation semantics.
4. Specify the error conditions.
5. Submit a registration request.

### Boundary atom registration template

```
Atom name: (unique string)
Operands: (count and types)
Evaluation: (semantics description)
Error conditions: (list)
Example: (JSON example)
```

## Adding a domain template

Domain templates are not part of the specification registry. They are
conventions documented by applications. To add a domain template:

1. Define the boundary template as a JSON object.
2. List the identity variables.
3. Document the usage pattern.
4. Publish the template in application documentation.

Domain templates may be submitted to the ProofBundle documentation for
inclusion in the standard set.

## Adding a profile

Profiles are part of the specification. New profiles are added in minor
version releases. To propose a new profile:

1. Define the profile name.
2. Specify the permitted digest algorithms.
3. Specify the permitted signature algorithms.
4. Specify the permitted proof kinds.
5. Specify the permitted features.
6. Justify the profile's purpose.
7. Submit a specification change request.

## Plugin mechanism

Implementations may support extensions before they are standardized via
the plugin mechanism (Section 19). A plugin registers an entry with a
unique identifier and a handler function. The verifier invokes the
handler when a bundle uses the plugin-registered entry.

Plugins are implementation-specific. Bundles using plugin-registered
entries are not covered by the conformance corpus.

## Backward compatibility

All extensions preserve backward compatibility:

- New registry entries are ignored by older verifiers (which return
  `unknown-algorithm`).
- New optional fields in the bundle object are ignored by older
  verifiers (which may reject them as `invalid-schema` if they appear as
  unknown top-level keys).
- New boundary atoms produce `out-of-bounds` on older verifiers that do
  not recognize them.

Bundles intended for broad compatibility should use only entries
registered in the version of the specification that their target
audience's verifiers support.
