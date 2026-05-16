"""
Seal bundle: compute canonical bytes, digest, set bundle_id,
re-canonicalize, re-digest, and produce a seal with signature.
"""

from __future__ import annotations

from typing import Any, Dict, Optional

from .canonical import canonical_bytes
from .digest import digest
from .signature import KeyPair, encode_base64, export_key_pair


class SealError(Exception):
    pass


def _b64u(data: bytes) -> str:
    """Base64url encode without padding."""
    import base64
    return base64.urlsafe_b64encode(data).rstrip(b"=").decode("ascii")


def seal_bundle(
    bundle: Dict[str, Any],
    key_pair: KeyPair,
    digest_alg: str = "SHA-256",
    sig_alg: str = "Ed25519",
    bundle_id: Optional[str] = None,
) -> Dict[str, Any]:
    """Seal a bundle: compute digest and signature."""
    hdr = dict(bundle.get("hdr", {}))
    if bundle_id:
        hdr["bundle_id"] = bundle_id

    pre: Dict[str, Any] = {"hdr": hdr, "payload": bundle.get("payload")}
    meta = bundle.get("meta")
    if meta is not None:
        pre["meta"] = meta
    refs = bundle.get("refs")
    if refs is not None:
        pre["refs"] = refs

    canon1 = canonical_bytes(pre)
    digest1 = digest(digest_alg, canon1)

    if not bundle_id:
        hdr["bundle_id"] = _b64u(digest1)[:32]

    pre2: Dict[str, Any] = {"hdr": hdr, "payload": bundle.get("payload")}
    if meta is not None:
        pre2["meta"] = meta
    if refs is not None:
        pre2["refs"] = refs

    canon2 = canonical_bytes(pre2)
    digest2 = digest(digest_alg, canon2)

    from .signature import sign
    signature = sign(sig_alg, key_pair.private_key, digest2)

    # Export public key
    exported = export_key_pair(key_pair)
    pub_pem = exported["publicKey"]
    # Convert PEM to raw bytes for b64u encoding
    import base64
    pub_der = base64.b64decode(pub_pem.replace("-----BEGIN PUBLIC KEY-----", "")
                                .replace("-----END PUBLIC KEY-----", "")
                                .replace("\n", ""))

    seal = {
        "digest_alg": digest_alg,
        "digest_b64u": _b64u(digest2),
        "sig_alg": sig_alg,
        "signature_b64u": _b64u(signature),
    }

    result = dict(bundle)
    result["hdr"] = hdr
    result["seal"] = seal
    return result
