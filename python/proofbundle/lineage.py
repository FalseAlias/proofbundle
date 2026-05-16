"""
Parent ref resolution, sealed_content_digest, verify_lineage
with cycle detection and depth budget.
"""

from __future__ import annotations

from typing import Any, Dict, List, Optional, Set, Callable

from .canonical import canonical_bytes
from .digest import digest


class LineageError(Exception):
    pass


def sealed_content_digest_input(bundle: Dict[str, Any]) -> Dict[str, Any]:
    """Build the input dict for sealed content digest computation."""
    result: Dict[str, Any] = {
        "hdr": bundle.get("hdr", {}),
        "payload": bundle.get("payload"),
    }
    meta = bundle.get("meta")
    if meta is not None:
        result["meta"] = meta
    refs = bundle.get("refs")
    if refs is not None:
        result["refs"] = refs
    return result


def sealed_content_digest(bundle: Dict[str, Any], alg: str) -> bytes:
    """Compute the sealed content digest of a bundle."""
    input_data = sealed_content_digest_input(bundle)
    data = canonical_bytes(input_data)
    return digest(alg, data)


def verify_lineage(
    bundle: Dict[str, Any],
    parent_resolver: Callable[[str, str], Optional[Dict[str, Any]]],
    max_depth: int = 256,
    visited: Optional[Set[str]] = None,
) -> Dict[str, Any]:
    """Verify the lineage chain of a bundle.
    
    Returns a dict with:
        - valid: bool
        - reason: str (optional)
        - depth: int
    """
    refs = bundle.get("refs", [])
    if not refs:
        return {"valid": True, "depth": 0}

    if visited is None:
        visited = set()

    if len(visited) >= max_depth:
        return {"valid": False, "reason": "max depth exceeded", "depth": len(visited)}

    bundle_id = bundle.get("hdr", {}).get("bundle_id", "")
    if bundle_id:
        if bundle_id in visited:
            return {"valid": False, "reason": "cycle detected", "depth": len(visited)}
        visited.add(bundle_id)

    for ref in refs:
        parent_id = ref.get("parent_id", "")
        parent_digest_b64u = ref.get("parent_digest", "")
        digest_alg = ref.get("digest_alg", "SHA-256")

        parent = parent_resolver(parent_id, parent_digest_b64u)
        if parent is None:
            return {"valid": False, "reason": f"parent not found: {parent_id}", "depth": len(visited)}

        # Verify parent digest
        computed = sealed_content_digest(parent, digest_alg)
        import base64
        computed_b64u = base64.urlsafe_b64encode(computed).rstrip(b"=").decode("ascii")
        if computed_b64u != parent_digest_b64u:
            return {"valid": False, "reason": f"parent digest mismatch: {parent_id}", "depth": len(visited)}

        # Recursively verify parent's lineage
        sub = verify_lineage(parent, parent_resolver, max_depth, set(visited))
        if not sub["valid"]:
            return {"valid": False, "reason": sub.get("reason"), "depth": sub.get("depth", len(visited))}

    return {"valid": True, "depth": len(visited)}
