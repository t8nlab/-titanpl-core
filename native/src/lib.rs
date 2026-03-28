use std::ffi::{CStr, CString};
use std::os::raw::c_char;
use std::ptr;
use std::thread;
use std::time::Duration;
use base64::{Engine as _, engine::general_purpose};

// Force rebuild 2
mod storage_impl;
mod crypto_impl;
mod v8_impl;

// --- V8 Serialization ---

#[no_mangle]
pub extern "C" fn native_serialize(
    scope: &mut v8::HandleScope,
    args: v8::FunctionCallbackArguments,
    retval: v8::ReturnValue,
) {
    v8_impl::native_serialize(scope, args, retval)
}

#[no_mangle]
pub extern "C" fn native_deserialize(
    scope: &mut v8::HandleScope,
    args: v8::FunctionCallbackArguments,
    retval: v8::ReturnValue,
) {
    v8_impl::native_deserialize(scope, args, retval)
}

// --- Helper Functions ---

fn ptr_to_string(ptr: *const c_char) -> String {
    if ptr.is_null() {
        return String::new();
    }
    unsafe {
        CStr::from_ptr(ptr).to_string_lossy().into_owned()
    }
}

fn string_to_ptr(s: String) -> *mut c_char {
    match CString::new(s) {
        Ok(c_str) => c_str.into_raw(),
        Err(_) => ptr::null_mut(),
    }
}

fn safe_string(bytes: &[u8]) -> String {
    match std::str::from_utf8(bytes) {
        Ok(s) => s.to_string(),
        Err(_) => general_purpose::STANDARD.encode(bytes),
    }
}

fn read_file_base64_impl(path: &str) -> Result<String, String> {
    let bytes = std::fs::read(path)
        .map_err(|e| e.to_string())?;

    Ok(general_purpose::STANDARD.encode(bytes))
}

// --- File System ---

#[no_mangle]
pub extern "C" fn fs_read_file(path: *const c_char) -> *mut c_char {
    let path_str = ptr_to_string(path);
    match std::fs::read(path_str) {
        Ok(bytes) => string_to_ptr(String::from_utf8_lossy(&bytes).into_owned()),
        Err(e) => string_to_ptr(format!("ERROR: {}", e)),
    }
}

#[no_mangle]
pub extern "C" fn fs_write_file(path: *const c_char, content: *const c_char) {
    let path_str = ptr_to_string(path);
    let content_str = ptr_to_string(content);
    let _ = std::fs::write(path_str, content_str);
}

#[no_mangle]
pub extern "C" fn fs_readdir(path: *const c_char) -> *mut c_char {
    let path_str = ptr_to_string(path);
    match std::fs::read_dir(path_str) {
        Ok(entries) => {
            let files: Vec<String> = entries
                .filter_map(|entry| entry.ok().and_then(|e| e.file_name().into_string().ok()))
                .collect();
            let json = serde_json::to_string(&files).unwrap_or_else(|_| "[]".to_string());
            string_to_ptr(json)
        },
        Err(_) => string_to_ptr("[]".to_string()),
    }
}

#[no_mangle]
pub extern "C" fn fs_mkdir(path: *const c_char) {
    let path_str = ptr_to_string(path);
    let _ = std::fs::create_dir_all(path_str);
}

#[no_mangle]
pub extern "C" fn fs_exists(path: *const c_char) -> bool {
    let path_str = ptr_to_string(path);
    std::path::Path::new(&path_str).exists()
}

#[no_mangle]
pub extern "C" fn fs_stat(path: *const c_char) -> *mut c_char {
    let path_str = ptr_to_string(path);
    match std::fs::metadata(path_str) {
        Ok(meta) => {
            let stat = serde_json::json!({
                "size": meta.len(),
                "isFile": meta.is_file(),
                "isDir": meta.is_dir(),
                "modified": meta.modified().ok().and_then(|t| t.duration_since(std::time::UNIX_EPOCH).ok()).map(|d| d.as_millis()).unwrap_or(0),
            });
            string_to_ptr(stat.to_string())
        },
        Err(_) => string_to_ptr("{}".to_string()),
    }
}

