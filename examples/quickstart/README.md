# ProofBundle Quickstart

This quickstart demonstrates the full ProofBundle lifecycle:

1. **Seal** — Create a signed bundle from claims
2. **Verify** — Verify the sealed bundle (should pass)
3. **Tamper** — Modify the bundle contents
4. **Verify** — Verify the tampered bundle (should fail)

## Prerequisites

- `proofbundle` CLI installed (or use `docker run proofbundle`)
- `jq` for JSON manipulation
- `PRIVATE_KEY` and `PUBLIC_KEY` environment variables set

## Run

```bash
export PRIVATE_KEY=/path/to/ed25519_private.pem
export PUBLIC_KEY=/path/to/ed25519_public.pem
./run.sh
```

## Expected Output

```
=== ProofBundle v1.0.0 Quickstart ===

[1/4] Sealing a bundle...
  -> Sealed: /tmp/bundle_sealed.json

[2/4] Verifying sealed bundle...
  -> VERIFICATION: PASSED

[3/4] Tampering with the bundle...
  -> Tampered: /tmp/bundle_tampered.json

[4/4] Verifying tampered bundle (expecting failure)...
  -> VERIFICATION: FAILED (as expected)

Quickstart check passed. Tamper detection works.
```
