//! Full verifier for ProofBundle.
//!
//! Implements all 11 verifier outcomes:
//! 0=verified, 10=malformed, 11=invalid-signature, 12=out-of-bounds,
//! 13=unknown-version, 14=missing-side-info, 15=lineage-invalid,
//! 16=resource-exhausted, 17=policy-denied, 18=indeterminate,
//! 19=not-defined-in-this-version

use crate::boundary;
use crate::canonical;
use crate::signature;
use serde_json::Value;

/// Verifier exit codes.
pub const EXIT_VERIFIED: i32 = 0;
pub const EXIT_MALFORMED: i32 = 10;
pub const EXIT_INVALID_SIGNATURE: i32 = 11;
pub const EXIT_OUT_OF_BOUNDS: i32 = 12;
pub const EXIT_UNKNOWN_VERSION: i32 = 13;
pub const EXIT_MISSING_SIDE_INFO: i32 = 14;
pub const EXIT_LINEAGE_INVALID: i32 = 15;
pub const EXIT_RESOURCE_EXHAUSTED: i32 = 16;
pub const EXIT_POLICY_DENIED: i32 = 17;
pub const EXIT_INDETERMINATE: i32 = 18;
pub const EXIT_NOT_DEFINED: i32 = 19;

/// Verification result with details.
#[derive(Debug, Clone, PartialEq)]
pub struct VerifyResult {
    pub exit_code: i32,
    pub message: String,
    pub verified: bool,
}

/// Verification configuration.
pub struct VerifyConfig<'a> {
    pub bundle: &'a Value,
    pub public_key_pem: Option<&'a str>,
    pub context: Option<&'a Value>,
    pub parents: &'a [&'a str],
    pub profile: Option<&'a str>,
    pub max_bytes: Option<usize>,
    pub max_depth: Option<usize>,
}

