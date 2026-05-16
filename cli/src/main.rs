//! ProofBundle CLI - main entry point.
//!
//! Commands:
//! - seal: Create a sealed bundle
//! - verify: Verify a bundle
//! - inspect: Print bundle structure
//! - lineage trace: Trace lineage chain
//! - conformance run: Run conformance tests
//! - conformance compare: Compare implementations (placeholder)
//! - key generate: Generate signing keys

mod commands;

use clap::{Parser, Subcommand};
use std::process;

#[derive(Parser)]
#[command(name = "proofbundle")]
#[command(version = "1.0.0")]
#[command(about = "ProofBundle CLI - cryptographic bundle sealing and verification")]
struct Cli {
    #[command(subcommand)]
    command: Commands,
}

#[derive(Subcommand)]
enum Commands {
    /// Seal a payload into a signed bundle
    #[command(name = "seal")]
    Seal {
        /// Payload file (or stdin if omitted)
        #[arg(long)]
        payload: Option<String>,
        /// Boundary specification file
        #[arg(long)]
        boundary: Option<String>,
        /// Private key file (PEM)
        #[arg(long)]
        key: String,
        /// Digest algorithm (sha256, sha384, sha512, blake3, blake2b512)
        #[arg(long, default_value = "sha256")]
        digest: String,
        /// Signature algorithm (ed25519, ecdsa-sha256-p256, ecdsa-sha384-p384, ecdsa-sha512-p521, rsa-pss-sha256, rsa-pss-sha384, rsa-pss-sha512)
        #[arg(long, default_value = "ed25519")]
        sig: String,
        /// Bundle profile (core, sealed, chained, full)
        #[arg(long, default_value = "sealed")]
        profile: String,
        /// Context commitment file
        #[arg(long)]
        context_commit: Option<String>,
        /// Parent bundle reference(s)
        #[arg(long)]
        parent: Vec<String>,
        /// Side attestation file(s)
        #[arg(long)]
        side_attestation: Vec<String>,
        /// Expiration timestamp (ISO8601)
        #[arg(long)]
        expiration: Option<String>,
        /// Output file (or stdout if omitted)
        #[arg(long)]
        out: Option<String>,
    },

    /// Verify a bundle
    #[command(name = "verify")]
    Verify {
        /// Bundle file (or stdin if omitted)
        #[arg(long)]
        bundle: Option<String>,
        /// Public key file (PEM)
        #[arg(long)]
        public_key: Option<String>,
        /// Context file (JSON)
        #[arg(long)]
        context: Option<String>,
        /// Parent bundle reference(s)
        #[arg(long)]
        parent: Vec<String>,
        /// Expected profile
        #[arg(long)]
        profile: Option<String>,
        /// Maximum bundle size in bytes
        #[arg(long)]
        max_bytes: Option<usize>,
        /// Maximum nesting depth
        #[arg(long)]
        max_depth: Option<usize>,
        /// Output format
        #[arg(long, value_enum, default_value = "text")]
        format: OutputFormat,
    },

    /// Inspect a bundle without verifying
    #[command(name = "inspect")]
    Inspect {
        /// Bundle file (or stdin if omitted)
        #[arg(long)]
        bundle: Option<String>,
    },

    /// Lineage operations
    #[command(name = "lineage")]
    Lineage {
        #[command(subcommand)]
        command: LineageCommand,
    },

    /// Conformance testing
    #[command(name = "conformance")]
    Conformance {
        #[command(subcommand)]
        command: ConformanceCommand,
    },

    /// Key generation
    #[command(name = "key")]
    Key {
        #[command(subcommand)]
        command: KeyCommand,
    },
}

#[derive(Subcommand)]
enum LineageCommand {
    /// Trace a lineage chain from leaf to root
    #[command(name = "trace")]
    Trace {
        /// Leaf bundle file
        #[arg(long)]
        leaf: String,
        /// Directory containing parent bundles
        #[arg(long)]
        parent_dir: Option<String>,
        /// Output format
        #[arg(long, value_enum, default_value = "text")]
        format: LineageFormat,
    },
}

#[derive(Subcommand)]
enum ConformanceCommand {
    /// Run all conformance test vectors
    #[command(name = "run")]
    Run {
        /// Test vectors file
        #[arg(long)]
        vectors: Option<String>,
    },
    /// Compare implementations (placeholder)
    #[command(name = "compare")]
    Compare {
        /// Test vectors file
        #[arg(long)]
        vectors: Option<String>,
    },
}

#[derive(Subcommand)]
enum KeyCommand {
    /// Generate a signing key pair
    #[command(name = "generate")]
    Generate {
        /// Key algorithm (ed25519, p256, p384, p521, rsa)
        #[arg(long, default_value = "ed25519")]
        algorithm: String,
        /// Output private key file
        #[arg(long)]
        out_private: Option<String>,
        /// Output public key file
        #[arg(long)]
        out_public: Option<String>,
    },
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, clap::ValueEnum)]
enum OutputFormat {
    Json,
    Text,
    ExitCodeOnly,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, clap::ValueEnum)]
enum LineageFormat {
    Json,
    Dot,
    Text,
}

fn main() {
    let cli = Cli::parse();

    let result = match cli.command {
        Commands::Seal {
            payload,
            boundary,
            key,
            digest,
            sig,
            profile,
            context_commit,
            parent,
            side_attestation,
            expiration,
            out,
        } => commands::seal::run(commands::seal::SealArgs {
            payload,
            boundary,
            key,
            digest,
            sig,
            profile,
            context_commit,
            parent,
            side_attestation,
            expiration,
            out,
        }),
        Commands::Verify {
            bundle,
            public_key,
            context,
            parent,
            profile,
            max_bytes,
            max_depth,
            format,
        } => commands::verify::run(commands::verify::VerifyArgs {
            bundle,
            public_key,
            context,
            parent,
            profile,
            max_bytes,
            max_depth,
            format: match format {
                OutputFormat::Json => "json",
                OutputFormat::Text => "text",
                OutputFormat::ExitCodeOnly => "exit-code-only",
            },
        }),
        Commands::Inspect { bundle } => {
            commands::inspect::run(commands::inspect::InspectArgs { bundle })
        }
        Commands::Lineage { command } => match command {
            LineageCommand::Trace {
                leaf,
                parent_dir,
                format,
            } => commands::lineage::run_trace(commands::lineage::TraceArgs {
                leaf,
                parent_dir,
                format: match format {
                    LineageFormat::Json => "json",
                    LineageFormat::Dot => "dot",
                    LineageFormat::Text => "text",
                },
            }),
        },
        Commands::Conformance { command } => match command {
            ConformanceCommand::Run { vectors } => {
                commands::conformance::run(vectors.as_deref())
            }
            ConformanceCommand::Compare { vectors: _ } => {
                println!("Compare is a placeholder - not yet implemented");
                Ok(())
            }
        },
        Commands::Key { command } => match command {
            KeyCommand::Generate {
                algorithm,
                out_private,
                out_public,
            } => commands::key::run_generate(commands::key::GenerateArgs {
                algorithm,
                out_private,
                out_public,
            }),
        },
    };

    if let Err(e) = result {
        eprintln!("error: {e}");
        process::exit(1);
    }
}
