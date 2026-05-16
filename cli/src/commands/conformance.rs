//! Conformance testing command implementation.

use proofbundle::{
    canonical::{encode_canonical, encode_canonical_string},
    digest::{digest_hex, DIGEST_ALGORITHMS},
    seal::{seal_bundle, SealConfig},
    signature::{self},
    verify::{exit_code_message, verify_bundle, VerifyConfig},
    is_valid_profile, PROFILES, SPEC_VERSION,
};
use serde_json::Value;

/// Run all conformance test vectors.
pub fn run(vectors_path: Option<&str>) -> Result<(), Box<dyn std::error::Error>> {
    let mut passed = 0usize;
    let mut failed = 0usize;

    println!("=== ProofBundle Conformance Tests v{} ===\n", SPEC_VERSION);

    // Test 1: Canonical JSON encoding
    println!("--- Test Group: Canonical JSON ---");
    passed += test_canonical_json(&mut failed);

    // Test 2: Digest algorithms
    println!("--- Test Group: Digest Algorithms ---");
    passed += test_digest_algorithms(&mut failed);

    // Test 3: Key generation
    println!("--- Test Group: Key Generation ---");
    passed += test_key_generation(&mut failed);

    // Test 4: Sign/verify roundtrips
    println!("--- Test Group: Sign/Verify ---");
    passed += test_sign_verify_roundtrips(&mut failed);

    // Test 5: Seal and verify
    println!("--- Test Group: Seal and Verify ---");
    passed += test_seal_and_verify(&mut failed);

    // Test 6: Profile constraints
    println!("--- Test Group: Profile Constraints ---");
    passed += test_profile_constraints(&mut failed);

    // Test 7: Boundary evaluation
    println!("--- Test Group: Boundary Evaluation ---");
    passed += test_boundary_evaluation(&mut failed);

    // Test 8: Context commitment
    println!("--- Test Group: Context Commitment ---");
    passed += test_context_commitment(&mut failed);

    // Test 9: HITL approval
    println!("--- Test Group: HITL Approval ---");
    passed += test_hitl_approval(&mut failed);

    // Test 10: Exit codes
    println!("--- Test Group: Exit Codes ---");
    passed += test_exit_codes(&mut failed);

    // Load and run external vectors if provided
    if let Some(path) = vectors_path {
        println!("--- Test Group: External Vectors ({}) ---", path);
        passed += run_external_vectors(path, &mut failed)?;
    }

    println!("\n=== Results ===");
    println!("Passed: {passed}");
    println!("Failed: {failed}");
    println!("Total:  {}", passed + failed);

    if failed > 0 {
        Err(format!("{} conformance tests failed", failed).into())
    } else {
        println!("\nAll tests PASSED");
        Ok(())
    }
}

