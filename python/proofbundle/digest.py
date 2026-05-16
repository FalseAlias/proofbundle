"""
Digest dispatch for ProofBundle.
SHA-256, SHA-384, SHA-512 via hashlib.
BLAKE3 via blake3 package.
BLAKE2b via hashlib.blake2b.
"""

from __future__ import annotations

import hashlib
from typing import Dict, Callable

DigestAlgorithm = str  # 'SHA-256' | 'SHA-384' | 'SHA-512' | 'BLAKE3' | 'BLAKE2b'

SUPPORTED_DIGESTS = [
    "SHA-256",
    "SHA-384",
    "SHA-512",
    "BLAKE3",
    "BLAKE2b",
]


class DigestError(Exception):
    pass


def _digest_sha256(data: bytes) -> bytes:
    return hashlib.sha256(data).digest()


def _digest_sha384(data: bytes) -> bytes:
    return hashlib.sha384(data).digest()


def _digest_sha512(data: bytes) -> bytes:
    return hashlib.sha512(data).digest()


def _digest_blake3(data: bytes) -> bytes:
    import blake3 as blake3_mod

    return blake3_mod.blake3(data).digest()


def _digest_blake2b(data: bytes) -> bytes:
    # BLAKE2b with 64-byte output (512 bits)
    return hashlib.blake2b(data, digest_size=64).digest()


_DIGEST_FUNCS: Dict[str, Callable[[bytes], bytes]] = {
    "SHA-256": _digest_sha256,
    "SHA-384": _digest_sha384,
    "SHA-512": _digest_sha512,
    "BLAKE3": _digest_blake3,
    "BLAKE2b": _digest_blake2b,
}


def digest(alg: str, data: bytes) -> bytes:
    """Compute digest of data using the named algorithm."""
    func = _DIGEST_FUNCS.get(alg)
    if func is None:
        raise DigestError(f"unknown digest algorithm: {alg}")
    return func(data)


def digest_sync(alg: str, data: bytes) -> bytes:
    """Synchronous digest (all our digests are synchronous)."""
    return digest(alg, data)
