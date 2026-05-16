# Comparison

This document compares ProofBundle to sigstore, in-toto, C2PA, SLSA,
and JWT. The comparison is organized by capability, not by advocacy.

## Summary table

| Capability            | ProofBundle | sigstore | in-toto | C2PA | SLSA | JWT |
|-----------------------|-------------|----------|---------|------|------|-----|
| Offline verification  | Yes         | Partial  | Yes     | Yes  | N/A  | Yes |
| No certifying authority | Yes       | No       | Yes     | Yes  | N/A  | Yes |
| Self-contained bundle | Yes         | No       | Yes     | Yes  | No   | Yes |
| Payload agnostic      | Yes         | Yes      | No      | No   | No   | Yes |
| Supply chain focus    | No          | Yes      | Yes     | Yes  | Yes  | No  |
| Content authenticity  | Yes         | Yes      | Yes     | Yes  | Yes  | Yes |
| Context binding       | Yes         | No       | No      | No   | No   | No  |
| Boundary predicates   | Yes         | No       | No      | No   | No   | No  |
| Lineage / versioning  | Yes         | Yes      | Yes     | No   | Yes  | No  |
| Human-in-the-loop     | Yes         | No       | No      | No   | No   | No  |
| Formal proofs         | Yes         | No       | No      | No   | No   | No  |
| Side attestations     | Yes         | No       | No      | No   | No   | No  |
| Transparency log      | No          | Yes      | No      | No   | No   | No  |
| Keyless signing       | No          | Yes      | No      | No   | No   | No  |
| Media-specific        | No          | No       | No      | Yes  | No   | No  |
| Builds provenance     | No          | Yes      | Yes     | No   | Yes  | No  |
| Mature ecosystem      | No          | Yes      | Yes     | Yes  | Yes  | Yes |

## ProofBundle

ProofBundle is a sealed claim object. A producer signs an opaque payload
and attaches metadata including boundary predicates, lineage references,
and optional human approvals. The verifier checks the signature,
evaluates boundary conditions, resolves lineage, and checks side
attestations. No online service, transparency log, or certifying
authority is required.

ProofBundle is payload-agnostic: the verifier does not interpret the
payload. It is suitable for any domain where a signed claim with context
binding is needed.

ProofBundle does not provide a transparency log, keyless signing,
build provenance recording, or media-specific assertions. Applications
requiring these capabilities compose ProofBundle with other systems.

### Composition notes

- ProofBundle + in-toto: Use ProofBundle as the envelope for in-toto
  attestation payloads, adding context binding and boundary predicates.
- ProofBundle + sigstore: Use sigstore for key management and
  transparency, ProofBundle for the claim format and verification.

## sigstore

sigstore provides keyless signing and a transparency log (Rekor) for
software artifacts. Signers authenticate via OIDC identity providers.
Signatures are recorded in a public log. Verifiers check the log for
revocation and consistency.

sigstore is designed for software supply chain security. It focuses on
build artifacts and package managers. It requires online verification
for log lookups, though some verification can be cached.

sigstore does not provide boundary predicates, context binding, lineage
within the bundle, human-in-the-loop approval, or formal proof checking.
Its attestation format (cosign) is simpler than ProofBundle's metadata
block.

### When to use sigstore

Use sigstore when key management is a barrier, when a public transparency
log is desired, and when the use case is software artifact signing.

## in-toto

in-toto is a framework for software supply chain integrity. It defines a
layout that links steps in a build process. Each step produces signed
metadata (links) that are verified against the layout.

in-toto is focused on build pipelines. It requires a predefined layout
that describes the expected supply chain. Verification checks that each
step was performed by the expected actor and produced the expected
artifacts.

in-toto does not provide context binding, boundary predicates, temporal
expiration within the attestation, or lineage resolution between
independent bundles. Its verification is tied to the layout abstraction.

### When to use in-toto

Use in-toto when verifying software supply chain steps, when a layout
describing the expected pipeline is available, and when the focus is on
build integrity rather than claim portability.

## C2PA

C2PA (Coalition for Content Provenance and Authenticity) is a standard
for content authenticity and provenance. It embeds signed assertions into
media files (images, video, audio) that record the origin and editing
history of the content.

C2PA is media-specific. Its assertion model is designed for creative
content: it records ingredients, actions, and credentials. It uses X.509
certificates for signing. Verification checks the certificate chain and
assertion signatures.

C2PA does not provide boundary predicates, lineage between separate
bundles, human-in-the-loop approval, or formal proof checking. It is
not payload-agnostic: the assertion structure is defined by the C2PA
specification.

### When to use C2PA

Use C2PA when the use case is media provenance, when embedding
assertions in media files is required, and when X.509 certificate chains
are acceptable.

## SLSA

SLSA (Supply-chain Levels for Software Artifacts) is a framework for
software supply chain security. It defines four levels of increasing
security guarantees for build processes. SLSA is a specification, not an
implementation: it describes what build systems and provenance formats
should provide.

SLSA does not define a bundle format or a verifier. It defines
provenance formats (SLSA Provenance) and requirements for build systems.
Verification of SLSA levels is performed by policy engines that check
provenance against level requirements.

SLSA does not provide context binding, boundary predicates,
human-in-the-loop approval, formal proof checking, or a self-contained
bundle format. It is a requirements framework, not a claim format.

### When to use SLSA

Use SLSA when defining security requirements for build systems, when
assessing supply chain maturity, and when SLSA Provenance is the desired
attestation format.

## JWT

JWT (JSON Web Token) is a compact, self-contained format for claims. It
consists of a header, payload, and signature. JWT is widely used for
authentication and authorization.

JWT provides signing, expiration, and issuer identification. It does not
provide boundary predicates, lineage, human-in-the-loop approval, formal
proof checking, or side attestations. JWT payloads are typically
interpreted by the application, not verified structurally.

JWT uses JWS (JSON Web Signature) for signing and JWE (JSON Web
Encryption) for encryption. The JOSE header can specify algorithms,
though the "alg: none" attack has demonstrated vulnerabilities in JWT
parsing.

### When to use JWT

Use JWT when the use case is authentication or authorization, when
compact representation is required, and when the existing JWT ecosystem
is sufficient.

## Key differences

### Transparency log

sigstore provides a public transparency log. ProofBundle does not.
Applications requiring public auditability can log ProofBundle digests
in a transparency log as a separate step.

### Payload agnosticism

ProofBundle and JWT are payload-agnostic. in-toto, C2PA, and SLSA
require specific payload structures. sigstore is payload-agnostic at the
cosign layer but typically carries in-toto or SLSA attestations.

### Context binding

ProofBundle is the only format in this comparison that provides boundary
predicates for context binding. This allows a bundle to declare the
contexts in which it is valid and for the verifier to enforce that
declaration.

### Formal proofs

ProofBundle is the only format in this comparison that supports formal
proof kinds (Coq, Lean, Z3, Isabelle, HOL Light). These proof kinds
allow the payload to carry a machine-checkable proof that the verifier
checks.

### Maturity

sigstore, in-toto, C2PA, SLSA, and JWT have larger ecosystems, more
implementations, and broader adoption than ProofBundle. ProofBundle is
at version 1.0.0 with four reference implementations.
