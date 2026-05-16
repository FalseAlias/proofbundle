//! Verify command implementation.

use proofbundle::{read_input, verify_bundle, VerifyConfig};
use serde_json::Value;
use std::process;

pub struct VerifyArgs {
    pub bundle: Option<String>,
    pub public_key: Option<String>,
    pub context: Option<String>,
    pub parent: Vec<String>,
    pub profile: Option<String>,
    pub max_bytes: Option<usize>,
    pub max_depth: Option<usize>,
    pub format: &'static str,
}

pub fn run(args: VerifyArgs) -> Result<(), Box<dyn std::error::Error>> {
    // Read bundle
    let bundle_data = read_input(args.bundle.as_deref())?;
    let bundle: Value = serde_json::from_slice(&bundle_data)?;

    // Read public key if provided
    let public_key_pem = match args.public_key {
        Some(ref path) => Some(std::fs::read_to_string(path)?),
        None => None,
    };

    // Read context if provided
    let context_value = match args.context {
        Some(ref path) => {
            let data = read_input(Some(path))?;
            Some(serde_json::from_slice(&data)?)
        }
        None => None,
    };

    let parent_refs: Vec<&str> = args.parent.iter().map(|s| s.as_str()).collect();

    let config = VerifyConfig {
        bundle: &bundle,
        public_key_pem: public_key_pem.as_deref(),
        context: context_value.as_ref(),
        parents: &parent_refs,
        profile: args.profile.as_deref(),
        max_bytes: args.max_bytes,
        max_depth: args.max_depth,
    };

    let result = verify_bundle(config);

    match args.format {
        "exit-code-only" => {
            process::exit(result.exit_code);
        }
        "json" => {
            let output = serde_json::json!({
                "verified": result.verified,
                "exit_code": result.exit_code,
                "message": result.message,
            });
            println!("{}", serde_json::to_string_pretty(&output)?);
        }
        "text" | _ => {
            let status = if result.verified { "VERIFIED" } else { "FAILED" };
            println!("{status}: {}", result.message);
        }
    }

    // Exit with the verifier's exit code (not an error code)
    if !result.verified {
        process::exit(result.exit_code);
    }

    Ok(())
}
