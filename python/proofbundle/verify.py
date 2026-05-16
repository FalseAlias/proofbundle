"""
verify_bundle — 11-stage verification pipeline.
Returns { outcome, trace } for every bundle.
"""

from __future__ import annotations

import json
from typing import Any, Dict, List, Optional, Callable

from .canonical import canonical_bytes, CanonError
from .digest import digest, SUPPORTED_DIGESTS
from .signature import (
    import_public_key,
    verify_sig,
    decode_base64url,
    SUPPORTED_SIGNATURES,
)
from .boundary import evaluate_boundary, evaluate_atom, BoundaryError
from .lineage import verify_lineage, sealed_content_digest


# Outcomes
VERIFIED = "verified"
MALFORMED = "malformed"
UNKNOWN_VERSION = "unknown-version"
NOT_DEFINED = "not-defined-in-this-version"
RESOURCE_EXHAUSTED = "resource-exhausted"
INVALID_SIGNATURE = "invalid-signature"
OUT_OF_BOUNDS = "out-of-bounds"
MISSING_SIDE_INFO = "missing-side-info"
INDETERMINATE = "indeterminate"
LINEAGE_INVALID = "lineage-invalid"
POLICY_DENIED = "policy-denied"

ALL_OUTCOMES = [
    VERIFIED,
    MALFORMED,
    UNKNOWN_VERSION,
    NOT_DEFINED,
    RESOURCE_EXHAUSTED,
    INVALID_SIGNATURE,
    OUT_OF_BOUNDS,
    MISSING_SIDE_INFO,
    INDETERMINATE,
    LINEAGE_INVALID,
    POLICY_DENIED,
]

SUPPORTED_PROFILES = [
    "PB-INTEGRITY-1",
    "PB-BOUNDARY-1",
    "PB-LINEAGE-1",
    "PB-REGULATED-1",
]

SUPPORTED_PROOF_KINDS = [
    "signature",
    "signature+lineage",
    "signature+lineage+hitl",
]

BOUNDARY_ATOMS = {
    "equals", "in", "present", "range", "before", "after", "within",
    "expired", "not_expired", "age_lt", "age_gt", "within_last",
    "within_next", "all", "any", "not",
}


def _trace_step(stage: str, passed: bool, detail: str = "") -> Dict[str, Any]:
    return {"stage": stage, "passed": passed, "detail": detail}


def _timing_safe_equal(a: bytes, b: bytes) -> bool:
    if len(a) != len(b):
        return False
    diff = 0
    for x, y in zip(a, b):
        diff |= x ^ y
    return diff == 0


def _validate_atoms(boundary: Any) -> bool:
    """Check that all atom keys in the boundary are known types.
    
    Only validates key names, not operand structure — malformed
    operands are handled by the boundary evaluation stage which
    returns 'indeterminate'.
    """
    if not isinstance(boundary, dict):
        return False
    for op in boundary.keys():
        if op not in BOUNDARY_ATOMS:
            return False
        if op in ("all", "any", "not"):
            operand = boundary[op]
            # Accept any operand type here; boundary eval handles it
            if isinstance(operand, list):
                for sub in operand:
                    if not _validate_atoms(sub):
                        return False
    return True