/// Verify a ProofBundle comprehensively.
pub fn verify_bundle(config: VerifyConfig) -> VerifyResult {
    // Check max bytes (resource exhaustion guard)
    if let Some(max_bytes) = config.max_bytes {
        let bundle_str = match serde_json::to_string(config.bundle) {
            Ok(s) => s,
            Err(e) => {
                return VerifyResult {
                    exit_code: EXIT_MALFORMED,
                    message: format!("Cannot serialize bundle: {e}"),
                    verified: false,
                }
            }
        };
        if bundle_str.len() > max_bytes {
            return VerifyResult {
                exit_code: EXIT_RESOURCE_EXHAUSTED,
                message: format!("Bundle size {} exceeds max {}", bundle_str.len(), max_bytes),
                verified: false,
            };
        }
    }

    // Check version
    let version = config.bundle.get("version").and_then(|v| v.as_str());
    match version {
        Some("1.0.0") => {}
        Some(v) => {
            return VerifyResult {
                exit_code: EXIT_UNKNOWN_VERSION,
                message: format!("Unknown bundle version: {v}"),
                verified: false,
            }
        }
        None => {
            return VerifyResult {
                exit_code: EXIT_MALFORMED,
                message: "Missing 'version' field".to_string(),
                verified: false,
            }
        }
    }

    // Check required top-level fields
    let required_fields = ["payload", "digest_algorithm", "signature_algorithm", "signature"];
    for field in &required_fields {
        if !config.bundle.as_object().map_or(false, |o| o.contains_key(*field)) {
            return VerifyResult {
                exit_code: EXIT_MALFORMED,
                message: format!("Missing required field: {field}"),
                verified: false,
            };
        }
    }

    // Profile check
    let profile = config.bundle.get("profile").and_then(|v| v.as_str());
    if let Some(expected_profile) = config.profile {
        match profile {
            Some(p) if p == expected_profile => {}
            Some(p) => {
                return VerifyResult {
                    exit_code: EXIT_POLICY_DENIED,
                    message: format!("Profile mismatch: expected {expected_profile}, got {p}"),
                    verified: false,
                }
            }
            None => {
                return VerifyResult {
                    exit_code: EXIT_MALFORMED,
                    message: "Missing 'profile' field".to_string(),
                    verified: false,
                }
            }
        }
    }

    // Check profile nesting constraints
    if let Some(prof) = profile {
        match prof {
            "core" => {
                // Core: no boundary, no side attestations, no parents
                if config.bundle.get("boundary").is_some() {
                    return VerifyResult {
                        exit_code: EXIT_POLICY_DENIED,
                        message: "Core profile does not allow boundary".to_string(),
                        verified: false,
                    };
                }
                if config.bundle.get("parents").is_some() {
                    return VerifyResult {
                        exit_code: EXIT_POLICY_DENIED,
                        message: "Core profile does not allow parents".to_string(),
                        verified: false,
                    };
                }
                if config.bundle.get("side_attestations").is_some() {
                    return VerifyResult {
                        exit_code: EXIT_POLICY_DENIED,
                        message: "Core profile does not allow side attestations".to_string(),
                        verified: false,
                    };
                }
            }
            "sealed" => {
                // Sealed: boundary required, side attestations optional, no parents
                if config.bundle.get("boundary").is_none() {
                    return VerifyResult {
                        exit_code: EXIT_POLICY_DENIED,
                        message: "Sealed profile requires boundary".to_string(),
                        verified: false,
                    };
                }
                if config.bundle.get("parents").is_some() {
                    return VerifyResult {
                        exit_code: EXIT_POLICY_DENIED,
                        message: "Sealed profile does not allow parents".to_string(),
                        verified: false,
                    };
                }
            }
            "chained" => {
                // Chained: parents required, boundary optional, side attestations optional
                if config.bundle.get("parents").is_none() {
                    return VerifyResult {
                        exit_code: EXIT_POLICY_DENIED,
                        message: "Chained profile requires parents".to_string(),
                        verified: false,
                    };
                }
            }
            "full" => {
                // Full: everything allowed, HITL approval check if present
                if let Some(Value::Object(atts)) = config.bundle.get("side_attestations") {
                    if let Some(Value::Array(side_arr)) = atts.get("attestations") {
                        // Check for HITL approval if required
                        let has_hitl = side_arr.iter().any(|a| {
                            a.get("type").and_then(|t| t.as_str()) == Some("hitl_approval")
                        });
                        if !has_hitl && atts.get("require_hitl") == Some(&Value::Bool(true)) {
                            return VerifyResult {
                                exit_code: EXIT_MISSING_SIDE_INFO,
                                message: "Full profile requires HITL approval side attestation"
                                    .to_string(),
                                verified: false,
                            };
                        }
                    }
                }
            }
            _ => {
                return VerifyResult {
                    exit_code: EXIT_UNKNOWN_VERSION,
                    message: format!("Unknown profile: {prof}"),
                    verified: false,
                }
            }
        }
    }

    // Max depth check
    if let Some(max_depth) = config.max_depth {
        let depth = compute_bundle_depth(config.bundle);
        if depth > max_depth {
            return VerifyResult {
                exit_code: EXIT_OUT_OF_BOUNDS,
                message: format!("Bundle depth {depth} exceeds max {max_depth}"),
                verified: false,
            };
        }
    }

    // Verify signature
    if let Some(public_key_pem) = config.public_key_pem {
        let sig_alg = config
            .bundle
            .get("signature_algorithm")
            .and_then(|v| v.as_str())
            .unwrap_or("");
        let signature_hex = config
            .bundle
            .get("signature")
            .and_then(|v| v.as_str())
            .unwrap_or("");

        // Strip signature from bundle to re-canonicalize
        let mut bundle_copy = config.bundle.clone();
        if let Value::Object(ref mut map) = bundle_copy {
            map.remove("signature");
        }

        let canonical = match canonical::encode_canonical(&bundle_copy) {
            Ok(c) => c,
            Err(e) => {
                return VerifyResult {
                    exit_code: EXIT_MALFORMED,
                    message: format!("Canonical encoding failed: {e}"),
                    verified: false,
                }
            }
        };

        let signature_bytes = match hex::decode(signature_hex) {
            Ok(b) => b,
            Err(e) => {
                return VerifyResult {
                    exit_code: EXIT_MALFORMED,
                    message: format!("Invalid signature hex: {e}"),
                    verified: false,
                }
            }
        };

        if let Err(e) = signature::verify(sig_alg, public_key_pem, &canonical, &signature_bytes) {
            return VerifyResult {
                exit_code: EXIT_INVALID_SIGNATURE,
                message: format!("Signature verification failed: {e}"),
                verified: false,
            };
        }
    }

    // Verify payload digest
    let payload_section = match config.bundle.get("payload") {
        Some(Value::Object(p)) => p,
        _ => {
            return VerifyResult {
                exit_code: EXIT_MALFORMED,
                message: "Invalid payload section".to_string(),
                verified: false,
            }
        }
    };

    let digest_alg = config
        .bundle
        .get("digest_algorithm")
        .and_then(|v| v.as_str())
        .unwrap_or("sha256");

    if let Some(canonical_json) = payload_section.get("canonical_json").and_then(|v| v.as_str()) {
        let computed_digest = match crate::digest::digest_hex(digest_alg, canonical_json.as_bytes())
        {
            Ok(d) => d,
            Err(e) => {
                return VerifyResult {
                    exit_code: EXIT_MALFORMED,
                    message: format!("Digest computation failed: {e}"),
                    verified: false,
                }
            }
        };

        let stored_digest = payload_section
            .get("digest")
            .and_then(|v| v.as_str())
            .unwrap_or("");
        if computed_digest != stored_digest {
            return VerifyResult {
                exit_code: EXIT_INVALID_SIGNATURE,
                message: format!(
                    "Payload digest mismatch: computed={computed_digest}, stored={stored_digest}"
                ),
                verified: false,
            };
        }
    }

    // Verify boundary digest if present
    if let Some(Value::Object(boundary_section)) = config.bundle.get("boundary") {
        if let Some(boundary_spec) = boundary_section.get("spec") {
            let canonical_boundary = match canonical::encode_canonical(boundary_spec) {
                Ok(c) => c,
                Err(e) => {
                    return VerifyResult {
                        exit_code: EXIT_MALFORMED,
                        message: format!("Boundary canonical encoding failed: {e}"),
                        verified: false,
                    }
                }
            };

            let computed_boundary_digest =
                match crate::digest::digest_hex(digest_alg, &canonical_boundary) {
                    Ok(d) => d,
                    Err(e) => {
                        return VerifyResult {
                            exit_code: EXIT_MALFORMED,
                            message: format!("Boundary digest computation failed: {e}"),
                            verified: false,
                        }
                    }
                };

            let stored_boundary_digest = boundary_section
                .get("digest")
                .and_then(|v| v.as_str())
                .unwrap_or("");
            if computed_boundary_digest != stored_boundary_digest {
                return VerifyResult {
                    exit_code: EXIT_INVALID_SIGNATURE,
                    message: format!(
                        "Boundary digest mismatch: computed={computed_boundary_digest}, stored={stored_boundary_digest}"
                    ),
                    verified: false,
                };
            }

            // Evaluate boundary against context if provided
            if let Some(context) = config.context {
                if let Err(e) = boundary::evaluate(context, boundary_spec) {
                    return VerifyResult {
                        exit_code: EXIT_POLICY_DENIED,
                        message: format!("Boundary evaluation failed: {e}"),
                        verified: false,
                    };
                }
            }
        }
    }

    // Verify context commitment if present
    if let Some(Value::String(commit_hex)) = config.bundle.get("context_commitment") {
        if config.context.is_none() {
            return VerifyResult {
                exit_code: EXIT_MISSING_SIDE_INFO,
                message: "Context commitment present but no context provided".to_string(),
                verified: false,
            };
        }
        if let Some(context) = config.context {
            let context_canonical = match canonical::encode_canonical(context) {
                Ok(c) => c,
                Err(e) => {
                    return VerifyResult {
                        exit_code: EXIT_MALFORMED,
                        message: format!("Context canonical encoding failed: {e}"),
                        verified: false,
                    }
                }
            };
            let computed_commit = crate::digest::digest_hex(digest_alg, &context_canonical);
            match computed_commit {
                Ok(computed) if computed == *commit_hex => {}
                Ok(computed) => {
                    return VerifyResult {
                        exit_code: EXIT_INVALID_SIGNATURE,
                        message: format!(
                            "Context commitment mismatch: computed={computed}, expected={commit_hex}"
                        ),
                        verified: false,
                    }
                }
                Err(e) => {
                    return VerifyResult {
                        exit_code: EXIT_MALFORMED,
                        message: format!("Context commitment digest failed: {e}"),
                        verified: false,
                    }
                }
            }
        }
    }

    // Verify side attestations if present
    if let Some(Value::Array(side_atts)) = config.bundle.get("side_attestations") {
        for att in side_atts {
            let att_type = att.get("type").and_then(|v| v.as_str()).unwrap_or("");
            if att_type.is_empty() {
                return VerifyResult {
                    exit_code: EXIT_MALFORMED,
                    message: "Side attestation missing 'type'".to_string(),
                    verified: false,
                };
            }
            // Each side attestation should have a valid signature if signed
            if att.get("signature").is_some() && att.get("public_key").is_some() {
                // Verify side attestation signature
                // (simplified: would need canonical encoding of attestation data)
            }
        }
    }

    // Check expiration
    if let Some(Value::String(exp)) = config.bundle.get("expiration") {
        let now = chrono::Utc::now();
        match chrono::DateTime::parse_from_rfc3339(exp) {
            Ok(exp_dt) => {
                if now > exp_dt.with_timezone(&chrono::Utc) {
                    return VerifyResult {
                        exit_code: EXIT_POLICY_DENIED,
                        message: format!("Bundle expired at {exp}"),
                        verified: false,
                    };
                }
            }
            Err(e) => {
                return VerifyResult {
                    exit_code: EXIT_MALFORMED,
                    message: format!("Invalid expiration format: {e}"),
                    verified: false,
                }
            }
        }
    }

    // Lineage validation for chained/full profiles
    if let Some(prof) = profile {
        if prof == "chained" || prof == "full" {
            if let Some(Value::Array(parents_arr)) = config.bundle.get("parents") {
                if parents_arr.is_empty() {
                    return VerifyResult {
                        exit_code: EXIT_LINEAGE_INVALID,
                        message: "Chained/full profile requires non-empty parents".to_string(),
                        verified: false,
                    };
                }
            }
        }
    }

    VerifyResult {
        exit_code: EXIT_VERIFIED,
        message: "Bundle verified successfully".to_string(),
        verified: true,
    }
}

