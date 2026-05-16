#!/usr/bin/env bash
set -euo pipefail

VECTORS="${1:-conformance/vectors_v1.json}"
IMPL="${2:-rust}"

echo "[proofbundle-gha] Running conformance check"
echo "  vectors: $VECTORS"
echo "  implementation: $IMPL"

# Build the Docker image from the repo root
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
docker build -t proofbundle-cli -f "$SCRIPT_DIR/../docker/Dockerfile" "$SCRIPT_DIR/.."

# Run conformance
docker run --rm \
  -v "$GITHUB_WORKSPACE:/workspace" \
  -w /workspace \
  proofbundle-cli \
  conformance run --vectors "$VECTORS" --implementation "$IMPL"

echo "[proofbundle-gha] Conformance check passed"
