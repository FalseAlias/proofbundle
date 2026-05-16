#!/usr/bin/env bash
set -euo pipefail

echo "=== ProofBundle v1.0.0 Quickstart ==="
echo ""

# Step 1: Seal a bundle
echo "[1/4] Sealing a bundle..."
proofbundle seal \
  --claims '{"canonical":true,"status":"release"}' \
  --issuer "https://example.com" \
  --subject "https://example.com/doc/1" \
  --private-key "${PRIVATE_KEY:-/dev/null}" \
  --output /tmp/bundle_sealed.json

echo "  -> Sealed: /tmp/bundle_sealed.json"
echo ""

# Step 2: Verify the sealed bundle
echo "[2/4] Verifying sealed bundle..."
proofbundle verify \
  --bundle /tmp/bundle_sealed.json \
  --public-key "${PUBLIC_KEY:-/dev/null}" \
  --context '{"domain":"example.com"}'

echo "  -> VERIFICATION: PASSED"
echo ""

# Step 3: Tamper with the bundle
echo "[3/4] Tampering with the bundle..."
jq '.claims.status = "compromised"' /tmp/bundle_sealed.json > /tmp/bundle_tampered.json

echo "  -> Tampered: /tmp/bundle_tampered.json"
echo ""

# Step 4: Verify the tampered bundle (should fail)
echo "[4/4] Verifying tampered bundle (expecting failure)..."
if ! proofbundle verify \
  --bundle /tmp/bundle_tampered.json \
  --public-key "${PUBLIC_KEY:-/dev/null}" \
  --context '{"domain":"example.com"}' 2>/tmp/verify_error.txt; then
  echo "  -> VERIFICATION: FAILED (as expected)"
  echo ""
  echo "Quickstart check passed. Tamper detection works."
else
  echo "  -> ERROR: Tampered bundle verified! This is a bug." >&2
  exit 1
fi