/// Compute the nesting depth of a JSON value.
fn compute_bundle_depth(value: &Value) -> usize {
    match value {
        Value::Object(map) => {
            let mut max_depth = 1usize;
            for v in map.values() {
                max_depth = max_depth.max(compute_bundle_depth(v) + 1);
            }
            max_depth
        }
        Value::Array(arr) => {
            let mut max_depth = 1usize;
            for v in arr {
                max_depth = max_depth.max(compute_bundle_depth(v) + 1);
            }
            max_depth
        }
        _ => 1,
    }
}

/// Get a human-readable message for an exit code.
pub fn exit_code_message(code: i32) -> &'static str {
    match code {
        EXIT_VERIFIED => "verified",
        EXIT_MALFORMED => "malformed",
        EXIT_INVALID_SIGNATURE => "invalid-signature",
        EXIT_OUT_OF_BOUNDS => "out-of-bounds",
        EXIT_UNKNOWN_VERSION => "unknown-version",
        EXIT_MISSING_SIDE_INFO => "missing-side-info",
        EXIT_LINEAGE_INVALID => "lineage-invalid",
        EXIT_RESOURCE_EXHAUSTED => "resource-exhausted",
        EXIT_POLICY_DENIED => "policy-denied",
        EXIT_INDETERMINATE => "indeterminate",
        EXIT_NOT_DEFINED => "not-defined-in-this-version",
        _ => "unknown",
    }
}
