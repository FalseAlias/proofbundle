//! Seal command implementation.

use proofbundle::{read_input, seal_bundle, write_output, SealConfig};
use serde_json::Value;

pub struct SealArgs {
    pub payload: Option<String>,
    pub boundary: Option<String>,
    pub key: String,
    pub digest: String,
    pub sig: String,
    pub profile: String,
    pub context_commit: Option<String>,
    pub parent: Vec<String>,
    pub side_attestation: Vec<String>,
    pub expiration: Option<String>,
    pub out: Option<String>,
}

pub fn run(args: SealArgs) -> Result<(), Box<dyn std::error::Error>> {
    // Read payload
    let payload_data = read_input(args.payload.as_deref())?;

    // Read boundary
    let boundary_value: Option<Value> = match args.boundary {
        Some(ref path) => {
            let data = read_input(Some(path))?;
            Some(serde_json::from_slice(&data)?)
        }
        None => None,
    };

    // Read private key
    let private_key_pem = String::from_utf8(std::fs::read(&args.key)?)?;

    // Read context commitment
    let context_commit = match args.context_commit {
        Some(ref path) => Some(read_input(Some(path))?),
        None => None,
    };

    // Read side attestations
    let mut side_atts = Vec::new();
    for path in &args.side_attestation {
        let data = read_input(Some(path))?;
        let att: Value = serde_json::from_slice(&data)?;
        side_atts.push(att);
    }

    // Parse parents as owned strings
    let parents_owned: Vec<String> = args.parent.clone();
    let parents_refs: Vec<&str> = parents_owned.iter().map(|s| s.as_str()).collect();

    // Parse side attestations
    let side_atts_refs: Vec<Value> = side_atts;

    let config = SealConfig {
        payload: &payload_data,
        boundary: boundary_value.as_ref(),
        private_key_pem: &private_key_pem,
        digest_alg: &args.digest,
        sig_alg: &args.sig,
        profile: &args.profile,
        context_commit: context_commit.as_deref(),
        parents: &parents_refs,
        side_attestations: &side_atts_refs,
        expiration: args.expiration.as_deref(),
    };

    let bundle = seal_bundle(config)?;
    let bundle_json = serde_json::to_string_pretty(&bundle)?;
    write_output(args.out.as_deref(), bundle_json.as_bytes())?;

    Ok(())
}