def verify_bundle(
    bundle: Any,
    public_key_b64u: str,
    context: Dict[str, Any],
    profile: str,
    parent_bundles: Optional[List[Dict[str, Any]]] = None,
    max_bundle_bytes: int = 1024 * 1024,
    max_lineage_depth: int = 256,
) -> Dict[str, Any]:
    """Verify a ProofBundle.
    
    Returns: { outcome: str, trace: List[Dict] }
    """
    trace: List[Dict[str, Any]] = []
    parent_bundles = parent_bundles or []

    # Stage 1: Parse
    if not isinstance(bundle, dict):
        trace.append(_trace_step("parse", False, "bundle is not an object"))
        return {"outcome": MALFORMED, "trace": trace}
    
    hdr = bundle.get("hdr")
    payload = bundle.get("payload")
    meta = bundle.get("meta")
    seal = bundle.get("seal")
    refs = bundle.get("refs")

    trace.append(_trace_step("parse", True))

    # Stage 2: Schema
    schema_errors = []
    if not isinstance(hdr, dict):
        schema_errors.append("hdr must be object")
    else:
        if not isinstance(hdr.get("spec_id"), str):
            schema_errors.append("hdr.spec_id must be string")
        elif hdr.get("spec_id") != "PROOFBUNDLE":
            schema_errors.append("hdr.spec_id must be PROOFBUNDLE")
        if not isinstance(hdr.get("spec_ver"), str):
            schema_errors.append("hdr.spec_ver must be string")
        if not isinstance(hdr.get("profile"), str):
            schema_errors.append("hdr.profile must be string")
        if not isinstance(hdr.get("bundle_id"), str):
            schema_errors.append("hdr.bundle_id must be string")

    if not isinstance(payload, str):
        schema_errors.append("payload must be string")
    elif payload == "":
        schema_errors.append("payload must not be empty")

    if not isinstance(meta, dict):
        schema_errors.append("meta must be object")
    else:
        for field in ("producer_id", "created_at", "canonical_encoding",
                      "digest_alg", "sig_alg", "proof_kind"):
            if not isinstance(meta.get(field), str):
                schema_errors.append(f"meta.{field} must be string")

    if not isinstance(seal, dict):
        schema_errors.append("seal must be object")
    else:
        for field in ("digest_alg", "digest_b64u", "sig_alg", "signature_b64u"):
            if not isinstance(seal.get(field), str):
                schema_errors.append(f"seal.{field} must be string")
        # Validate base64url fields are decodable
        for field in ("digest_b64u", "signature_b64u"):
            val = seal.get(field)
            if isinstance(val, str) and val:
                try:
                    decode_base64url(val)
                except Exception:
                    schema_errors.append(f"seal.{field} is not valid base64url")
        # Validate seal algorithm consistency with meta
        if isinstance(meta, dict):
            if seal.get("sig_alg") != meta.get("sig_alg"):
                schema_errors.append("seal.sig_alg must match meta.sig_alg")
            if seal.get("digest_alg") != meta.get("digest_alg"):
                schema_errors.append("seal.digest_alg must match meta.digest_alg")

    if refs is None:
        schema_errors.append("refs must be present")
    elif not isinstance(refs, list):
        schema_errors.append("refs must be array")

    if schema_errors:
        trace.append(_trace_step("schema", False, "; ".join(schema_errors)))
        return {"outcome": MALFORMED, "trace": trace}

    trace.append(_trace_step("schema", True))

    # Stage 3: Resource budget
    bundle_json = json.dumps(bundle)
    if len(bundle_json.encode("utf-8")) > max_bundle_bytes:
        trace.append(_trace_step("resource-budget", False,
                                 f"bundle size {len(bundle_json)} exceeds {max_bundle_bytes}"))
        return {"outcome": RESOURCE_EXHAUSTED, "trace": trace}

    trace.append(_trace_step("resource-budget", True))

    # Stage 4: Version
    spec_ver = hdr.get("spec_ver", "")
    bundle_profile = hdr.get("profile", "")

    if spec_ver != "1.0.0":
        trace.append(_trace_step("version", False, f"unsupported spec_ver: {spec_ver}"))
        return {"outcome": UNKNOWN_VERSION, "trace": trace}

    if bundle_profile not in SUPPORTED_PROFILES:
        trace.append(_trace_step("version", False, f"unknown profile: {bundle_profile}"))
        return {"outcome": NOT_DEFINED, "trace": trace}

    if profile != bundle_profile:
        trace.append(_trace_step("version", False,
                                 f"profile mismatch: expected {profile}, got {bundle_profile}"))
        return {"outcome": NOT_DEFINED, "trace": trace}

    trace.append(_trace_step("version", True))

    # Stage 5: Algorithms
    digest_alg = meta.get("digest_alg", "")
    sig_alg = meta.get("sig_alg", "")
    proof_kind = meta.get("proof_kind", "")
    canonical_encoding = meta.get("canonical_encoding", "")

    if digest_alg not in SUPPORTED_DIGESTS:
        trace.append(_trace_step("algorithms", False, f"unknown digest: {digest_alg}"))
        return {"outcome": NOT_DEFINED, "trace": trace}

    if sig_alg not in SUPPORTED_SIGNATURES:
        trace.append(_trace_step("algorithms", False, f"unknown sig_alg: {sig_alg}"))
        return {"outcome": NOT_DEFINED, "trace": trace}

    if proof_kind not in SUPPORTED_PROOF_KINDS:
        trace.append(_trace_step("algorithms", False, f"unknown proof_kind: {proof_kind}"))
        return {"outcome": NOT_DEFINED, "trace": trace}

    if canonical_encoding != "PB-CANON-JSON-1":
        trace.append(_trace_step("algorithms", False,
                                 f"unsupported canonical_encoding: {canonical_encoding}"))
        return {"outcome": NOT_DEFINED, "trace": trace}

    # Validate boundary atoms are known
    boundary = meta.get("boundary")
    if boundary is not None:
        if not _validate_atoms(boundary):
            trace.append(_trace_step("algorithms", False, "unknown boundary atom"))
            return {"outcome": NOT_DEFINED, "trace": trace}

    trace.append(_trace_step("algorithms", True))

    # Stage 6: Canonical + Integrity + Signature
    try:
        # Build canonical input (bundle without seal)
        verify_input = {
            "hdr": hdr,
            "payload": payload,
            "meta": meta,
        }
        if refs is not None:
            verify_input["refs"] = refs

        canon = canonical_bytes(verify_input)
        computed_digest = digest(digest_alg, canon)

        # Compare with seal digest
        expected_digest = decode_base64url(seal["digest_b64u"])
        if not _timing_safe_equal(computed_digest, expected_digest):
            trace.append(_trace_step("canonical-integrity", False, "digest mismatch"))
            return {"outcome": INVALID_SIGNATURE, "trace": trace}

        # Verify signature
        signature = decode_base64url(seal["signature_b64u"])
        try:
            pub_key = import_public_key(sig_alg, public_key_b64u)
        except Exception as e:
            trace.append(_trace_step("signature", False, f"public key import failed: {e}"))
            return {"outcome": INVALID_SIGNATURE, "trace": trace}

        sig_valid = verify_sig(sig_alg, pub_key, computed_digest, signature)
        if not sig_valid:
            trace.append(_trace_step("signature", False, "signature verification failed"))
            return {"outcome": INVALID_SIGNATURE, "trace": trace}

    except CanonError as e:
        trace.append(_trace_step("canonical-integrity", False, f"canonicalization failed: {e}"))
        return {"outcome": MALFORMED, "trace": trace}
    except Exception as e:
        trace.append(_trace_step("canonical-integrity", False, f"integrity error: {e}"))
        return {"outcome": INVALID_SIGNATURE, "trace": trace}

    trace.append(_trace_step("canonical-integrity", True))
    trace.append(_trace_step("signature", True))

    # Stage 7: Boundary
    if boundary is not None:
        boundary_result = evaluate_boundary(boundary, context)
        if boundary_result == "fail":
            trace.append(_trace_step("boundary", False, "boundary denied"))
            return {"outcome": OUT_OF_BOUNDS, "trace": trace}
        elif boundary_result == "indeterminate":
            trace.append(_trace_step("boundary", False, "boundary indeterminate"))
            return {"outcome": INDETERMINATE, "trace": trace}
        elif boundary_result == "pass":
            trace.append(_trace_step("boundary", True))
        else:
            # No boundary or null
            trace.append(_trace_step("boundary", True, "no boundary"))
    else:
        trace.append(_trace_step("boundary", True, "no boundary"))

    # Stage 8: Side info
    requires_side = meta.get("requires_side_attestations", False)
    side_attestations = meta.get("side_attestations")
    
    if requires_side:
        if not side_attestations or len(side_attestations) == 0:
            trace.append(_trace_step("side-info", False, "required side attestations missing"))
            return {"outcome": MISSING_SIDE_INFO, "trace": trace}
        # Validate side attestation structure
        for i, att in enumerate(side_attestations):
            if not isinstance(att, dict):
                trace.append(_trace_step("side-info", False, f"side attestation {i} is not an object"))
                return {"outcome": INDETERMINATE, "trace": trace}
            # Check required fields
            if not att.get("attester_id") or not att.get("claim_type"):
                trace.append(_trace_step("side-info", False, f"side attestation {i} missing fields"))
                return {"outcome": INDETERMINATE, "trace": trace}
    
    trace.append(_trace_step("side-info", True))

    # Stage 9: HITL
    hitl = meta.get("hitl")
    if hitl is not None:
        if not isinstance(hitl, dict):
            trace.append(_trace_step("hitl", False, "hitl is not an object"))
            return {"outcome": INDETERMINATE, "trace": trace}
        # Check if HITL approval is present and valid
        approver_id = hitl.get("approver_id")
        approved_at = hitl.get("approved_at")
        approval_kind = hitl.get("approval_kind")
        
        if not approver_id or not isinstance(approver_id, str) or not approver_id.strip():
            trace.append(_trace_step("hitl", False, "missing approver_id"))
            return {"outcome": INDETERMINATE, "trace": trace}
        if not approved_at or not isinstance(approved_at, str):
            trace.append(_trace_step("hitl", False, "missing approved_at"))
            return {"outcome": INDETERMINATE, "trace": trace}
        if approval_kind not in ("review", "test", "audit", "custom"):
            trace.append(_trace_step("hitl", False, f"invalid approval_kind: {approval_kind}"))
            return {"outcome": INDETERMINATE, "trace": trace}

    trace.append(_trace_step("hitl", True))

    # Stage 10: Profile-specific requirements (PB-REGULATED-1)
    if profile == "PB-REGULATED-1":
        # PB-REGULATED-1 requires lineage (refs)
        if not refs or len(refs) == 0:
            trace.append(_trace_step("profile-requirements", False,
                                     "PB-REGULATED-1 requires lineage"))
            return {"outcome": POLICY_DENIED, "trace": trace}

    trace.append(_trace_step("profile-requirements", True))

    # Stage 11: Lineage
    if refs and len(refs) > 0:
        # If no parent bundles provided, side information is missing
        if len(parent_bundles) == 0:
            trace.append(_trace_step("lineage", False, "parent bundles not provided"))
            return {"outcome": MISSING_SIDE_INFO, "trace": trace}

        # Build parent resolver from parent_bundles
        parent_map = {}
        for pb in parent_bundles:
            pb_id = pb.get("hdr", {}).get("bundle_id", "")
            pb_digest = sealed_content_digest(pb, digest_alg)
            import base64
            pb_digest_b64u = base64.urlsafe_b64encode(pb_digest).rstrip(b"=").decode("ascii")
            parent_map[(pb_id, pb_digest_b64u)] = pb

        def resolve_parent(parent_id: str, parent_digest: str) -> Optional[Dict[str, Any]]:
            return parent_map.get((parent_id, parent_digest))

        lineage_result = verify_lineage(
            bundle, resolve_parent, max_depth=max_lineage_depth
        )

        if not lineage_result["valid"]:
            trace.append(_trace_step("lineage", False, lineage_result.get("reason", "")))
            return {"outcome": LINEAGE_INVALID, "trace": trace}

    trace.append(_trace_step("lineage", True))

    # All stages passed
    trace.append(_trace_step("verified", True))
    return {"outcome": VERIFIED, "trace": trace}
