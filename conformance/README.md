# ProofBundle Conformance Corpus

## Corpus Format (`vectors_v1.json`)

Each vector in the corpus is a JSON object with the following fields:

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Unique vector identifier |
| `description` | string | Human-readable test intent |
| `bundle` | object | The ProofBundle under test |
| `publicKey` | string | PEM-encoded Ed25519 public key |
| `context` | object | Verification context (domain, purpose, timestamp) |
| `expected` | object | Expected result: `{ "valid": bool, "canonical": bool, "signatureValid": bool }` |

## Running the Corpus

### CLI
```bash
proofbundle conformance run --vectors conformance/vectors_v1.json --implementation rust
```

### Docker
```bash
docker build -t proofbundle -f docker/Dockerfile .
docker run --rm -v $(pwd):/workspace proofbundle \
  conformance run --vectors /workspace/conformance/vectors_v1.json
```

### GitHub Action
```yaml
- uses: ./github-action
  with:
    vectors: 'conformance/vectors_v1.json'
    implementation: 'rust'
```

## Cross-Implementation Agreement

Run `proofbundle conformance compare` to execute all implementations against
the same corpus and check for result divergence. Results are written to
`cross_impl_results.json`.
