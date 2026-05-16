"""
Conformance tests for ProofBundle v1.0.0.
Loads conformance/vectors_v1.json and verifies each vector.
"""

import json
import os
from pathlib import Path

import pytest

from proofbundle import (
    verify_bundle,
    canonical_json,
    canonical_bytes,
    digest,
    generate_key_pair,
    export_key_pair,
    import_public_key,
    sign,
    verify_sig,
    encode_base64,
    decode_base64,
    evaluate_atom,
    evaluate_boundary,
    sealed_content_digest,
    verify_lineage,
    SUPPORTED_DIGESTS,
    SUPPORTED_SIGNATURES,
    SUPPORTED_PROFILES,
    VERSION,
    CanonError,
)


VECTORS_PATH = Path(__file__).parent.parent.parent / "conformance" / "vectors_v1.json"


def load_vectors():
    if not VECTORS_PATH.exists():
        return []
    with open(VECTORS_PATH, "r", encoding="utf-8") as f:
        data = json.load(f)
    if isinstance(data, list):
        return data
    if isinstance(data, dict):
        vectors = data.get("vectors", [])
        if not isinstance(vectors, list):
            raise TypeError("conformance vectors_v1.json field 'vectors' must be a list")
        declared_count = data.get("vector_count")
        if declared_count is not None and declared_count != len(vectors):
            raise ValueError(
                f"vector_count mismatch: declared {declared_count}, found {len(vectors)}"
            )
        return vectors
    raise TypeError("conformance vectors_v1.json must be a list or an object with a vectors list")


VECTORS = load_vectors()


# ---------------------------------------------------------------------------
# Canonical tests
# ---------------------------------------------------------------------------

class TestCanonicalJSON:
    def test_null(self):
        assert canonical_json(None) == "null"

    def test_booleans(self):
        assert canonical_json(True) == "true"
        assert canonical_json(False) == "false"

    def test_safe_integers(self):
        assert canonical_json(0) == "0"
        assert canonical_json(-1) == "-1"
        assert canonical_json(9007199254740991) == "9007199254740991"

    def test_rejects_non_safe_integers(self):
        with pytest.raises(CanonError):
            canonical_json(9007199254740992)
        with pytest.raises(CanonError):
            canonical_json(1.5)

    def test_strings_with_escaping(self):
        assert canonical_json("hello") == '"hello"'
        assert canonical_json('a"b') == '"a\\"b"'
        assert canonical_json("a\\b") == '"a\\\\b"'

    def test_arrays(self):
        assert canonical_json([1, 2, 3]) == "[1,2,3]"
        assert canonical_json([]) == "[]"

    def test_objects_sorted_keys(self):
        assert canonical_json({"b": 1, "a": 2}) == '{"a":2,"b":1}'

    def test_nested_structures(self):
        inp = {"z": [None, True, {"c": 3, "a": 1}]}
        assert canonical_json(inp) == '{"z":[null,true,{"a":1,"c":3}]}'

    def test_nfc_normalizes_strings(self):
        decomposed = "cafe\u0301"
        composed = "caf\u00e9"
        assert canonical_json(decomposed) == canonical_json(composed)

    def test_rejects_unsupported_types(self):
        with pytest.raises(CanonError):
            canonical_json(object())

    def test_byte_identical_output(self):
        a = {"b": 1, "a": [{"x": 2, "y": 3}]}
        b = {"a": [{"y": 3, "x": 2}], "b": 1}
        assert canonical_json(a) == canonical_json(b)


# ---------------------------------------------------------------------------
# Digest tests
# ---------------------------------------------------------------------------

class TestDigest:
    TEST_DATA = b"proofbundle"

    def test_sha256_produces_32_bytes(self):
        d = digest("SHA-256", self.TEST_DATA)
        assert len(d) == 32

    def test_sha384_produces_48_bytes(self):
        d = digest("SHA-384", self.TEST_DATA)
        assert len(d) == 48

    def test_sha512_produces_64_bytes(self):
        d = digest("SHA-512", self.TEST_DATA)
        assert len(d) == 64

    def test_blake3_produces_32_bytes(self):
        d = digest("BLAKE3", self.TEST_DATA)
        assert len(d) == 32

    def test_blake2b_produces_64_bytes(self):
        d = digest("BLAKE2b", self.TEST_DATA)
        assert len(d) == 64

    def test_blake3_sync_matches(self):
        from proofbundle.digest import digest_sync
        a = digest_sync("BLAKE3", self.TEST_DATA)
        b = digest_sync("BLAKE3", self.TEST_DATA)
        assert a == b

    def test_rejects_unknown_algorithm(self):
        with pytest.raises(Exception):
            digest("UNKNOWN", self.TEST_DATA)

    @pytest.mark.parametrize("alg", SUPPORTED_DIGESTS)
    def test_all_digest_names_supported(self, alg):
        d = digest(alg, self.TEST_DATA)
        assert len(d) > 0