#[no_mangle]
pub extern "C" fn fs_remove(path: *const c_char) {
    let path_str = ptr_to_string(path);
    let p = std::path::Path::new(&path_str);
    if p.is_dir() {
        let _ = std::fs::remove_dir_all(p);
    } else {
        let _ = std::fs::remove_file(p);
    }
}

#[no_mangle]
pub extern "C" fn fs_read_file_base64(path: *const c_char) -> *mut c_char {
    let path_str = ptr_to_string(path);

    match read_file_base64_impl(&path_str) {
        Ok(res) => string_to_ptr(res),
        Err(e) => string_to_ptr(format!("ERROR: {}", e)),
    }
}

#[no_mangle]
pub extern "C" fn path_cwd() -> *mut c_char {
    match std::env::current_dir() {
        Ok(p) => string_to_ptr(p.to_string_lossy().into_owned()),
        Err(_) => string_to_ptr(String::new()),
    }
}

// --- Proc ---
#[no_mangle]
pub extern "C" fn proc_info() -> *mut c_char {
    let info = serde_json::json!({
        "pid": std::process::id(),
        "uptime": 0, // difficult to get comfortably x-platform without more crates
    });
    string_to_ptr(info.to_string())
}

#[no_mangle]
pub extern "C" fn proc_run(
    command: *const c_char,
    options_json: *const c_char,
) -> *mut c_char {
    let cmd = ptr_to_string(command);
    let options_str = ptr_to_string(options_json);

    let options: serde_json::Value = 
        serde_json::from_str(&options_str).unwrap_or(serde_json::json!({}));
    
    let args: Vec<String> = options["args"]
        .as_array()
        .map(|arr| arr.iter().map(|v| v.as_str().unwrap_or("").to_string()).collect())
        .unwrap_or_default();
        
    let cwd_str = options["cwd"].as_str().unwrap_or("");

    let cwd_res = if cwd_str.is_empty() {
        std::env::current_dir()
    } else {
        let p = std::path::Path::new(cwd_str);
        if p.is_absolute() {
            Ok(p.to_path_buf())
        } else {
            std::env::current_dir().map(|d| d.join(p))
        }
    };

    let cwd = match cwd_res {
        Ok(c) => c,
        Err(e) => return string_to_ptr(format!("ERROR: Failed to resolve CWD: {}", e)),
    };

    let mut command = std::process::Command::new(cmd);
    command.args(args);
    command.current_dir(&cwd);
    command.stdin(std::process::Stdio::null());
    command.stdout(std::process::Stdio::null());
    command.stderr(std::process::Stdio::null());

    match command.spawn() {
        Ok(child) => {
            let res = serde_json::json!({
                "ok": true,
                "pid": child.id(),
                "cwd": cwd
            });
            string_to_ptr(res.to_string())
        }
        Err(e) => {
            string_to_ptr(format!("ERROR: Spawn failed: {}", e))
        }
    }
}

#[no_mangle]
pub extern "C" fn proc_kill(pid: f64) -> bool {
    let pid_int = pid as usize;
    use sysinfo::{System, Pid};
    let s = System::new_all();
    let pid = Pid::from(pid_int);
    if let Some(process) = s.process(pid) {
        process.kill()
    } else {
        false
    }
}

#[no_mangle]
pub extern "C" fn proc_list() -> *mut c_char {
    use sysinfo::System;
    let mut s = System::new_all();
    s.refresh_processes();
    let processes: Vec<serde_json::Value> = s.processes().iter().map(|(pid, process)| {
        serde_json::json!({
            "pid": pid.as_u32(), 
            "name": process.name(),
            "cmd": process.cmd(),
            "memory": process.memory(),
            "cpu": process.cpu_usage(),
        })
    }).collect();
    string_to_ptr(serde_json::to_string(&processes).unwrap_or("[]".to_string()))
}

// --- Crypto ---

