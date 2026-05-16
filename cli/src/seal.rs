//! Bundle sealing for ProofBundle.
//!
//! Creates sealed bundle JSON from payload, boundary, and signing key.

use crate::canonical;
use crate::signature;
use serde_json::{Map, Value};

#[derive(Debug, Clone, PartialEq, thiserror::Error)]
pub enum SealError {
    #[error("Canonical encoding failed: {0}")]
    CanonicalError(String),
    #[error("Signing failed: {0}")]
    SigningFailed(String),
    #[error("Invalid parameter: {0}")]
    InvalidParameter(String),
    #[error("JSON error: {0}")]
    JsonError(String),
}

/// Configuration for sealing a bundle.
pub struct SealConfig<'a> {
    pub payload: &'a [u8],
    pub boundary: Option<&'a Value>,
    pub private_key_pem: &'a str,
    pub digest_alg: &'a str,
    pub sig_alg: &'a str,
    pub profile: &'a str,
    pub context_commit: Option<&'a [u8]>,
    pub parents: &'a [&'a str],
    pub side_attestations: &'a [Value],
    pub expiration: Option<&'a str>,
}

/// Seal a bundle and return the bundle JSON value.
pub fn seal_bundle(config: SealConfig) -> Result<Value, SealError> {
    // Parse payload as JSON value, or wrap as string
    let payload_value: Value = serde_json::from_slice(config.payload)
        .map_err(|e| SealError::JsonError(format!("payload: {e}")))?;

    // Encode payload canonically and compute digest
    let canonical_payload = canonical::encode_canonical(&payload_value)
        .map_err(|e| SealError::CanonicalError(e.to_string()))?;
    let payload_digest = crate::digest::digest_hex(config.digest_alg, &canonical_payload)
        .map_err(|e| SealError::InvalidParameter(format!("digest: {e}")))?;

    // Build the bundle structure
    let mut bundle = Map::new();

    // Required fields
    bundle.insert("version".to_string(), Value::String("1.0.0".to_string()));
    bundle.insert("profile".to_string(), Value::String(config.profile.to_string()));
    bundle.insert("digest_algorithm".to_string(), Value::String(config.digest_alg.to_string()));
    bundle.insert(
        "signature_algorithm".to_string(),
        Value::String(config.sig_alg.to_string()),
    );

    // Payload section
    let mut payload_section = Map::new();
    payload_section.insert(
        "canonical_json".to_string(),
        Value::String(String::from_utf8_lossy(&canonical_payload).to_string()),
    );
    payload_section.insert("digest".to_string(), Value::String(payload_digest));
    payload_section.insert(
        "algorithm".to_string(),
        Value::String(config.digest_alg.to_string()),
    );
    bundle.insert("payload".to_string(), Value::Object(payload_section));

    // Boundary section (optional)
    if let Some(boundary) = config.boundary {
        let canonical_boundary = canonical::encode_canonical(boundary)
            .map_err(|e| SealError::CanonicalError(e.to_string()))?;
        let boundary_digest = crate::digest::digest_hex(config.digest_alg, &canonical_boundary)
            .map_err(|e| SealError::InvalidParameter(format!("boundary digest: {e}")))?;
        let mut boundary_section = Map::new();
        boundary_section.insert("spec".to_string(), boundary.clone());
        boundary_section.insert("digest".to_string(), Value::String(boundary_digest));
        bundle.insert("boundary".to_string(), Value::Object(boundary_section));
    }

    // Context commitment (optional)
    if let Some(commit) = config.context_commit {
        let commit_hex = hex::encode(commit);
        bundle.insert(
            "context_commitment".to_string(),
            Value::String(commit_hex),
        );
    }

    // Parents (optional)
    if !config.parents.is_empty() {
        let parents: Vec<Value> = config.parents.iter().map(|p| Value::String(p.to_string())).collect();
        bundle.insert("parents".to_string(), Value::Array(parents));
    }

    // Side attestations (optional)
    if !config.side_attestations.is_empty() {
        let attestations: Vec<Value> = config.side_attestations.to_vec();
        bundle.insert(
            "side_attestations".to_string(),
            Value::Array(attestations),
        );
    }

    // Expiration (optional)
    if let Some(exp) = config.expiration {
        bundle.insert(
            "expiration".to_string(),
            Value::String(exp.to_string()),
        );
    }

    // Canonicalize and sign
    let mut bundle_value = Value::Object(bundle);
    let canonical_bundle = canonical::encode_canonical(&bundle_value)
        .map_err(|e| SealError::CanonicalError(e.to_string()))?;

    let signature_bytes = signature::sign(config.sig_alg, config.private_key_pem, &canonical_bundle)
        .map_err(|e| SealError::SigningFailed(e.to_string()))?;
    let signature_hex = hex::encode(signature_bytes);

    // Add signature to bundle
    if let Value::Object(ref mut map) = bundle_value {
        map.insert("signature".to_string(), Value::String(signature_hex));
    }

    Ok(bundle_value)
}

/// Re-canonicalize a bundle value and sign it (for re-signing operations).
pub fn re_sign_bundle(
    bundle: &mut Value,
    private_key_pem: &str,
    sig_alg: &str,
) -> Result<(), SealError> {
    // Remove existing signature if present
    if let Value::Object(ref mut map) = bundle {
        map.remove("signature");
    }

    let canonical_bundle = canonical::encode_canonical(bundle)
        .map_err(|e| SealError::CanonicalError(e.to_string()))?;

    let signature_bytes = signature::sign(sig_alg, private_key_pem, &canonical_bundle)
        .map_err(|e| SealError::SigningFailed(e.to_string()))?;
    let signature_hex = hex::encode(signature_bytes);

    if let Value::Object(ref mut map) = bundle {
        map.insert("signature".to_string(), Value::String(signature_hex));
    }

    Ok(())
}
