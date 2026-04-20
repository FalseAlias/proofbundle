# ProofBundle Repository

## 1. Repository Purpose
This repository contains a browser-local, single-file demonstration of ProofBundle sealing and verification workflows.

## 2. What This Repository Contains
- A frozen historical source artifact dated 2026-04-19.
- A dated successor artifact dated 2026-04-20 with narrowly scoped corrections.
- A stable root entrypoint for local static execution and static hosting.
- Repository-level documentation that states implemented behavior and explicit boundaries.

## 3. Historical Artifact Lineage
- **Historical source artifact (frozen):** `2026-04-19_proofbundle_ui_genesis.html`
- **Successor artifact:** `2026-04-20_proofbundle_ui_v1.2.1.html`
- **Stable entrypoint:** `index.html` (redirects to the successor artifact)

The historical source artifact remains unmodified. Successors are additive and dated.

## 4. Stable Entrypoint
Open `index.html` in a browser. It redirects to `2026-04-20_proofbundle_ui_v1.2.1.html`.

Rationale: this preserves the historical source file while giving reviewers a stable root URL for local use and static hosting.

## 5. Implemented Capabilities
The current artifact implements the following in browser JavaScript:
- ED25519 keypair generation, signing, and verification (Web Crypto with fallback implementation).
- Merkle root commitment over canonicalized bundle components (`hdr`, `meta`, `payload`).
- Bundle sealing flow (construct root, sign, embed signature object).
- Bundle verification flow with result traces.
- Boundary predicate evaluation (`equals`, `present`, `in`, `range`).
- Parent-reference presence checks using a caller-provided bundle map.
- Demonstration domain profiles with example contexts and evaluator.
- Claims and prediction demo panels with browser-local persistence.
- Demo state export/import/reset.
- Showcase scenarios that include mixed trace types (shared verifier outputs plus scripted explanatory steps).

## 6. Scope and Limitations
- Browser-local artifact only; no backend service is included.
- Claims/predictions persistence uses browser `localStorage` only.
- Parent lineage handling checks referenced parent presence in provided input; it does not provide complete recursive digest-proof of an entire ancestry tree.
- Showcase output includes scripted explanatory steps and should be read as demonstration behavior.
- No durability guarantee beyond local browser storage behavior.

## 7. Non-Claims
This repository does **not** provide:
- a persistent ledger,
- backend storage,
- a networked verification service,
- hardened key custody,
- formal audit,
- certification,
- production deployment assurance,
- server-side access control,
- durable identity management,
- threat-hardened key lifecycle management.

## 8. Local Execution
No build step is required.

Options:
1. Open `index.html` directly in a browser.
2. Or serve statically, for example:
   - `python3 -m http.server 8000`
   - open `http://localhost:8000/`

## 9. GitHub Pages / Static Hosting
This repository is compatible with static hosting.
- Root path should serve `index.html`.
- `.nojekyll` is included to avoid Jekyll processing side effects.

## 10. Repository Structure
- `2026-04-19_proofbundle_ui_genesis.html` — frozen historical source artifact.
- `2026-04-20_proofbundle_ui_v1.2.1.html` — dated successor artifact.
- `index.html` — stable root entrypoint.
- `README.md`, `SECURITY.md`, `CHANGELOG.md`, `CONTRIBUTING.md` — repository governance and boundary docs.
- `LICENSE-MIT`, `LICENSE-APACHE` — dual-license texts.

## 11. Security Boundary
See `SECURITY.md` for explicit scope, key management boundary, storage boundary, verification boundary, and deployment boundary.

## 12. Licensing
Dual-licensed under **MIT OR Apache-2.0** at user option, consistent with the license intent declared in the canonical artifact header.

- `LICENSE-MIT`
- `LICENSE-APACHE`

## 13. Successor Artifact Policy
- Do not modify frozen dated historical artifacts.
- Add dated successor artifacts for corrections.
- Preserve lineage in filenames and docs.
- Keep claims grounded in implemented behavior.

## 14. Future Work Boundary
Future work is out of current repository scope unless added explicitly in new dated artifacts and accompanying documentation.

Potential future work categories (not implemented here): backend persistence, independent verifier service, key custody subsystem, audit process, and operational controls.