#[no_mangle]
pub extern "C" fn crypto_hash(algo: *const c_char, data: *const c_char) -> *mut c_char {
    let algo_str = ptr_to_string(algo);
    let data_str = ptr_to_string(data);
    
    let res = crypto_impl::hash_keyed(&algo_str, "", &data_str); // Re-use hash_keyed with empty key? Or implement simple hash logic?
    // Wait, crypto_impl doesn't have simple hash. It has hash_keyed (HMAC).
    // I should check crypto_impl content again. 
    // It has `hash_keyed`. It imports sha2::{Sha256, Sha512}. 
    // I will implement simple hash here or add it to crypto_impl. 
    // For now, I'll use Sha256 directly here to save time editing crypto_impl.
    let res = match algo_str.as_str() {
       "sha256" => {
           use sha2::Digest;
           let mut hasher = sha2::Sha256::new();
           hasher.update(data_str);
           Ok(hex::encode(hasher.finalize()))
       },
        "sha512" => {
           use sha2::Digest;
           let mut hasher = sha2::Sha512::new();
           hasher.update(data_str);
           Ok(hex::encode(hasher.finalize()))
       },
       _ => Err("Unsupported algorithm".to_string())
    };

    match res {
        Ok(s) => string_to_ptr(s),
        Err(e) => string_to_ptr(format!("ERROR: {}", e)),
    }
}

#[no_mangle]
pub extern "C" fn crypto_random_bytes(size: f64) -> *mut c_char {
    let size = size as usize;
    let mut bytes = vec![0u8; size];
    // let _ = getrandom::getrandom(&mut bytes);
    // crypto_impl uses rand::thread_rng().
    let mut rng = rand::thread_rng();
    use rand::RngCore;
    rng.fill_bytes(&mut bytes);
    string_to_ptr(hex::encode(bytes))
}

#[no_mangle]
pub extern "C" fn crypto_uuid() -> *mut c_char {
    string_to_ptr(uuid::Uuid::new_v4().to_string())
}

#[no_mangle]
pub extern "C" fn crypto_encrypt(algo: *const c_char, json_args: *const c_char) -> *mut c_char {
    let algo_str = ptr_to_string(algo);
    let args_str = ptr_to_string(json_args);
    
    // Parse JSON args {key, plaintext}
    let args: serde_json::Value = match serde_json::from_str(&args_str) {
        Ok(v) => v,
        Err(_) => return string_to_ptr("ERROR: Invalid JSON".to_string()),
    };
    
    let key = args["key"].as_str().unwrap_or("");
    let plaintext = args["plaintext"].as_str().unwrap_or("");
    
    match crypto_impl::encrypt(&algo_str, key, plaintext) {
        Ok(s) => string_to_ptr(s),
        Err(e) => string_to_ptr(format!("ERROR: {}", e)),
    }
}

#[no_mangle]
pub extern "C" fn crypto_decrypt(algo: *const c_char, json_args: *const c_char) -> *mut c_char {
    let algo_str = ptr_to_string(algo);
    let args_str = ptr_to_string(json_args);
    
    let args: serde_json::Value = match serde_json::from_str(&args_str) {
        Ok(v) => v,
        Err(_) => return string_to_ptr("ERROR: Invalid JSON".to_string()),
    };
    
    let key = args["key"].as_str().unwrap_or("");
    let ciphertext = args["ciphertext"].as_str().unwrap_or("");
    
    match crypto_impl::decrypt(&algo_str, key, ciphertext) {
        Ok(bytes) => string_to_ptr(safe_string(&bytes)),
        Err(e) => string_to_ptr(format!("ERROR: {}", e)),
    }
}

#[no_mangle]
pub extern "C" fn crypto_hash_keyed(algo: *const c_char, json_args: *const c_char) -> *mut c_char {
    let algo_str = ptr_to_string(algo);
    let args_str = ptr_to_string(json_args);
    
    let args: serde_json::Value = match serde_json::from_str(&args_str) {
        Ok(v) => v,
        Err(_) => return string_to_ptr("ERROR: Invalid JSON".to_string()),
    };
    
    let key = args["key"].as_str().unwrap_or("");
    let message = args["message"].as_str().unwrap_or("");
    
    match crypto_impl::hash_keyed(&algo_str, key, message) {
        Ok(s) => string_to_ptr(s),
        Err(e) => string_to_ptr(format!("ERROR: {}", e)),
    }
}

