use aes_gcm::{
    aead::{Aead, KeyInit},
    Aes256Gcm, Nonce,
};
use hmac::{Hmac, Mac};
use sha2::{Sha256, Sha512};
use sha2::Digest;
use subtle::ConstantTimeEq;
use base64::{Engine as _, engine::general_purpose};
use std::str;

// Helper to decode key or use as is
fn prepare_key(key: &str, expected_len: usize) -> Result<Vec<u8>, String> {
    // Try user string as bytes
    let bytes = key.as_bytes();
    if bytes.len() == expected_len {
        return Ok(bytes.to_vec());
    }
    // If not, maybe it is hex?
    if let Ok(decoded) = hex::decode(key) {
        if decoded.len() == expected_len {
            return Ok(decoded);
        }
    }
    // If not, maybe base64?
    if let Ok(decoded) = general_purpose::STANDARD.decode(key) {
        if decoded.len() == expected_len {
            return Ok(decoded);
        }
    }
    Err(format!("Invalid key length. Expected {} bytes.", expected_len))
}

/// Encrypts plaintext using AES-256-GCM.
/// Returns Base64 encoded string containing nonce + ciphertext.
pub fn encrypt(algo: &str, key: &str, plaintext: &str) -> Result<String, String> {
    match algo {
        "aes-256-gcm" | "aes256" => {
            let key_bytes = prepare_key(key, 32)?;
            let cipher = Aes256Gcm::new_from_slice(&key_bytes).map_err(|e| e.to_string())?;
            // Generate a random 96-bit nonce
            let mut nonce_bytes = [0u8; 12];
            rand::Rng::fill(&mut rand::thread_rng(), &mut nonce_bytes);
            let nonce = Nonce::from_slice(&nonce_bytes);

            let ciphertext = cipher.encrypt(nonce, plaintext.as_bytes())
                .map_err(|_| "Encryption failed".to_string())?;
            
            // Return format: nonce + ciphertext (base64)
            let mut combined = nonce_bytes.to_vec();
            combined.extend(ciphertext);
            Ok(general_purpose::STANDARD.encode(&combined))
        },
        _ => Err(format!("Unsupported algorithm: {}", algo))
    }
}

/// Decrypts a Base64 encoded string (nonce + ciphertext) using AES-256-GCM.
pub fn decrypt(algo: &str, key: &str, ciphertext: &str) -> Result<Vec<u8>, String> {
    match algo {
        "aes-256-gcm" | "aes256" => {
            let key_bytes = prepare_key(key, 32)?;
            let cipher = Aes256Gcm::new_from_slice(&key_bytes).map_err(|e| e.to_string())?;

            let data = general_purpose::STANDARD.decode(ciphertext)
                .map_err(|_| "Invalid Base64 ciphertext".to_string())?;
            
            if data.len() < 12 {
                return Err("DECRYPTION_FAILED: Invalid ciphertext length".to_string());
            }

            let (nonce_bytes, ciphertext_bytes) = data.split_at(12);
            let nonce = Nonce::from_slice(nonce_bytes);

            let plaintext_bytes = cipher.decrypt(nonce, ciphertext_bytes)
                .map_err(|_| "DECRYPTION_FAILED".to_string())?;
            
            Ok(plaintext_bytes)
        },
        _ => Err(format!("Unsupported algorithm: {}", algo))
    }
}

pub fn hash_keyed(algo: &str, key: &str, message: &str) -> Result<String, String> {
    match algo {
        "sha256" => {
            type HmacSha256 = Hmac<Sha256>;
            let mut mac = <HmacSha256 as Mac>::new_from_slice(key.as_bytes())
                .map_err(|_| "Invalid key length".to_string())?;
            mac.update(message.as_bytes());
            let result = mac.finalize();
            Ok(hex::encode(result.into_bytes()))
        },
        "sha512" => {
            type HmacSha512 = Hmac<Sha512>;
            let mut mac = <HmacSha512 as Mac>::new_from_slice(key.as_bytes())
                .map_err(|_| "Invalid key length".to_string())?;
            mac.update(message.as_bytes());
            let result = mac.finalize();
            Ok(hex::encode(result.into_bytes()))
        },
        _ => Err(format!("Unsupported algorithm: {}", algo))
    }
}


pub fn compare(a: &str, b: &str) -> bool {
    let a_bytes = a.as_bytes();
    let b_bytes = b.as_bytes();
    if a_bytes.len() != b_bytes.len() {
        return false;
    }
    a_bytes.ct_eq(b_bytes).into()
}

pub fn hash(algo: &str, data: &str) -> String {
    match algo {
        "sha512" => {
            use sha2::Digest;
            let mut h = Sha512::new();
            h.update(data.as_bytes());
            hex::encode(h.finalize())
        },
        _ => {
            // Default: sha256
            use sha2::Digest;
            let mut h = Sha256::new();
            h.update(data.as_bytes());
            hex::encode(h.finalize())
        }
    }
}

pub fn random_bytes(size: usize) -> String {
    use rand::RngCore;
    let mut bytes = vec![0u8; size];
    rand::thread_rng().fill_bytes(&mut bytes);
    general_purpose::STANDARD.encode(&bytes)
}
