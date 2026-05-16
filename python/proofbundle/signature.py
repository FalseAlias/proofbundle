"""
Key generation, export, import, sign, and verify for ProofBundle.
Ed25519, ECDSA-P256/384/521, RSA-PSS-2048/3072/4096 via the cryptography library.
"""

from __future__ import annotations

import base64
from typing import Dict

from cryptography.hazmat.primitives import hashes, serialization
from cryptography.hazmat.primitives.asymmetric import (
    ec,
    ed25519,
    rsa,
    padding,
    utils,
)
from cryptography.exceptions import InvalidSignature

SignatureAlgorithm = str

SUPPORTED_SIGNATURES = [
    "Ed25519",
    "ECDSA-P256",
    "ECDSA-P384",
    "ECDSA-P521",
    "RSA-PSS-2048",
    "RSA-PSS-3072",
    "RSA-PSS-4096",
]


class SignatureError(Exception):
    pass


class KeyPair:
    def __init__(self, public_key, private_key, algorithm: str) -> None:
        self.public_key = public_key
        self.private_key = private_key
        self.algorithm = algorithm


def _b64_decode(data: str) -> bytes:
    """Decode base64url (with or without padding)."""
    padding_needed = -len(data) % 4
    padded = data + "=" * padding_needed
    return base64.urlsafe_b64decode(padded)


def _raw_ecdsa_sig_to_der(raw_sig: bytes, curve) -> bytes:
    """Convert raw r||s ECDSA signature to DER format."""
    key_size = (curve.key_size + 7) // 8
    if len(raw_sig) != 2 * key_size:
        return raw_sig  # Already DER or wrong format
    r = int.from_bytes(raw_sig[:key_size], "big")
    s = int.from_bytes(raw_sig[key_size:], "big")
    return utils.encode_dss_signature(r, s)


def _der_ecdsa_sig_to_raw(der_sig: bytes, curve) -> bytes:
    """Convert DER ECDSA signature to raw r||s format."""
    try:
        r, s = utils.decode_dss_signature(der_sig)
    except Exception:
        return der_sig  # Already raw or wrong format
    key_size = (curve.key_size + 7) // 8
    return r.to_bytes(key_size, "big") + s.to_bytes(key_size, "big")


def _ecdsa_curve(alg: str):
    if alg == "ECDSA-P256":
        return ec.SECP256R1()
    if alg == "ECDSA-P384":
        return ec.SECP384R1()
    if alg == "ECDSA-P521":
        return ec.SECP521R1()
    raise SignatureError(f"not an ECDSA algorithm: {alg}")


def generate_key_pair(alg: str) -> KeyPair:
    """Generate a new key pair for the given algorithm."""
    if alg == "Ed25519":
        priv = ed25519.Ed25519PrivateKey.generate()
        return KeyPair(priv.public_key(), priv, alg)

    if alg.startswith("ECDSA-"):
        curve = _ecdsa_curve(alg)
        priv = ec.generate_private_key(curve)
        return KeyPair(priv.public_key(), priv, alg)

    if alg.startswith("RSA-PSS-"):
        bits_map = {"RSA-PSS-2048": 2048, "RSA-PSS-3072": 3072, "RSA-PSS-4096": 4096}
        bits = bits_map[alg]
        priv = rsa.generate_private_key(public_exponent=65537, key_size=bits)
        return KeyPair(priv.public_key(), priv, alg)

    raise SignatureError(f"unsupported algorithm: {alg}")


def export_key_pair(pair: KeyPair) -> Dict[str, str]:
    """Export a key pair to PEM strings."""
    pub_pem = pair.public_key.public_bytes(
        encoding=serialization.Encoding.PEM,
        format=serialization.PublicFormat.SubjectPublicKeyInfo,
    )
    priv_pem = pair.private_key.private_bytes(
        encoding=serialization.Encoding.PEM,
        format=serialization.PrivateFormat.PKCS8,
        encryption_algorithm=serialization.NoEncryption(),
    )
    return {
        "publicKey": pub_pem.decode("ascii"),
        "privateKey": priv_pem.decode("ascii"),
        "algorithm": pair.algorithm,
    }