#[no_mangle]
pub extern "C" fn crypto_compare(a: *const c_char, b: *const c_char) -> bool {
    let a_str = ptr_to_string(a);
    let b_str = ptr_to_string(b);
    crypto_impl::compare(&a_str, &b_str)
}


// --- OS ---
#[no_mangle]
pub extern "C" fn os_info() -> *mut c_char {
    let info = serde_json::json!({
        "platform": std::env::consts::OS,
        "cpus": std::thread::available_parallelism().map(|n| n.get()).unwrap_or(1),
        // sys-info = "0.9"
        "totalMemory": sys_info::mem_info().map(|m| m.total * 1024).unwrap_or(0),
        "freeMemory": sys_info::mem_info().map(|m| m.free * 1024).unwrap_or(0),
        "tempDir": std::env::temp_dir(),
    });
    string_to_ptr(info.to_string())
}

// --- Net ---
#[no_mangle]
pub extern "C" fn net_resolve(hostname: *const c_char) -> *mut c_char {
    let host = ptr_to_string(hostname);
    // dns-lookup crate
    match dns_lookup::lookup_host(&host) {
        Ok(ips) => {
             let ip_strs: Vec<String> = ips.iter().map(|ip| ip.to_string()).collect();
             string_to_ptr(serde_json::to_string(&ip_strs).unwrap_or("[]".into()))
        },
        Err(_) => string_to_ptr("[]".to_string()),
    }
}

#[no_mangle]
pub extern "C" fn net_ip() -> *mut c_char {
    // local-ip-address crate
    use local_ip_address::local_ip;
    match local_ip() {
        Ok(ip) => string_to_ptr(ip.to_string()),
        Err(_) => string_to_ptr("127.0.0.1".to_string()),
    }
}

// --- Time ---
#[no_mangle]
pub extern "C" fn time_sleep(ms: f64) {
    thread::sleep(Duration::from_millis(ms as u64));
}

// --- Local Storage (THE FIX) ---

#[no_mangle]
pub extern "C" fn ls_get(key: *const c_char) -> *mut c_char {
    let key_str = ptr_to_string(key);
    match storage_impl::ls_get(&key_str) {
        Some(val) => string_to_ptr(safe_string(val.as_bytes())),
        None => string_to_ptr(String::new()),
    }
}

#[no_mangle]
pub extern "C" fn ls_set(key: *const c_char, value: *const c_char) {
    let key_str = ptr_to_string(key);
    let val_str = ptr_to_string(value);
    let _ = storage_impl::ls_set(&key_str, &val_str);
}

#[no_mangle]
pub extern "C" fn ls_remove(key: *const c_char) {
    let key_str = ptr_to_string(key);
    let _ = storage_impl::ls_remove(&key_str);
}

#[no_mangle]
pub extern "C" fn ls_clear() {
    let _ = storage_impl::ls_clear();
}

#[no_mangle]
pub extern "C" fn ls_keys() -> *mut c_char {
    match storage_impl::ls_keys() {
        Ok(keys) => {
            let json = serde_json::to_string(&keys).unwrap_or("[]".to_string());
            string_to_ptr(json)
        },
        Err(_) => string_to_ptr("[]".to_string()),
    }
}

// --- Sessions ---

#[no_mangle]
pub extern "C" fn session_get(sid: *const c_char, key: *const c_char) -> *mut c_char {
    let sid_str = ptr_to_string(sid);
    let key_str = ptr_to_string(key);
    match storage_impl::session_get(&sid_str, &key_str) {
        Some(v) => string_to_ptr(v),
        None => string_to_ptr(String::new()),
    }
}

