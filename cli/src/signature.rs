//! Signature algorithm dispatch for ProofBundle.
//!
//! Supported algorithms:
//! - Ed25519 (via ed25519-dalek)
//! - ECDSA-SHA256-P256, ECDSA-SHA384-P384, ECDSA-SHA512-P521 (via p256/p384/p521)
//! - RSA-PSS-SHA256, RSA-PSS-SHA384, RSA-PSS-SHA512 (via rsa crate)

use ed25519_dalek::{Signer, Verifier};
use pkcs8::{DecodePrivateKey, DecodePublicKey};

#[derive(Debug, Clone, PartialEq, thiserror::Error)]
pub enum SigError {
    #[error("Unknown signature algorithm: {0}")]
    UnknownAlgorithm(String),
    #[error("Invalid private key: {0}")]
    InvalidPrivateKey(String),
    #[error("Invalid public key: {0}")]
    InvalidPublicKey(String),
    #[error("Signing failed: {0}")]
    SigningFailed(String),
    #[error("Verification failed: {0}")]
    VerificationFailed(String),
    #[error("Unsupported key format")]
    UnsupportedKeyFormat,
}

/// Supported signature algorithm identifiers.
pub const SIG_ALGORITHMS: &[&str] = &[
    "ed25519",
    "ecdsa-sha256-p256",
    "ecdsa-sha384-p384",
    "ecdsa-sha512-p521",
    "rsa-pss-sha256",
    "rsa-pss-sha384",
    "rsa-pss-sha512",
];

/// Sign data using the specified algorithm and private key (PEM-encoded).
pub fn sign(alg: &str, private_key_pem: &str, data: &[u8]) -> Result<Vec<u8>, SigError> {
    match alg {
        "ed25519" => sign_ed25519(private_key_pem, data),
        "ecdsa-sha256-p256" => sign_ecdsa_p256(private_key_pem, data),
        "ecdsa-sha384-p384" => sign_ecdsa_p384(private_key_pem, data),
        "ecdsa-sha512-p521" => sign_ecdsa_p521(private_key_pem, data),
        "rsa-pss-sha256" => sign_rsa_pss::<sha2::Sha256>(private_key_pem, data),
        "rsa-pss-sha384" => sign_rsa_pss::<sha2::Sha384>(private_key_pem, data),
        "rsa-pss-sha512" => sign_rsa_pss::<sha2::Sha512>(private_key_pem, data),
        other => Err(SigError::UnknownAlgorithm(other.to_string())),
    }
}

/// Verify a signature using the specified algorithm and public key (PEM-encoded).
pub fn verify(alg: &str, public_key_pem: &str, data: &[u8], sig: &[u8]) -> Result<(), SigError> {
    match alg {
        "ed25519" => verify_ed25519(public_key_pem, data, sig),
        "ecdsa-sha256-p256" => verify_ecdsa_p256(public_key_pem, data, sig),
        "ecdsa-sha384-p384" => verify_ecdsa_p384(public_key_pem, data, sig),
        "ecdsa-sha512-p521" => verify_ecdsa_p521(public_key_pem, data, sig),
        "rsa-pss-sha256" => verify_rsa_pss::<sha2::Sha256>(public_key_pem, data, sig),
        "rsa-pss-sha384" => verify_rsa_pss::<sha2::Sha384>(public_key_pem, data, sig),
        "rsa-pss-sha512" => verify_rsa_pss::<sha2::Sha512>(public_key_pem, data, sig),
        other => Err(SigError::UnknownAlgorithm(other.to_string())),
    }
}

fn sign_ed25519(private_key_pem: &str, data: &[u8]) -> Result<Vec<u8>, SigError> {
    let signing_key = ed25519_dalek::SigningKey::from_pkcs8_pem(private_key_pem)
        .map_err(|e| SigError::InvalidPrivateKey(format!("ed25519: {e}")))?;
    Ok(signing_key.sign(data).to_bytes().to_vec())
}

fn verify_ed25519(public_key_pem: &str, data: &[u8], sig: &[u8]) -> Result<(), SigError> {
    let verifying_key = ed25519_dalek::VerifyingKey::from_public_key_pem(public_key_pem)
        .map_err(|e| SigError::InvalidPublicKey(format!("ed25519: {e}")))?;
    let sig_arr: [u8; 64] = sig
        .try_into()
        .map_err(|_| SigError::VerificationFailed("invalid signature length".to_string()))?;
    let signature = ed25519_dalek::Signature::from_bytes(&sig_arr);
    verifying_key
        .verify(data, &signature)
        .map_err(|e| SigError::VerificationFailed(format!("ed25519: {e}")))
}