# ---------------------------------------------------------------------------
# Signature tests
# ---------------------------------------------------------------------------

class TestSignatures:
    @pytest.mark.parametrize("alg", SUPPORTED_SIGNATURES)
    def test_round_trip_sign_and_verify(self, alg):
        keys = generate_key_pair(alg)
        data = b"test message"
        sig = sign(alg, keys.private_key, data)
        assert len(sig) > 0
        ok = verify_sig(alg, keys.public_key, data, sig)
        assert ok is True

    @pytest.mark.parametrize("alg", SUPPORTED_SIGNATURES)
    def test_export_and_reimport_keys(self, alg):
        keys = generate_key_pair(alg)
        exported = export_key_pair(keys)
        assert len(exported["publicKey"]) > 0
        assert len(exported["privateKey"]) > 0
        pub = import_public_key(alg, exported["publicKey"])
        data = b"roundtrip"
        sig = sign(alg, keys.private_key, data)
        ok = verify_sig(alg, pub, data, sig)
        assert ok is True

    @pytest.mark.parametrize("alg", SUPPORTED_SIGNATURES)
    def test_wrong_data_fails_verify(self, alg):
        keys = generate_key_pair(alg)
        data = b"correct"
        wrong = b"wrong"
        sig = sign(alg, keys.private_key, data)
        ok = verify_sig(alg, keys.public_key, wrong, sig)
        assert ok is False


# ---------------------------------------------------------------------------
# Boundary atom tests
# ---------------------------------------------------------------------------

class TestEvaluateAtom:
    CTX = {"_now": "2024-01-15T12:00:00Z", "env": "demo", "status": "active",
           "count": 42, "age": 5, "ts": "2024-01-10T08:00:00Z",
           "expires_at": "2024-12-31T23:59:59Z"}

    def test_equals_match(self):
        assert evaluate_atom({"equals": ["env", "demo"]}, self.CTX) is True

    def test_equals_no_match(self):
        assert evaluate_atom({"equals": ["env", "prod"]}, self.CTX) is False

    def test_present_field_exists(self):
        assert evaluate_atom({"present": "env"}, self.CTX) is True

    def test_present_field_missing(self):
        assert evaluate_atom({"present": "nonexistent"}, self.CTX) is False

    def test_range_within(self):
        assert evaluate_atom({"range": ["count", 0, 100]}, self.CTX) is True

    def test_before_date(self):
        assert evaluate_atom({"before": ["ts", "2024-02-01T00:00:00Z"]}, self.CTX) is True

    def test_after_date(self):
        assert evaluate_atom({"after": ["ts", "2024-01-01T00:00:00Z"]}, self.CTX) is True

    def test_not_expired(self):
        assert evaluate_atom({"not_expired": "expires_at"}, self.CTX) is True

    def test_expired(self):
        ctx = {"_now": "2025-01-15T12:00:00Z", "expires_at": "2024-12-31T23:59:59Z"}
        assert evaluate_atom({"expired": "expires_at"}, ctx) is True

    def test_age_lt(self):
        assert evaluate_atom({"age_lt": ["ts", "30d"]}, self.CTX) is True

    def test_within_last(self):
        assert evaluate_atom({"within_last": ["ts", "30d"]}, self.CTX) is True

    def test_all_passes(self):
        atom = {"all": [
            {"equals": ["env", "demo"]},
            {"range": ["count", 0, 100]},
        ]}
        assert evaluate_atom(atom, self.CTX) is True

    def test_any_passes(self):
        atom = {"any": [
            {"equals": ["env", "inactive"]},
            {"range": ["count", 0, 100]},
        ]}
        assert evaluate_atom(atom, self.CTX) is True

    def test_not_negation(self):
        atom = {"not": [{"equals": ["env", "inactive"]}]}
        assert evaluate_atom(atom, self.CTX) is True