#[no_mangle]
pub extern "C" fn session_set(sid: *const c_char, key: *const c_char) { // Value?
    // Wait, titan.json says session_set(string, string). 
    // And storage_impl::session_set takes (sid, key, value). 
    // titan.json signatures are limited to 2 args in the user's snippet?
    // "session_set": parameters: ["string", "string"].
    // But index.js says: native_session_set(sessionId, JSON.stringify({ key, value }))
    // Ah! It packs key and value into the second argument.
    // So I need to unpack it here.
    let sid_str = ptr_to_string(sid);
    let args_str = ptr_to_string(key); // This is actually the "packed" arg
    
    // BUT! index.js line 360: native_session_set(sessionId, JSON.stringify({ key, value }))
    // So Rust needs to parse that JSON.
    
    if let Ok(json) = serde_json::from_str::<serde_json::Value>(&args_str) {
        let real_key = json["key"].as_str().unwrap_or("");
        let real_val = json["value"].as_str().unwrap_or("");
        let _ = storage_impl::session_set(&sid_str, real_key, real_val);
    }
}

#[no_mangle]
pub extern "C" fn session_delete(sid: *const c_char, key: *const c_char) {
    let sid_str = ptr_to_string(sid);
    let key_str = ptr_to_string(key);
    let _ = storage_impl::session_delete(&sid_str, &key_str);
}

#[no_mangle]
pub extern "C" fn session_clear(sid: *const c_char) {
    let sid_str = ptr_to_string(sid);
    let _ = storage_impl::session_clear(&sid_str);
}

// --- TITAN ABI: Unified JSON Export ---
// All native calls pass through this single entry point.
// Request: { "function": "fn_name", "params": [...args] }
// Response: any JSON value