fn sign_ecdsa_p256(private_key_pem: &str, data: &[u8]) -> Result<Vec<u8>, SigError> {
    use p256::ecdsa::{signature::Signer as _, SigningKey};
    let signing_key = SigningKey::from_pkcs8_pem(private_key_pem)
        .map_err(|e| SigError::InvalidPrivateKey(format!("p256: {e}")))?;
    let sig: p256::ecdsa::Signature = signing_key.sign(data);
    Ok(sig.to_der().as_bytes().to_vec())
}

fn verify_ecdsa_p256(public_key_pem: &str, data: &[u8], sig: &[u8]) -> Result<(), SigError> {
    use p256::ecdsa::{signature::Verifier as _, VerifyingKey};
    let verifying_key = VerifyingKey::from_public_key_pem(public_key_pem)
        .map_err(|e| SigError::InvalidPublicKey(format!("p256: {e}")))?;
    let sig = p256::ecdsa::Signature::from_der(sig)
        .map_err(|e| SigError::VerificationFailed(format!("p256 der: {e}")))?;
    verifying_key
        .verify(data, &sig)
        .map_err(|e| SigError::VerificationFailed(format!("p256: {e}")))
}

fn sign_ecdsa_p384(private_key_pem: &str, data: &[u8]) -> Result<Vec<u8>, SigError> {
    use p384::ecdsa::{signature::Signer as _, SigningKey};
    let signing_key = SigningKey::from_pkcs8_pem(private_key_pem)
        .map_err(|e| SigError::InvalidPrivateKey(format!("p384: {e}")))?;
    let sig: p384::ecdsa::Signature = signing_key.sign(data);
    Ok(sig.to_der().as_bytes().to_vec())
}

fn verify_ecdsa_p384(public_key_pem: &str, data: &[u8], sig: &[u8]) -> Result<(), SigError> {
    use p384::ecdsa::{signature::Verifier as _, VerifyingKey};
    let verifying_key = VerifyingKey::from_public_key_pem(public_key_pem)
        .map_err(|e| SigError::InvalidPublicKey(format!("p384: {e}")))?;
    let sig = p384::ecdsa::Signature::from_der(sig)
        .map_err(|e| SigError::VerificationFailed(format!("p384 der: {e}")))?;
    verifying_key
        .verify(data, &sig)
        .map_err(|e| SigError::VerificationFailed(format!("p384: {e}")))
}

fn sign_ecdsa_p521(private_key_pem: &str, data: &[u8]) -> Result<Vec<u8>, SigError> {
    use p521::ecdsa::{signature::Signer as _, SigningKey};
    let secret_key = p521::SecretKey::from_pkcs8_pem(private_key_pem)
        .map_err(|e| SigError::InvalidPrivateKey(format!("p521: {e}")))?;
    let signing_key = SigningKey::from_slice(&secret_key.to_bytes())
        .map_err(|e| SigError::InvalidPrivateKey(format!("p521: {e}")))?;
    let sig: p521::ecdsa::Signature = signing_key.sign(data);
    Ok(sig.to_der().as_bytes().to_vec())
}

fn verify_ecdsa_p521(public_key_pem: &str, data: &[u8], sig: &[u8]) -> Result<(), SigError> {
    use p521::ecdsa::{signature::Verifier as _, VerifyingKey};
    let public_key = p521::PublicKey::from_public_key_pem(public_key_pem)
        .map_err(|e| SigError::InvalidPublicKey(format!("p521: {e}")))?;
    let encoded = public_key.to_sec1_bytes();
    let verifying_key = VerifyingKey::from_sec1_bytes(encoded.as_ref())
        .map_err(|e| SigError::InvalidPublicKey(format!("p521: {e}")))?;
    let sig = p521::ecdsa::Signature::from_der(sig)
        .map_err(|e| SigError::VerificationFailed(format!("p521 der: {e}")))?;
    verifying_key
        .verify(data, &sig)
        .map_err(|e| SigError::VerificationFailed(format!("p521: {e}")))
}

fn sign_rsa_pss<D>(private_key_pem: &str, data: &[u8]) -> Result<Vec<u8>, SigError>
where
    D: ::digest::Digest + ::digest::FixedOutputReset + 'static,
{
    use rsa::pss::BlindedSigningKey;
    use rsa::signature::{RandomizedSigner, SignatureEncoding};
    use rsa::RsaPrivateKey;
    let private_key = RsaPrivateKey::from_pkcs8_pem(private_key_pem)
        .map_err(|e| SigError::InvalidPrivateKey(format!("rsa: {e}")))?;
    let signing_key = BlindedSigningKey::<D>::new(private_key);
    let signature = signing_key.sign_with_rng(&mut rand::thread_rng(), data);
    Ok(signature.to_bytes().to_vec())
}