# ---------------------------------------------------------------------------
# Boundary policy tests
# ---------------------------------------------------------------------------

class TestEvaluateBoundary:
    CTX = {"_now": "2024-01-15T12:00:00Z"}

    def test_returns_pass_for_matching_rule(self):
        boundary = {"all": [{"equals": ["status", "active"]}]}
        ctx = {"status": "active"}
        assert evaluate_boundary(boundary, ctx) == "pass"

    def test_returns_fail_for_non_matching(self):
        boundary = {"all": [{"equals": ["status", "active"]}]}
        ctx = {"status": "inactive"}
        assert evaluate_boundary(boundary, ctx) == "fail"

    def test_no_boundary_returns_none(self):
        assert evaluate_boundary(None, {}) is None


# ---------------------------------------------------------------------------
# Lineage tests
# ---------------------------------------------------------------------------

class TestLineage:
    def test_sealed_content_digest_is_deterministic(self):
        bundle = {
            "hdr": {"spec_id": "PROOFBUNDLE", "spec_ver": "1.0.0",
                    "profile": "PB-INTEGRITY-1", "bundle_id": "test"},
            "payload": "dGVzdA",
        }
        d1 = sealed_content_digest(bundle, "SHA-256")
        d2 = sealed_content_digest(bundle, "SHA-256")
        assert d1 == d2

    def test_verify_lineage_no_refs(self):
        bundle = {
            "hdr": {"spec_id": "PROOFBUNDLE", "spec_ver": "1.0.0",
                    "profile": "PB-INTEGRITY-1", "bundle_id": "test"},
            "payload": "dGVzdA",
        }
        result = verify_lineage(bundle, lambda _id, _digest: None)
        assert result["valid"] is True
        assert result["depth"] == 0

    def test_verify_lineage_missing_parent(self):
        bundle = {
            "hdr": {"spec_id": "PROOFBUNDLE", "spec_ver": "1.0.0",
                    "profile": "PB-LINEAGE-1", "bundle_id": "child"},
            "payload": "Y2hpbGQ",
            "refs": [{
                "parent_id": "parent",
                "parent_digest": "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",
                "digest_alg": "SHA-256",
                "edge_kind": "hash-conditioned-successor",
            }],
        }
        result = verify_lineage(bundle, lambda _id, _digest: None)
        assert result["valid"] is False
        assert "parent not found" in result.get("reason", "")


# ---------------------------------------------------------------------------
# Conformance vectors
# ---------------------------------------------------------------------------

@pytest.mark.skipif(not VECTORS, reason="No conformance vectors found")
class TestConformanceVectors:
    @pytest.mark.parametrize("vector", VECTORS, ids=lambda v: v["id"])
    def test_vector(self, vector):
        inp = vector.get("input", vector)
        bundle = inp.get("bundle", vector.get("bundle"))
        public_key_b64u = inp.get("public_key_b64u", vector.get("public_key_b64u"))
        context = inp.get("context", vector.get("context", {}))
        profile = inp.get("profile", vector.get("profile"))
        parent_bundles = inp.get("parent_bundles", vector.get("parent_bundles", []))
        max_bundle_bytes = inp.get("max_bundle_bytes", vector.get("max_bundle_bytes", 1024 * 1024))
        expected = vector.get("expected_outcome", vector.get("expected", {}).get("outcome"))
        result = verify_bundle(
            bundle=bundle,
            public_key_b64u=public_key_b64u,
            context=context,
            profile=profile,
            parent_bundles=parent_bundles,
            max_bundle_bytes=max_bundle_bytes,
            max_lineage_depth=256,
        )
        assert result["outcome"] == expected, \
            f"trace: {json.dumps(result['trace'], indent=2)}"


# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------

class TestConstants:
    def test_version(self):
        assert VERSION == "1.0.0"

    def test_all_4_profiles(self):
        assert len(SUPPORTED_PROFILES) == 4
        assert "PB-INTEGRITY-1" in SUPPORTED_PROFILES
        assert "PB-BOUNDARY-1" in SUPPORTED_PROFILES
        assert "PB-LINEAGE-1" in SUPPORTED_PROFILES
        assert "PB-REGULATED-1" in SUPPORTED_PROFILES

    def test_5_digests(self):
        assert len(SUPPORTED_DIGESTS) == 5

    def test_7_signatures(self):
        assert len(SUPPORTED_SIGNATURES) == 7
