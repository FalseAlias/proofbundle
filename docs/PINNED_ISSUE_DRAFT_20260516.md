# ProofBundle public alpha: verifier, manifest, audit standing, and quarantine evidence

ProofBundle public alpha is live as a scoped, receipt-backed entrypoint. It is
not release-green and it does not assert universal proof closure.

- Pages URL: `https://falsealias.github.io/proofbundle/`
- Repository URL: `https://github.com/FalseAlias/proofbundle`
- Public manifest: `PUBLIC_PROOFBUNDLE_MANIFEST_20260516.json`
- Browser verifier: `web/proofbundle_v1_0_app.html`
- Full inventory reference: `proofs/PROOF_LEDGER.jsonl`
- Canonical proof index reference: `proofs/PROOF_INVENTORY.generated.json`
- Newest confirmed bridge sequence in this publication pass: `2684`
- Newest confirmed bridge hash-chain head: `BBC43459FC55341897D8DD13B03D202238C4F0BA7A5AB0AD23528BB646E62252`
- Merkle standing: roots reported across four major bridge sequences; public manifest records unknown where no root artifact is committed here
- Audit exception count used: `189`
- Quarantine path: `evidence/quarantine/README.md`

Bridge-reported indexed corpus snapshot:

- Formal proof and verification files indexed: `13,236`
- Coq: `9,181`
- Lean 4: `2,840`
- Isabelle: `981`
- Z3: `121`
- Python: `113`
- OTS artifacts present in source report: `2,634 / 2,634`
- Python conformance: `4 / 4`
- JavaScript conformance: `303 / 303`
- TypeScript conformance: `300 / 300`
- Large-file dedup scan: `432` files over 10 MB, `63` duplicate groups, `25.79 GB` duplicate data, `4.61 GB` unique bytes
- Active VM instances: `2`

Request: adversarial technical review of the verifier model, evidence schema,
conformance vectors, proof standing, bridge/OTS/Merkle evidence handling, and
AI-governance evidence-carrier mapping where present.
