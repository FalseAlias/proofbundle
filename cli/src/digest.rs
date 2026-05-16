//! Digest algorithm dispatch for ProofBundle.
//!
//! Supported algorithms: SHA-256, SHA-384, SHA-512, BLAKE3, BLAKE2b-512

use sha2::{Digest as Sha2Digest, Sha256, Sha384, Sha512};

/// Supported digest algorithm identifiers.
pub const DIGEST_ALGORITHMS: &[&str] = &["sha256", "sha384", "sha512", "blake3", "blake2b512"];

#[derive(Debug, Clone, PartialEq, thiserror::Error)]
pub enum DigestError {
    #[error("Unknown digest algorithm: {0}")]
    UnknownAlgorithm(String),
}

/// Compute a digest over the given bytes using the specified algorithm.
pub fn digest_bytes(alg: &str, data: &[u8]) -> Result<Vec<u8>, DigestError> {
    match alg {
        "sha256" => Ok(Sha256::digest(data).to_vec()),
        "sha384" => Ok(Sha384::digest(data).to_vec()),
        "sha512" => Ok(Sha512::digest(data).to_vec()),
        "blake3" => Ok(blake3::hash(data).as_bytes().to_vec()),
        "blake2b512" => {
            let mut hasher = blake2::Blake2b512::new();
            hasher.update(data);
            Ok(hasher.finalize().to_vec())
        }
        other => Err(DigestError::UnknownAlgorithm(other.to_string())),
    }
}

/// Compute a hex-encoded digest string.
pub fn digest_hex(alg: &str, data: &[u8]) -> Result<String, DigestError> {
    let bytes = digest_bytes(alg, data)?;
    Ok(hex::encode(bytes))
}

/// Validate that a digest algorithm identifier is supported.
pub fn validate_digest_alg(alg: &str) -> Result<(), DigestError> {
    if DIGEST_ALGORITHMS.contains(&alg) {
        Ok(())
    } else {
        Err(DigestError::UnknownAlgorithm(alg.to_string()))
    }
}