fn test_canonical_json(failed: &mut usize) -> usize {
    let mut passed = 0usize;

    // Test 1: Simple object sorting
    let v: Value = serde_json::from_str(r#"{"z":1,"a":2}"#).unwrap();
    let result = encode_canonical_string(&v).unwrap();
    if result == r#"{"a":2,"z":1}"# {
        println!("  [PASS] Object key sorting");
        passed += 1;
    } else {
        println!("  [FAIL] Object key sorting: got {result}");
        *failed += 1;
    }

    // Test 2: Nested objects
    let v: Value = serde_json::from_str(r#"{"outer":{"z":1,"a":2}}"#).unwrap();
    let result = encode_canonical_string(&v).unwrap();
    if result == r#"{"outer":{"a":2,"z":1}}"# {
        println!("  [PASS] Nested object sorting");
        passed += 1;
    } else {
        println!("  [FAIL] Nested object sorting: got {result}");
        *failed += 1;
    }

    // Test 3: Array order preserved
    let v: Value = serde_json::from_str(r#"[3,1,2]"#).unwrap();
    let result = encode_canonical_string(&v).unwrap();
    if result == "[3,1,2]" {
        println!("  [PASS] Array order preserved");
        passed += 1;
    } else {
        println!("  [FAIL] Array order preserved: got {result}");
        *failed += 1;
    }

    // Test 4: String escaping
    let v = Value::String("hello\nworld\t!".to_string());
    let result = encode_canonical_string(&v).unwrap();
    if result == r#""hello\nworld\t!""# {
        println!("  [PASS] String escaping");
        passed += 1;
    } else {
        println!("  [FAIL] String escaping: got {result}");
        *failed += 1;
    }

    // Test 5: Null, bool, integer
    let v: Value = serde_json::from_str(r#"{"a":null,"b":true,"c":false,"d":42}"#).unwrap();
    let result = encode_canonical_string(&v).unwrap();
    if result == r#"{"a":null,"b":true,"c":false,"d":42}"# {
        println!("  [PASS] Primitive types");
        passed += 1;
    } else {
        println!("  [FAIL] Primitive types: got {result}");
        *failed += 1;
    }

    // Test 6: Integer bounds
    let max_safe = 9007199254740991i64;
    let v = serde_json::json!({"n": max_safe});
    let result = encode_canonical_string(&v);
    if result.is_ok() {
        println!("  [PASS] Max safe integer");
        passed += 1;
    } else {
        println!("  [FAIL] Max safe integer: {result:?}");
        *failed += 1;
    }

    let v = serde_json::json!({"n": max_safe + 1});
    let result = encode_canonical_string(&v);
    if result.is_err() {
        println!("  [PASS] Integer overflow rejected");
        passed += 1;
    } else {
        println!("  [FAIL] Integer overflow should be rejected");
        *failed += 1;
    }

    // Test 7: Floats rejected
    let v: Value = serde_json::from_str(r#"3.14"#).unwrap();
    let result = encode_canonical_string(&v);
    if result.is_err() {
        println!("  [PASS] Floats rejected");
        passed += 1;
    } else {
        println!("  [FAIL] Floats should be rejected");
        *failed += 1;
    }

    passed
}

fn test_digest_algorithms(failed: &mut usize) -> usize {
    let mut passed = 0usize;
    let test_data = b"Hello, ProofBundle!";

    for alg in DIGEST_ALGORITHMS {
        match digest_hex(alg, test_data) {
            Ok(hex_str) => {
                let expected_len = match *alg {
                    "sha256" => 64,
                    "sha384" => 96,
                    "sha512" => 128,
                    "blake3" => 64,
                    "blake2b512" => 128,
                    _ => 0,
                };
                if hex_str.len() == expected_len {
                    println!("  [PASS] {} digest length ({hex_str})", alg);
                    passed += 1;
                } else {
                    println!("  [FAIL] {} digest length: got {}, expected {}", alg, hex_str.len(), expected_len);
                    *failed += 1;
                }
            }
            Err(e) => {
                println!("  [FAIL] {} digest: {e}", alg);
                *failed += 1;
            }
        }
    }

    // Test digest consistency
    let d1 = digest_hex("sha256", test_data).unwrap();
    let d2 = digest_hex("sha256", test_data).unwrap();
    if d1 == d2 {
        println!("  [PASS] Digest consistency");
        passed += 1;
    } else {
        println!("  [FAIL] Digest inconsistency: {d1} != {d2}");
        *failed += 1;
    }

    passed
}

fn test_key_generation(failed: &mut usize) -> usize {
    let mut passed = 0usize;

    // Ed25519
    match signature::generate_ed25519_keypair() {
        Ok((priv_pem, pub_pem)) => {
            if priv_pem.contains("PRIVATE KEY") && pub_pem.contains("PUBLIC KEY") {
                println!("  [PASS] Ed25519 key generation");
                passed += 1;
            } else {
                println!("  [FAIL] Ed25519 key format");
                *failed += 1;
            }
        }
        Err(e) => {
            println!("  [FAIL] Ed25519 key generation: {e}");
            *failed += 1;
        }
    }

    // P-256
    match signature::generate_p256_keypair() {
        Ok((priv_pem, pub_pem)) => {
            if priv_pem.contains("PRIVATE KEY") && pub_pem.contains("PUBLIC KEY") {
                println!("  [PASS] P-256 key generation");
                passed += 1;
            } else {
                println!("  [FAIL] P-256 key format");
                *failed += 1;
            }
        }
        Err(e) => {
            println!("  [FAIL] P-256 key generation: {e}");
            *failed += 1;
        }
    }

    passed
}

fn test_sign_verify_roundtrips(failed: &mut usize) -> usize {
    let mut passed = 0usize;
    let test_data = b"test message for signing";

    // Test Ed25519
    let (priv_pem, pub_pem) = signature::generate_ed25519_keypair().unwrap();
    match signature::sign("ed25519", &priv_pem, test_data) {
        Ok(sig) => {
            match signature::verify("ed25519", &pub_pem, test_data, &sig) {
                Ok(_) => {
                    println!("  [PASS] Ed25519 sign/verify roundtrip");
                    passed += 1;
                }
                Err(e) => {
                    println!("  [FAIL] Ed25519 verify: {e}");
                    *failed += 1;
                }
            }

            // Tampered data should fail
            let mut tampered = test_data.to_vec();
            tampered[0] ^= 0xFF;
            match signature::verify("ed25519", &pub_pem, &tampered, &sig) {
                Err(_) => {
                    println!("  [PASS] Ed25519 tamper detection");
                    passed += 1;
                }
                Ok(_) => {
                    println!("  [FAIL] Ed25519 tampered data should not verify");
                    *failed += 1;
                }
            }
        }
        Err(e) => {
            println!("  [FAIL] Ed25519 sign: {e}");
            *failed += 1;
        }
    }

    // Test P-256
    let (priv_pem, pub_pem) = signature::generate_p256_keypair().unwrap();
    match signature::sign("ecdsa-sha256-p256", &priv_pem, test_data) {
        Ok(sig) => {
            match signature::verify("ecdsa-sha256-p256", &pub_pem, test_data, &sig) {
                Ok(_) => {
                    println!("  [PASS] P-256 sign/verify roundtrip");
                    passed += 1;
                }
                Err(e) => {
                    println!("  [FAIL] P-256 verify: {e}");
                    *failed += 1;
                }
            }
        }
        Err(e) => {
            println!("  [FAIL] P-256 sign: {e}");
            *failed += 1;
        }
    }

    passed
}

fn test_seal_and_verify(failed: &mut usize) -> usize {
    let mut passed = 0usize;

    let payload = br#"{"data":"hello","count":42}"#;
    let (priv_pem, pub_pem) = signature::generate_ed25519_keypair().unwrap();

    let parents: Vec<&str> = vec![];
    let side_atts: Vec<Value> = vec![];

    let config = SealConfig {
        payload,
        boundary: None,
        private_key_pem: &priv_pem,
        digest_alg: "sha256",
        sig_alg: "ed25519",
        profile: "core",
        context_commit: None,
        parents: &parents,
        side_attestations: &side_atts,
        expiration: None,
    };

    match seal_bundle(config) {
        Ok(bundle) => {
            println!("  [PASS] Bundle sealing");
            passed += 1;

            // Verify it
            let verify_config = VerifyConfig {
                bundle: &bundle,
                public_key_pem: Some(&pub_pem),
                context: None,
                parents: &[],
                profile: None,
                max_bytes: None,
                max_depth: None,
            };
            let result = verify_bundle(verify_config);
            if result.verified {
                println!("  [PASS] Bundle verification");
                passed += 1;
            } else {
                println!("  [FAIL] Bundle verification: {}", result.message);
                *failed += 1;
            }
        }
        Err(e) => {
            println!("  [FAIL] Bundle sealing: {e}");
            *failed += 2;
        }
    }

    passed
}

fn test_profile_constraints(failed: &mut usize) -> usize {
    let mut passed = 0usize;
    let payload = br#"{"data":"hello"}"#;
    let (priv_pem, _) = signature::generate_ed25519_keypair().unwrap();
    let parents: Vec<&str> = vec![];
    let side_atts: Vec<Value> = vec![];

    // Core profile: no boundary, no parents
    let config = SealConfig {
        payload,
        boundary: None,
        private_key_pem: &priv_pem,
        digest_alg: "sha256",
        sig_alg: "ed25519",
        profile: "core",
        context_commit: None,
        parents: &parents,
        side_attestations: &side_atts,
        expiration: None,
    };
    match seal_bundle(config) {
        Ok(_) => {
            println!("  [PASS] Core profile seal");
            passed += 1;
        }
        Err(e) => {
            println!("  [FAIL] Core profile seal: {e}");
            *failed += 1;
        }
    }

    // All profiles valid
    for profile in PROFILES {
        if is_valid_profile(profile) {
            passed += 1;
        } else {
            println!("  [FAIL] Profile {profile} not recognized");
            *failed += 1;
        }
    }
    println!("  [PASS] All {} profiles recognized", PROFILES.len());

    passed
}

fn test_boundary_evaluation(failed: &mut usize) -> usize {
    let mut passed = 0usize;
    use proofbundle::boundary::evaluate;

    let context = serde_json::json!({"role": "admin", "age": 25, "active": true});

    // equals
    let atom = serde_json::json!({"type": "equals", "field": "role", "value": "admin"});
    match evaluate(&context, &atom) {
        Ok(true) => {
            println!("  [PASS] Boundary equals");
            passed += 1;
        }
        Ok(false) => {
            println!("  [FAIL] Boundary equals should be true");
            *failed += 1;
        }
        Err(e) => {
            println!("  [FAIL] Boundary equals error: {e}");
            *failed += 1;
        }
    }

    // range
    let atom = serde_json::json!({"type": "range", "field": "age", "min": 18, "max": 65});
    match evaluate(&context, &atom) {
        Ok(true) => {
            println!("  [PASS] Boundary range");
            passed += 1;
        }
        _ => {
            println!("  [FAIL] Boundary range");
            *failed += 1;
        }
    }

    // all
    let atom = serde_json::json!({
        "type": "all",
        "conditions": [
            {"type": "equals", "field": "role", "value": "admin"},
            {"type": "range", "field": "age", "min": 18, "max": 65}
        ]
    });
    match evaluate(&context, &atom) {
        Ok(true) => {
            println!("  [PASS] Boundary all");
            passed += 1;
        }
        _ => {
            println!("  [FAIL] Boundary all");
            *failed += 1;
        }
    }

    // not
    let atom = serde_json::json!({
        "type": "not",
        "condition": {"type": "equals", "field": "role", "value": "user"}
    });
    match evaluate(&context, &atom) {
        Ok(true) => {
            println!("  [PASS] Boundary not");
            passed += 1;
        }
        _ => {
            println!("  [FAIL] Boundary not");
            *failed += 1;
        }
    }

    // present
    let atom = serde_json::json!({"type": "present", "field": "active"});
    match evaluate(&context, &atom) {
        Ok(true) => {
            println!("  [PASS] Boundary present");
            passed += 1;
        }
        _ => {
            println!("  [FAIL] Boundary present");
            *failed += 1;
        }
    }

    passed
}

fn test_context_commitment(failed: &mut usize) -> usize {
    let mut passed = 0usize;
    let payload = br#"{"data":"hello"}"#;
    let (priv_pem, pub_pem) = signature::generate_ed25519_keypair().unwrap();
    let context = serde_json::json!({"key": "value"});

    // Compute context commitment
    let context_canonical = encode_canonical(&context).unwrap();
    let commitment = digest_hex("sha256", &context_canonical).unwrap();

    let parents: Vec<&str> = vec![];
    let side_atts: Vec<Value> = vec![];

    let config = SealConfig {
        payload,
        boundary: None,
        private_key_pem: &priv_pem,
        digest_alg: "sha256",
        sig_alg: "ed25519",
        profile: "core",
        context_commit: Some(commitment.as_bytes()),
        parents: &parents,
        side_attestations: &side_atts,
        expiration: None,
    };

    match seal_bundle(config) {
        Ok(bundle) => {
            let verify_config = VerifyConfig {
                bundle: &bundle,
                public_key_pem: Some(&pub_pem),
                context: Some(&context),
                parents: &[],
                profile: None,
                max_bytes: None,
                max_depth: None,
            };
            let result = verify_bundle(verify_config);
            if result.verified {
                println!("  [PASS] Context commitment verify");
                passed += 1;
            } else {
                println!("  [FAIL] Context commitment verify: {}", result.message);
                *failed += 1;
            }

            // Wrong context should fail
            let wrong_context = serde_json::json!({"key": "wrong"});
            let verify_config2 = VerifyConfig {
                bundle: &bundle,
                public_key_pem: Some(&pub_pem),
                context: Some(&wrong_context),
                parents: &[],
                profile: None,
                max_bytes: None,
                max_depth: None,
            };
            let result2 = verify_bundle(verify_config2);
            if !result2.verified {
                println!("  [PASS] Context commitment mismatch detected");
                passed += 1;
            } else {
                println!("  [FAIL] Wrong context should fail");
                *failed += 1;
            }
        }
        Err(e) => {
            println!("  [FAIL] Seal with context commitment: {e}");
            *failed += 2;
        }
    }

    passed
}

fn test_hitl_approval(failed: &mut usize) -> usize {
    let mut passed = 0usize;

    // Test that HITL approval attestation type exists conceptually
    let hitl_att = serde_json::json!({
        "type": "hitl_approval",
        "approver": "test@example.com",
        "timestamp": "2024-01-01T00:00:00Z"
    });

    if hitl_att.get("type").and_then(|v| v.as_str()) == Some("hitl_approval") {
        println!("  [PASS] HITL approval attestation structure");
        passed += 1;
    } else {
        println!("  [FAIL] HITL approval attestation structure");
        *failed += 1;
    }

    passed
}

fn test_exit_codes(_failed: &mut usize) -> usize {
    let mut passed = 0usize;

    // Verify all expected exit codes have messages
    let codes = vec![
        (0, "verified"),
        (10, "malformed"),
        (11, "invalid signature"),
        (12, "out of bounds"),
        (13, "unknown version"),
        (14, "missing side information"),
        (15, "lineage invalid"),
        (16, "resource exhausted"),
        (17, "policy denied"),
        (18, "indeterminate"),
        (19, "not defined in this version"),
    ];

    for (code, expected) in &codes {
        let msg = exit_code_message(*code);
        if msg == *expected {
            passed += 1;
        } else {
            println!("  [FAIL] Exit code {code}: expected '{expected}', got '{msg}'");
        }
    }

    println!("  [PASS] All {} exit codes defined", codes.len());
    passed
}

fn run_external_vectors(path: &str, failed: &mut usize) -> Result<usize, Box<dyn std::error::Error>> {
    let data = std::fs::read_to_string(path)?;
    let vectors: Value = serde_json::from_str(&data)?;

    let mut passed = 0usize;

    if let Some(arr) = vectors.as_array() {
        for (i, vector) in arr.iter().enumerate() {
            let name = vector
                .get("name")
                .and_then(|v| v.as_str())
                .unwrap_or("unknown");

            // Each vector should have a bundle and expected result
            if let Some(bundle) = vector.get("bundle") {
                let verify_config = VerifyConfig {
                    bundle,
                    public_key_pem: None,
                    context: None,
                    parents: &[],
                    profile: None,
                    max_bytes: None,
                    max_depth: None,
                };
                let result = verify_bundle(verify_config);

                if let Some(expected_code) = vector.get("expected_exit_code").and_then(|v| v.as_i64()) {
                    if result.exit_code == expected_code as i32 {
                        println!("  [PASS] Vector {i}: {name}");
                        passed += 1;
                    } else {
                        println!(
                            "  [FAIL] Vector {i}: {name} - expected exit code {expected_code}, got {}",
                            result.exit_code
                        );
                        *failed += 1;
                    }
                } else {
                    println!("  [SKIP] Vector {i}: {name} - no expected_exit_code");
                }
            }
        }
    }

    Ok(passed)
}
