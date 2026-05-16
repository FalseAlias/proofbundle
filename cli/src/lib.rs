//! ProofBundle CLI library - cryptographic bundle sealing and verification.
//!
//! ProofBundle v1.0.0 provides a deterministic, canonical JSON-based format
//! for cryptographically sealed payloads with boundary conditions, lineage
//! tracking, and side attestations.

pub mod boundary;
pub mod canonical;
pub mod digest;
pub mod lineage;
pub mod seal;
pub mod signature;
pub mod verify;

// Re-export core types
pub use canonical::{encode_canonical, encode_canonical_string, CanonicalError};
pub use digest::{digest_bytes, digest_hex, validate_digest_alg, DigestError};
pub use lineage::{resolve_lineage, LineageChain, LineageError};
pub use seal::{seal_bundle, SealConfig, SealError};
pub use signature::{sign, verify, SigError};
pub use verify::{exit_code_message, verify_bundle, VerifyConfig, VerifyResult};

/// Version of the ProofBundle specification supported.
pub const SPEC_VERSION: &str = "1.0.0";

/// All supported profiles.
pub const PROFILES: &[&str] = &["core", "sealed", "chained", "full"];

/// Check if a profile is valid.
pub fn is_valid_profile(profile: &str) -> bool {
    PROFILES.contains(&profile)
}

/// Validate that a value is a safe integer for canonical JSON.
pub fn is_safe_integer(n: i64) -> bool {
    const MAX_SAFE: i64 = 9007199254740991; // 2^53 - 1
    const MIN_SAFE: i64 = -9007199254740991;
    n >= MIN_SAFE && n <= MAX_SAFE
}

/// Read bytes from a file or stdin (if path is "-" or None).
pub fn read_input(path: Option<&str>) -> Result<Vec<u8>, std::io::Error> {
    match path {
        None | Some("-") => {
            let mut buf = Vec::new();
            std::io::Read::read_to_end(&mut std::io::stdin(), &mut buf)?;
            Ok(buf)
        }
        Some(path) => std::fs::read(path),
    }
}

/// Write bytes to a file or stdout (if path is "-" or None).
pub fn write_output(path: Option<&str>, data: &[u8]) -> Result<(), std::io::Error> {
    match path {
        None | Some("-") => {
            std::io::Write::write_all(&mut std::io::stdout(), data)?;
            Ok(())
        }
        Some(path) => std::fs::write(path, data),
    }
}