#[no_mangle]
pub extern "C" fn titan_export(request_json: *const c_char) -> *const c_char {
    let request_str = ptr_to_string(request_json);
    let request: serde_json::Value = match serde_json::from_str(&request_str) {
        Ok(v) => v,
        Err(_) => return string_to_ptr(serde_json::json!({"error": "Invalid request JSON"}).to_string()),
    };

    let function = request["function"].as_str().unwrap_or("");
    let params = request["params"].as_array();

    let res = match function {

        // ── File System ──────────────────────────────────────────────────
        "fs_read_file" => {
            let path = params.and_then(|p| p.get(0)).and_then(|v| v.as_str()).unwrap_or("");
            match std::fs::read(path) {
                Ok(bytes) => serde_json::json!(String::from_utf8_lossy(&bytes).to_string()),
                Err(e)    => serde_json::json!(format!("ERROR: {}", e)),
            }
        },
        "fs_write_file" => {
            let path    = params.and_then(|p| p.get(0)).and_then(|v| v.as_str()).unwrap_or("");
            let content = params.and_then(|p| p.get(1)).and_then(|v| v.as_str()).unwrap_or("");
            match std::fs::write(path, content) {
                Ok(_)  => serde_json::json!(true),
                Err(e) => serde_json::json!(format!("ERROR: {}", e)),
            }
        },
        "fs_exists" => {
            let path = params.and_then(|p| p.get(0)).and_then(|v| v.as_str()).unwrap_or("");
            serde_json::json!(std::path::Path::new(path).exists())
        },
        "fs_readdir" => {
            let path = params.and_then(|p| p.get(0)).and_then(|v| v.as_str()).unwrap_or("");
            match std::fs::read_dir(path) {
                Ok(entries) => {
                    let files: Vec<String> = entries
                        .filter_map(|e| e.ok().and_then(|e| e.file_name().into_string().ok()))
                        .collect();
                    serde_json::json!(files)
                },
                Err(e) => serde_json::json!(format!("ERROR: {}", e)),
            }
        },
        "fs_mkdir" => {
            let path = params.and_then(|p| p.get(0)).and_then(|v| v.as_str()).unwrap_or("");
            match std::fs::create_dir_all(path) {
                Ok(_)  => serde_json::json!(true),
                Err(e) => serde_json::json!(format!("ERROR: {}", e)),
            }
        },
        "fs_stat" => {
            let path = params.and_then(|p| p.get(0)).and_then(|v| v.as_str()).unwrap_or("");
            match std::fs::metadata(path) {
                Ok(m) => serde_json::json!({
                    "size":     m.len(),
                    "isFile":   m.is_file(),
                    "isDir":    m.is_dir(),
                }),
                Err(e) => serde_json::json!(format!("ERROR: {}", e)),
            }
        },
        "fs_remove" => {
            let path = params.and_then(|p| p.get(0)).and_then(|v| v.as_str()).unwrap_or("");
            let p = std::path::Path::new(path);
            let res = if p.is_dir() { std::fs::remove_dir_all(p) } else { std::fs::remove_file(p) };
            match res {
                Ok(_)  => serde_json::json!(true),
                Err(e) => serde_json::json!(format!("ERROR: {}", e)),
            }
        },
        "fs_read_file_base64" => {
            let path = params
                .and_then(|p| p.get(0))
                .and_then(|v| v.as_str())
                .unwrap_or("");

            match std::fs::read(path) {
                Ok(bytes) => {
                    let base64 = general_purpose::STANDARD.encode(bytes);
                    serde_json::json!(base64)
                }
                Err(e) => {
                    serde_json::json!(format!("ERROR: {}", e))
                }
            }
        },

        // ── Crypto ──────────────────────────────────────────────────────
        "crypto_uuid" => serde_json::json!(uuid::Uuid::new_v4().to_string()),
        "crypto_hash" => {
            let algo = params.and_then(|p| p.get(0)).and_then(|v| v.as_str()).unwrap_or("sha256");
            let data = params.and_then(|p| p.get(1)).and_then(|v| v.as_str()).unwrap_or("");
            serde_json::json!(crypto_impl::hash(algo, data))
        },
        "crypto_random_bytes" => {
            let size = params.and_then(|p| p.get(0)).and_then(|v| v.as_u64()).unwrap_or(32) as usize;
            serde_json::json!(crypto_impl::random_bytes(size))
        },
        "crypto_encrypt" => {
            let algo = params.and_then(|p| p.get(0)).and_then(|v| v.as_str()).unwrap_or("aes-256-gcm");
            let payload_str = params.and_then(|p| p.get(1)).and_then(|v| v.as_str()).unwrap_or("{}");
            let payload: serde_json::Value = serde_json::from_str(payload_str).unwrap_or(serde_json::json!({}));
            let key       = payload["key"].as_str().unwrap_or("");
            let plaintext = payload["plaintext"].as_str().unwrap_or("");
            match crypto_impl::encrypt(algo, key, plaintext) {
                Ok(s)  => serde_json::json!(s),
                Err(e) => serde_json::json!(format!("ERROR: {}", e)),
            }
        },
        "crypto_decrypt" => {
            let algo = params.and_then(|p| p.get(0)).and_then(|v| v.as_str()).unwrap_or("aes-256-gcm");
            let payload_str = params.and_then(|p| p.get(1)).and_then(|v| v.as_str()).unwrap_or("{}");
            let payload: serde_json::Value = serde_json::from_str(payload_str).unwrap_or(serde_json::json!({}));
            let key        = payload["key"].as_str().unwrap_or("");
            let ciphertext = payload["ciphertext"].as_str().unwrap_or("");
            match crypto_impl::decrypt(algo, key, ciphertext) {
                Ok(bytes) => serde_json::json!(String::from_utf8_lossy(&bytes).to_string()),
                Err(e)    => serde_json::json!(format!("ERROR: {}", e)),
            }
        },
        "crypto_hash_keyed" => {
            let algo = params.and_then(|p| p.get(0)).and_then(|v| v.as_str()).unwrap_or("sha256");
            let payload_str = params.and_then(|p| p.get(1)).and_then(|v| v.as_str()).unwrap_or("{}");
            let payload: serde_json::Value = serde_json::from_str(payload_str).unwrap_or(serde_json::json!({}));
            let key     = payload["key"].as_str().unwrap_or("");
            let message = payload["message"].as_str().unwrap_or("");
            match crypto_impl::hash_keyed(algo, key, message) {
                Ok(s)  => serde_json::json!(s),
                Err(e) => serde_json::json!(format!("ERROR: {}", e)),
            }
        },
        "crypto_compare" => {
            let a = params.and_then(|p| p.get(0)).and_then(|v| v.as_str()).unwrap_or("");
            let b = params.and_then(|p| p.get(1)).and_then(|v| v.as_str()).unwrap_or("");
            serde_json::json!(crypto_impl::compare(a, b))
        },

        // ── Local Storage ───────────────────────────────────────────────
        "ls_get" => {
            let key = params.and_then(|p| p.get(0)).and_then(|v| v.as_str()).unwrap_or("");
            serde_json::json!(storage_impl::ls_get(key))
        },
        "ls_set" => {
            let key   = params.and_then(|p| p.get(0)).and_then(|v| v.as_str()).unwrap_or("");
            let value = params.and_then(|p| p.get(1)).and_then(|v| v.as_str()).unwrap_or("");
            storage_impl::ls_set(key, value);
            serde_json::json!(true)
        },
        "ls_remove" => {
            let key = params.and_then(|p| p.get(0)).and_then(|v| v.as_str()).unwrap_or("");
            storage_impl::ls_remove(key);
            serde_json::json!(true)
        },
        "ls_clear" => { storage_impl::ls_clear(); serde_json::json!(true) },
        "ls_keys" => serde_json::json!(storage_impl::ls_keys()),
        "serialize" => {
             serde_json::json!({"error": "Native V8 serialization requires engine-level built-ins. Please update titan-server."})
        },
        "deserialize" => {
             serde_json::json!({"error": "Native V8 deserialization requires engine-level built-ins. Please update titan-server."})
        },

        // ── Sessions ────────────────────────────────────────────────────
        "session_get" => {
            let sid = params.and_then(|p| p.get(0)).and_then(|v| v.as_str()).unwrap_or("");
            let key = params.and_then(|p| p.get(1)).and_then(|v| v.as_str()).unwrap_or("");
            serde_json::json!(storage_impl::session_get(sid, key))
        },
        "session_set" => {
            let sid   = params.and_then(|p| p.get(0)).and_then(|v| v.as_str()).unwrap_or("");
            let key   = params.and_then(|p| p.get(1)).and_then(|v| v.as_str()).unwrap_or("");
            let value = params.and_then(|p| p.get(2)).and_then(|v| v.as_str()).unwrap_or("");
            storage_impl::session_set(sid, key, value);
            serde_json::json!(true)
        },
        "session_delete" => {
            let sid = params.and_then(|p| p.get(0)).and_then(|v| v.as_str()).unwrap_or("");
            let key = params.and_then(|p| p.get(1)).and_then(|v| v.as_str()).unwrap_or("");
            storage_impl::session_delete(sid, key);
            serde_json::json!(true)
        },
        "session_clear" => {
            let sid = params.and_then(|p| p.get(0)).and_then(|v| v.as_str()).unwrap_or("");
            storage_impl::session_clear(sid);
            serde_json::json!(true)
        },

        // ── System / OS ─────────────────────────────────────────────────
        "os_info" => {
            serde_json::json!({
                "platform":    std::env::consts::OS,
                "arch":        std::env::consts::ARCH,
                "cpus":        thread::available_parallelism().map(|n| n.get()).unwrap_or(1),
                "totalMemory": sys_info::mem_info().map(|m| m.total * 1024).unwrap_or(0),
                "freeMemory":  sys_info::mem_info().map(|m| m.free  * 1024).unwrap_or(0),
                "tempDir":     std::env::temp_dir().to_string_lossy().to_string(),
            })
        },
        "proc_info" => {
            serde_json::json!({
                "pid":    std::process::id(),
                "uptime": 0,
            })
        },
        "path_cwd" => {
            serde_json::json!(std::env::current_dir()
                .map(|p| p.to_string_lossy().to_string())
                .unwrap_or_default())
        },
        "net_resolve" => {
            let host = params.and_then(|p| p.get(0)).and_then(|v| v.as_str()).unwrap_or("");
            use std::net::ToSocketAddrs;
            match (host, 80u16).to_socket_addrs() {
                Ok(mut addrs) => serde_json::json!(addrs.next().map(|a| a.ip().to_string())),
                Err(_)        => serde_json::json!(null),
            }
        },

        _ => serde_json::json!({"error": format!("Function '{}' not found in @titanpl/core", function)}),
    };

    string_to_ptr(res.to_string())
}
