# Security Boundary

## 1. Security Scope
This repository contains a browser-based demonstration artifact for sealing and verifying ProofBundle objects.

## 2. What Is In Scope
- Client-side cryptographic operations in browser JavaScript (ED25519 signing/verification, SHA-256, Merkle root computation).
- Client-side verification logic for signature/root checks and boundary predicate evaluation.
- Browser-local state handling for claims and predictions.

## 3. What Is Explicitly Out of Scope
- Backend key management systems.
- Server-side authentication and authorization.
- Durable, multi-user identity and access controls.
- Persistent tamper-evident ledger infrastructure.
- Networked verification service availability and operational controls.
- Third-party audit attestations and certifications.

## 4. Key Management Boundary
- Keys are generated and handled in the browser context.
- Private key material can exist in page memory and user-controlled browser environment.
- No hardened production key-management subsystem is included.

## 5. Storage Boundary
- Claims and predictions are stored in browser `localStorage` for demonstration behavior.
- Local storage can be cleared, modified, or unavailable depending on browser/user environment.
- No repository-provided durable server storage is present.

## 6. Verification Boundary
- Signature verification and Merkle root recomputation are implemented in-browser.
- Lineage handling is bounded: parent reference presence is checked against a provided map; complete recursive parent-chain digest integrity proof is not provided.
- Showcase traces may include scripted explanatory steps in addition to shared verifier behavior.

## 7. Deployment Boundary
- Artifact is static/browser-local.
- No deployment pipeline, runtime hardening profile, secrets management, or service-level guarantees are provided.

## 8. Representation Boundary
- This repository should be represented as a demonstration artifact, not a complete operational assurance system.
- There is no implied third-party audit.
- There is no implied certification.
- Additional infrastructure, review, and testing would be required before stronger operational assurance claims.
