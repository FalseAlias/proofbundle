"""
ProofBundle v1.0.0 — Reference implementation.
"""

from .canonical import canonical_json, canonical_bytes, CanonError
from .digest import digest, digest_sync, SUPPORTED_DIGESTS
from .signature import (
    generate_key_pair,
    export_key_pair,
    import_public_key,
    import_private_key,
    import_key_pair,
    sign,
    verify_sig,
    encode_base64,
    decode_base64,
    encode_base64url,
    decode_base64url,
    KeyPair,
    SUPPORTED_SIGNATURES,
)
from .boundary import evaluate_atom, evaluate_boundary, BoundaryError
from .lineage import sealed_content_digest, verify_lineage
from .verify import verify_bundle
from .seal import seal_bundle

VERSION = "1.0.0"
SUPPORTED_PROFILES = [
    "PB-INTEGRITY-1",
    "PB-BOUNDARY-1",
    "PB-LINEAGE-1",
    "PB-REGULATED-1",
]

__all__ = [
    # Version
    "VERSION",
    # Constants
    "SUPPORTED_PROFILES",
    "SUPPORTED_DIGESTS",
    "SUPPORTED_SIGNATURES",
    # Canonical
    "canonical_json",
    "canonical_bytes",
    "CanonError",
    # Digest
    "digest",
    "digest_sync",
    # Signature
    "generate_key_pair",
    "export_key_pair",
    "import_public_key",
    "import_private_key",
    "import_key_pair",
    "sign",
    "verify_sig",
    "encode_base64",
    "decode_base64",
    "encode_base64url",
    "decode_base64url",
    "KeyPair",
    # Boundary
    "evaluate_atom",
    "evaluate_boundary",
    "BoundaryError",
    # Lineage
    "sealed_content_digest",
    "verify_lineage",
    # Verify
    "verify_bundle",
    # Seal
    "seal_bundle",
]