fn verify_rsa_pss<D>(public_key_pem: &str, data: &[u8], sig: &[u8]) -> Result<(), SigError>
where
    D: ::digest::Digest + ::digest::FixedOutputReset + 'static,
{
    use rsa::pss::VerifyingKey;
    use rsa::signature::Verifier;
    use rsa::RsaPublicKey;
    let public_key = RsaPublicKey::from_public_key_pem(public_key_pem)
        .map_err(|e| SigError::InvalidPublicKey(format!("rsa: {e}")))?;
    let verifying_key = VerifyingKey::<D>::new(public_key);
    let signature: rsa::pss::Signature = sig
        .try_into()
        .map_err(|_| SigError::VerificationFailed("invalid signature".to_string()))?;
    verifying_key
        .verify(data, &signature)
        .map_err(|e| SigError::VerificationFailed(format!("rsa-pss: {e}")))
}

/// Generate a new Ed25519 key pair, returning (private_key_pem, public_key_pem).
pub fn generate_ed25519_keypair() -> Result<(String, String), SigError> {
    use ed25519_dalek::pkcs8::EncodePrivateKey;
    use pkcs8::EncodePublicKey;
    let mut csprng = rand::rngs::OsRng;
    let signing_key = ed25519_dalek::SigningKey::generate(&mut csprng);
    let verifying_key = signing_key.verifying_key();
    let private_pem = signing_key
        .to_pkcs8_pem(pkcs8::LineEnding::LF)
        .map_err(|e| SigError::SigningFailed(e.to_string()))?
        .to_string();
    let public_pem = verifying_key
        .to_public_key_pem(pkcs8::LineEnding::LF)
        .map_err(|e| SigError::SigningFailed(e.to_string()))?;
    Ok((private_pem, public_pem))
}

/// Generate a P-256 ECDSA key pair.
pub fn generate_p256_keypair() -> Result<(String, String), SigError> {
    use pkcs8::{EncodePrivateKey, EncodePublicKey};
    let signing_key = p256::ecdsa::SigningKey::random(&mut rand::thread_rng());
    let private_pem = signing_key
        .to_pkcs8_pem(pkcs8::LineEnding::LF)
        .map_err(|e| SigError::SigningFailed(e.to_string()))?
        .to_string();
    let public_pem = signing_key
        .verifying_key()
        .to_public_key_pem(pkcs8::LineEnding::LF)
        .map_err(|e| SigError::SigningFailed(e.to_string()))?;
    Ok((private_pem, public_pem))
}

/// Generate a P-384 ECDSA key pair.
pub fn generate_p384_keypair() -> Result<(String, String), SigError> {
    use pkcs8::{EncodePrivateKey, EncodePublicKey};
    let signing_key = p384::ecdsa::SigningKey::random(&mut rand::thread_rng());
    let private_pem = signing_key
        .to_pkcs8_pem(pkcs8::LineEnding::LF)
        .map_err(|e| SigError::SigningFailed(e.to_string()))?
        .to_string();
    let public_pem = signing_key
        .verifying_key()
        .to_public_key_pem(pkcs8::LineEnding::LF)
        .map_err(|e| SigError::SigningFailed(e.to_string()))?;
    Ok((private_pem, public_pem))
}

/// Generate a P-521 ECDSA key pair.
pub fn generate_p521_keypair() -> Result<(String, String), SigError> {
    use pkcs8::{EncodePrivateKey, EncodePublicKey};
    let secret_key = p521::SecretKey::random(&mut rand::thread_rng());
    let _signing_key = p521::ecdsa::SigningKey::from_slice(&secret_key.to_bytes())
        .map_err(|e| SigError::SigningFailed(format!("p521: {e}")))?;
    let private_pem = secret_key
        .to_pkcs8_pem(pkcs8::LineEnding::LF)
        .map_err(|e| SigError::SigningFailed(e.to_string()))?
        .to_string();
    let public_key = secret_key.public_key();
    let public_pem = public_key
        .to_public_key_pem(pkcs8::LineEnding::LF)
        .map_err(|e| SigError::SigningFailed(e.to_string()))?;
    Ok((private_pem, public_pem))
}

/// Generate an RSA-4096 key pair.
pub fn generate_rsa_keypair() -> Result<(String, String), SigError> {
    use pkcs8::{EncodePrivateKey, EncodePublicKey};
    let private_key =
        rsa::RsaPrivateKey::new(&mut rand::thread_rng(), 4096)
            .map_err(|e| SigError::SigningFailed(format!("rsa gen: {e}")))?;
    let private_pem = private_key
        .to_pkcs8_pem(pkcs8::LineEnding::LF)
        .map_err(|e| SigError::SigningFailed(e.to_string()))?
        .to_string();
    let public_pem = rsa::RsaPublicKey::from(&private_key)
        .to_public_key_pem(pkcs8::LineEnding::LF)
        .map_err(|e| SigError::SigningFailed(e.to_string()))?;
    Ok((private_pem, public_pem))
}