def import_public_key(alg: str, key_data: str):
    """Import a public key from base64/base64url/PEM.
    
    Handles both raw public key bytes (for Ed25519/ECDSA) and
    DER/PEM format (for RSA).
    """
    if "-----BEGIN" in key_data:
        return serialization.load_pem_public_key(key_data.encode("ascii"))

    raw = _b64_decode(key_data)

    if alg == "Ed25519":
        if len(raw) == 32:
            return ed25519.Ed25519PublicKey.from_public_bytes(raw)
        return serialization.load_der_public_key(raw)

    if alg.startswith("ECDSA-"):
        curve = _ecdsa_curve(alg)
        expected_len = (curve.key_size + 7) // 8
        # Uncompressed point: 1 + 2*field_size bytes starting with 0x04
        if len(raw) == 1 + 2 * expected_len and raw[0] == 0x04:
            return ec.EllipticCurvePublicKey.from_encoded_point(curve, raw)
        return serialization.load_der_public_key(raw)

    if alg.startswith("RSA-PSS-"):
        return serialization.load_der_public_key(raw)

    raise SignatureError(f"unsupported algorithm: {alg}")


def import_private_key(alg: str, key_data: str):
    """Import a private key from PEM or base64."""
    if "-----BEGIN" in key_data:
        return serialization.load_pem_private_key(key_data.encode("ascii"), password=None)
    raw = _b64_decode(key_data)
    return serialization.load_der_private_key(raw, password=None)


def import_key_pair(serialized: Dict[str, str]) -> KeyPair:
    """Import a key pair from a serialized dict."""
    alg = serialized["algorithm"]
    pub = import_public_key(alg, serialized["publicKey"])
    priv = import_private_key(alg, serialized["privateKey"])
    return KeyPair(pub, priv, alg)


def sign(alg: str, private_key, data: bytes) -> bytes:
    """Sign data with the given algorithm and private key.
    
    Returns raw signatures for ECDSA (r||s), DER for RSA, standard for Ed25519.
    """
    if alg == "Ed25519":
        return private_key.sign(data)

    if alg.startswith("ECDSA-"):
        hash_map = {
            "ECDSA-P256": hashes.SHA256(),
            "ECDSA-P384": hashes.SHA384(),
            "ECDSA-P521": hashes.SHA512(),
        }
        curve = _ecdsa_curve(alg)
        der_sig = private_key.sign(data, ec.ECDSA(hash_map[alg]))
        return _der_ecdsa_sig_to_raw(der_sig, curve)

    if alg.startswith("RSA-PSS-"):
        hash_map = {
            "RSA-PSS-2048": hashes.SHA256(),
            "RSA-PSS-3072": hashes.SHA384(),
            "RSA-PSS-4096": hashes.SHA512(),
        }
        salt_map = {"RSA-PSS-2048": 32, "RSA-PSS-3072": 48, "RSA-PSS-4096": 64}
        h = hash_map[alg]
        salt = salt_map[alg]
        mgf = padding.MGF1(h)
        pss_padding = padding.PSS(mgf=mgf, salt_length=salt)
        return private_key.sign(data, pss_padding, h)

    raise SignatureError(f"unsupported algorithm: {alg}")


def verify_sig(alg: str, public_key, data: bytes, signature: bytes) -> bool:
    """Verify a signature. Returns True if valid, False otherwise.
    
    Accepts raw ECDSA signatures (r||s), DER RSA signatures, standard Ed25519.
    """
    try:
        if alg == "Ed25519":
            public_key.verify(signature, data)
            return True

        if alg.startswith("ECDSA-"):
            hash_map = {
                "ECDSA-P256": hashes.SHA256(),
                "ECDSA-P384": hashes.SHA384(),
                "ECDSA-P521": hashes.SHA512(),
            }
            curve = _ecdsa_curve(alg)
            der_sig = _raw_ecdsa_sig_to_der(signature, curve)
            public_key.verify(der_sig, data, ec.ECDSA(hash_map[alg]))
            return True

        if alg.startswith("RSA-PSS-"):
            hash_map = {
                "RSA-PSS-2048": hashes.SHA256(),
                "RSA-PSS-3072": hashes.SHA384(),
                "RSA-PSS-4096": hashes.SHA512(),
            }
            salt_map = {"RSA-PSS-2048": 32, "RSA-PSS-3072": 48, "RSA-PSS-4096": 64}
            h = hash_map[alg]
            salt = salt_map[alg]
            mgf = padding.MGF1(h)
            pss_padding = padding.PSS(mgf=mgf, salt_length=salt)
            public_key.verify(signature, data, pss_padding, h)
            return True

        raise SignatureError(f"unsupported algorithm: {alg}")
    except InvalidSignature:
        return False
    except Exception:
        return False


def encode_base64(data: bytes) -> str:
    return base64.b64encode(data).decode("ascii")


def decode_base64(s: str) -> bytes:
    return base64.b64decode(s)


def encode_base64url(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).rstrip(b"=").decode("ascii")


def decode_base64url(s: str) -> bytes:
    padding_needed = -len(s) % 4
    return base64.urlsafe_b64decode(s + "=" * padding_needed)
