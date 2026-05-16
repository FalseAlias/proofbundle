//! Lineage command implementation.

use proofbundle::LineageError;
use serde_json::Value;

pub struct TraceArgs {
    pub leaf: String,
    pub parent_dir: Option<String>,
    pub format: &'static str,
}

pub fn run_trace(args: TraceArgs) -> Result<(), Box<dyn std::error::Error>> {
    let leaf_data = std::fs::read(&args.leaf)?;
    let leaf: Value = serde_json::from_slice(&leaf_data)?;

    // Parent resolver: looks up parent references
    let parent_dir = args.parent_dir.clone();
    let resolver = move |ref_id: &str| -> Result<Value, LineageError> {
        // Try as file path first
        let path = match &parent_dir {
            Some(dir) => format!("{}/{}", dir, ref_id),
            None => ref_id.to_string(),
        };

        // Try with .json extension
        let paths = vec![path.clone(), format!("{path}.json")];
        for p in &paths {
            if let Ok(data) = std::fs::read(p) {
                if let Ok(bundle) = serde_json::from_slice(&data) {
                    return Ok(bundle);
                }
            }
        }

        Err(LineageError::ParentNotFound(ref_id.to_string()))
    };

    let chain = proofbundle::resolve_lineage(&leaf, resolver, 100)?;

    match args.format {
        "json" => {
            let output = serde_json::json!({
                "chain": chain.chain,
                "length": chain.len(),
            });
            println!("{}", serde_json::to_string_pretty(&output)?);
        }
        "dot" => {
            let dot = proofbundle::lineage::lineage_to_dot(&chain);
            println!("{dot}");
        }
        "text" | _ => {
            let text = proofbundle::lineage::lineage_to_text(&chain);
            println!("{text}");
            println!("\nChain length: {}", chain.len());
        }
    }

    Ok(())
}
