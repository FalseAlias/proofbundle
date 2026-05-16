#!/usr/bin/env python3
"""
compute_manifest.py -- Compute manifest hashes for the ProofBundle v1.0.0 repository.

Generates manifest.json with SHA-256, SHA-384, and SHA-512 hashes for all tracked
source files, documentation, test vectors, and configuration files. Excludes
generated build artifacts, dependency directories, and the manifest.json itself.

The Merkle root is computed as the cumulative XOR of all SHA-256 hashes,
providing a simple, collision-resistant aggregation suitable for integrity
checking. This is a binary tree built over sorted file hashes; when the
count is odd, the last hash is promoted to the next level.

Usage:
    python compute_manifest.py

Output:
    Writes manifest.json to the repository root.
"""

import hashlib
import json
import os
from datetime import datetime, timezone
from pathlib import Path
from typing import Dict, List, Optional

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------

REPO_ROOT = Path(__file__).resolve().parent

EXCLUDE_DIRS = {
    ".git",
    "node_modules",
    "vendor",
    "dist",
    "target",
    "__pycache__",
    ".pytest_cache",
    "proofbundle.egg-info",
}

EXCLUDE_FILES = {
    "manifest.json",          # We are generating this file; do not self-hash
    "compute_manifest.py",    # This script is a tool, not part of the bundle
}

EXCLUDE_PATTERNS = {
    "Cargo.lock",             # Generated lockfile for Rust
}

# ---------------------------------------------------------------------------
# Hash computation
# ---------------------------------------------------------------------------

def compute_file_hashes(filepath: Path) -> Dict[str, str]:
    """Compute SHA-256, SHA-384, and SHA-512 for a single file."""
    sha256 = hashlib.sha256()
    sha384 = hashlib.sha384()
    sha512 = hashlib.sha512()

    with open(filepath, "rb") as f:
        # Read in 64 KiB chunks for memory efficiency
        while True:
            chunk = f.read(65536)
            if not chunk:
                break
            sha256.update(chunk)
            sha384.update(chunk)
            sha512.update(chunk)

    return {
        "sha256": sha256.hexdigest(),
        "sha384": sha384.hexdigest(),
        "sha512": sha512.hexdigest(),
    }


# ---------------------------------------------------------------------------
# Merkle root computation
# ---------------------------------------------------------------------------

def merkle_root(hash_hexes: List[str]) -> str:
    """
    Compute a binary Merkle root over a sorted list of SHA-256 hashes.

    Each hash is converted to bytes. Pairs are concatenated and re-hashed
    with SHA-256. When the count is odd, the last hash is promoted to the
    next level unchanged. The final single hash is returned as a hex string.

    This provides a collision-resistant aggregation of all file hashes that
    can be verified independently of the full manifest.
    """
    if not hash_hexes:
        return "0" * 64

    # Convert hex strings to bytes; sort for deterministic ordering
    level = sorted([bytes.fromhex(h) for h in hash_hexes])

    while len(level) > 1:
        next_level = []
        i = 0
        while i < len(level):
            if i + 1 < len(level):
                combined = level[i] + level[i + 1]
                next_level.append(hashlib.sha256(combined).digest())
                i += 2
            else:
                # Odd node out: promote to next level
                next_level.append(level[i])
                i += 1
        level = next_level

    return level[0].hex()


# ---------------------------------------------------------------------------
# File walking
# ---------------------------------------------------------------------------

def should_include(relative_path: str) -> bool:
    """Determine whether a file should be included in the manifest."""
    parts = relative_path.split(os.sep)

    # Exclude by directory component
    for part in parts:
        if part in EXCLUDE_DIRS:
            return False

    # Exclude by filename (exact match on relative path for root manifest)
    filename = parts[-1]
    if filename in EXCLUDE_FILES:
        # Only exclude manifest.json at the root level;
        # proofs/manifest.json is a tracked artifact and must be hashed
        if filename == "manifest.json" and len(parts) == 1:
            return False
        if filename != "manifest.json":
            return False

    # Exclude by exact pattern match
    if filename in EXCLUDE_PATTERNS:
        return False

    # Exclude the egg-info directory entirely
    if "proofbundle.egg-info" in parts:
        return False

    return True


def collect_files(root: Path) -> List[Path]:
    """Walk the repository and collect all files that should be hashed."""
    files: List[Path] = []

    for dirpath, dirnames, filenames in os.walk(root):
        # Prune excluded directories in-place
        dirnames[:] = [
            d for d in dirnames
            if d not in EXCLUDE_DIRS and d != "proofbundle.egg-info"
        ]

        for filename in filenames:
            filepath = Path(dirpath) / filename
            relative = filepath.relative_to(root).as_posix()

            if should_include(relative):
                files.append(filepath)

    # Sort for deterministic ordering
    files.sort(key=lambda p: p.relative_to(root).as_posix())
    return files


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main() -> None:
    print(f"[compute_manifest] Scanning repository: {REPO_ROOT}")
    print(f"[compute_manifest] Excluding directories: {EXCLUDE_DIRS}")
    print(f"[compute_manifest] Excluding files: {EXCLUDE_FILES}")
    print()

    files = collect_files(REPO_ROOT)
    print(f"[compute_manifest] Found {len(files)} files to hash")
    print()

    manifest_files: List[Dict[str, str]] = []
    sha256_list: List[str] = []

    for filepath in files:
        relative = filepath.relative_to(REPO_ROOT).as_posix()
        hashes = compute_file_hashes(filepath)
        sha256_list.append(hashes["sha256"])

        entry = {
            "path": relative,
            **hashes,
        }
        manifest_files.append(entry)

        print(f"  {relative}")
        print(f"    SHA-256: {hashes['sha256']}")
        print(f"    SHA-384: {hashes['sha384']}")
        print(f"    SHA-512: {hashes['sha512']}")

    print()
    print(f"[compute_manifest] Computing Merkle root over {len(sha256_list)} SHA-256 hashes...")
    root = merkle_root(sha256_list)
    print(f"[compute_manifest] Merkle root: {root}")
    print()

    manifest = {
        "manifest_version": "1.0.0",
        "created_at": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "files": manifest_files,
        "merkle_root": root,
        "hash_algorithm": "sha256",
        "total_files": len(manifest_files),
    }

    manifest_path = REPO_ROOT / "manifest.json"
    with open(manifest_path, "w", encoding="utf-8") as f:
        json.dump(manifest, f, indent=2, ensure_ascii=False)
        f.write("\n")

    print(f"[compute_manifest] Wrote manifest to: {manifest_path}")
    print(f"[compute_manifest] Total files hashed: {len(manifest_files)}")


if __name__ == "__main__":
    main()
