//! Key generation command implementation.

use proofbundle::signature;

pub struct GenerateArgs {
    pub algorithm: String,
    pub out_private: Option<String>,
    pub out_public: Option<String>,
}

pub fn run_generate(args: GenerateArgs) -> Result<(), Box<dyn std::error::Error>> {
    let (private_pem, public_pem) = match args.algorithm.as_str() {
        "ed25519" => signature::generate_ed25519_keypair()
            .map_err(|e| format!("Ed25519 key generation failed: {e}")),
        "p256" => signature::generate_p256_keypair()
            .map_err(|e| format!("P-256 key generation failed: {e}")),
        "p384" => signature::generate_p384_keypair()
            .map_err(|e| format!("P-384 key generation failed: {e}")),
        "p521" => signature::generate_p521_keypair()
            .map_err(|e| format!("P-521 key generation failed: {e}")),
        "rsa" => signature::generate_rsa_keypair()
            .map_err(|e| format!("RSA key generation failed: {e}")),
        other => Err(format!("Unknown key algorithm: {other}")),
    }?;

    // Write private key
    match args.out_private {
        Some(ref path) => {
            std::fs::write(path, private_pem.as_bytes())?;
            println!("Private key written to: {path}");
        }
        None => {
            println!("{private_pem}");
        }
    }

    // Write public key
    match args.out_public {
        Some(ref path) => {
            std::fs::write(path, public_pem.as_bytes())?;
            println!("Public key written to: {path}");
        }
        None => {
            // If private went to file and public has no explicit path, derive one
            if args.out_private.is_some() && args.out_public.is_none() {
                let default_pub = format!("{}.pub", args.out_private.as_ref().unwrap());
                std::fs::write(&default_pub, public_pem.as_bytes())?;
                println!("Public key written to: {default_pub}");
            } else {
                println!("{public_pem}");
            }
        }
    }

    Ok(())
}
