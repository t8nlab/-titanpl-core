// =============================================================================
//  @titanpl/core — Module Type Definitions
//  The official Core Standard Library for Titan Planet
//  Version: 3.0.x
//  Repository: https://github.com/ezet-galaxy/-titanpl-core
// =============================================================================

/// <reference path="./globals.d.ts" />

// =============================================================================
//  ESM Named Exports
//  Usage: import { fs, crypto, response } from '@titanpl/core';
// =============================================================================

/**
 * # File System Module
 *
 * Native file operations backed by Rust. All methods are **synchronous**.
 *
 * **Methods:**
 * - `readFile(path)` — Read file as UTF-8 string
 * - `writeFile(path, content)` — Write string to file
 * - `readdir(path)` — List directory contents
 * - `mkdir(path)` — Create directory (recursive)
 * - `exists(path)` — Check if path exists
 * - `stat(path)` — Get file metadata
 * - `remove(path)` — Delete file or directory
 *
 * @example
 * ```js
 * import { fs } from '@titanpl/core';
 *
 * // Read and parse JSON
 * const config = JSON.parse(fs.readFile("./config.json"));
 *
 * // Write data
 * fs.writeFile("./output.json", JSON.stringify(data, null, 2));
 *
 * // Check existence
 * if (fs.exists("./cache")) {
 *     const files = fs.readdir("./cache");
 * }
 * ```
 *
 * @see https://github.com/ezet-galaxy/-titanpl-core#fs-file-system
 */
export declare const fs: TitanCore.FileSystem;

/**
 * # Path Module
 *
 * Cross-platform path manipulation utilities. All methods are **synchronous**.
 *
 * **Methods:**
 * - `join(...parts)` — Join path segments
 * - `resolve(...parts)` — Resolve to absolute path
 * - `dirname(path)` — Get directory name
 * - `basename(path)` — Get file name
 * - `extname(path)` — Get file extension
 *
 * @example
 * ```js
 * import { path } from '@titanpl/core';
 *
 * const configPath = path.join("app", "config", "settings.json");
 * const absolute = path.resolve("./data", "users.db");
 *
 * path.dirname("/var/log/app.log");  // → "/var/log"
 * path.basename("/var/log/app.log"); // → "app.log"
 * path.extname("photo.png");         // → ".png"
 * ```
 *
 * @see https://github.com/ezet-galaxy/-titanpl-core#path-path-manipulation
 */
export declare const path: TitanCore.Path;

/**
 * # Cryptography Module
 *
 * Cryptographic utilities powered by native Rust. All methods are **synchronous**.
 *
 * **Methods:**
 * - `hash(algo, data)` — Hash data (sha256, sha512, md5)
 * - `randomBytes(size)` — Generate random bytes (hex)
 * - `uuid()` — Generate UUID v4
 * - `compare(a, b)` — Constant-time comparison
 * - `base64.encode(str)` / `base64.decode(str)` — Base64 utilities
 * - `encrypt(algo, key, plaintext)` — AES-256-GCM encrypt
 * - `decrypt(algo, key, ciphertext)` — AES-256-GCM decrypt
 * - `hashKeyed(algo, key, message)` — HMAC signing
 *
 * @example
 * ```js
 * import { crypto } from '@titanpl/core';
 *
 * // Generate identifiers
 * const id = crypto.uuid();
 * const token = crypto.randomBytes(32);
 *
 * // Hash and verify
 * const hash = crypto.hash("sha256", password + salt);
 * const isValid = crypto.compare(storedHash, hash);
 *
 * // Base64 encoding
 * const encoded = crypto.base64.encode("Hello World");
 * const decoded = crypto.base64.decode(encoded);
 *
 * // HMAC for webhooks
 * const signature = crypto.hashKeyed("hmac-sha256", secret, payload);
 *
 * // Encryption
 * const encrypted = crypto.encrypt("aes-256-gcm", key, "secret");
 * const decrypted = crypto.decrypt("aes-256-gcm", key, encrypted);
 * ```
 *
 * @see https://github.com/ezet-galaxy/-titanpl-core#crypto-cryptography
 */
export declare const crypto: TitanCore.Crypto;

/**
 * # Operating System Module
 *
 * System information about the host machine. All methods are **synchronous**.
 *
 * **Methods:**
 * - `platform()` — OS identifier ("linux", "darwin", "windows")
 * - `cpus()` — Number of CPU cores
 * - `totalMemory()` — Total RAM in bytes
 * - `freeMemory()` — Available RAM in bytes
 * - `tmpdir()` — Temporary directory path
 *
 * @example
 * ```js
 * import { os } from '@titanpl/core';
 *
 * console.log({
 *     platform: os.platform(),
 *     cpus: os.cpus(),
 *     totalMemory: os.totalMemory() / (1024 ** 3) + " GB",
 *     freeMemory: os.freeMemory() / (1024 ** 3) + " GB",
 *     tmpdir: os.tmpdir()
 * });
 * ```
 *
 * @see https://github.com/ezet-galaxy/-titanpl-core#os-operating-system
 */
export declare const os: TitanCore.OS;

/**
 * # Network Module
 *
 * Network utilities for DNS and IP operations. All methods are **synchronous**.
 *
 * **Methods:**
 * - `resolveDNS(hostname)` — Resolve hostname to IPs
 * - `ip()` — Get local IP address
 * - `ping(host)` — Check if host is reachable
 *
 * @example
 * ```js
 * import { net } from '@titanpl/core';
 *
 * const ips = net.resolveDNS("github.com");
 * const localIp = net.ip();
 * const reachable = net.ping("8.8.8.8");
 * ```
 *
 * @see https://github.com/ezet-galaxy/-titanpl-core#net-network
 */
export declare const net: TitanCore.Net;

/**
 * # Process Module
 *
 * Runtime process information and subprocess management.
 * All methods are **synchronous**.
 *
 * **Methods:**
 * - `pid()` — Process ID
 * - `uptime()` — Uptime in seconds
 * - `memory()` — Memory usage stats
 * - `run(cmd, args, cwd)` — Spawn subprocess
 * - `kill(pid)` — Terminate process
 * - `list()` — List running processes
 *
 * @example
 * ```js
 * import { proc } from '@titanpl/core';
 *
 * console.log({
 *     pid: proc.pid(),
 *     uptime: proc.uptime() + " seconds",
 *     memory: proc.memory()
 * });
 *
 * // Spawn subprocess
 * const result = proc.run("node", ["script.js"], "./scripts");
 * if (result.ok) {
 *     console.log("Spawned PID:", result.pid);
 * }
 * ```
 *
 * @see https://github.com/ezet-galaxy/-titanpl-core#proc-process
 */
export declare const proc: TitanCore.Process;

/**
 * # Time Module
 *
 * Time utilities including sleep, timestamps, and timing.
 * All methods are **synchronous**.
 *
 * **Methods:**
 * - `now()` — Current timestamp in milliseconds
 * - `timestamp()` — ISO 8601 timestamp string
 * - `sleep(ms)` — Blocking sleep
 *
 * @example
 * ```js
 * import { time } from '@titanpl/core';
 *
 * // Measure execution time
 * const start = time.now();
 * performOperation();
 * console.log(`Took ${time.now() - start}ms`);
 *
 * // Get ISO timestamp
 * const ts = time.timestamp();
 * // → "2026-01-15T12:30:45.123Z"
 *
 * // Rate limiting
 * time.sleep(100); // Wait 100ms
 * ```
 *
 * @see https://github.com/ezet-galaxy/-titanpl-core#time-time
 */
export declare const time: TitanCore.Time;

/**
 * # URL Module
 *
 * URL parsing, formatting, and query string manipulation.
 * All methods are **synchronous**.
 *
 * **Methods:**
 * - `parse(url)` — Parse URL to components
 * - `format(urlObj)` — Build URL from components
 * - `SearchParams` — Query string class
 *
 * @example
 * ```js
 * import { url } from '@titanpl/core';
 *
 * // Parse URL
 * const parsed = url.parse("https://api.example.com:8080/users?page=2");
 * // → { protocol: "https:", hostname: "api.example.com", ... }
 *
 * // Build URL
 * const built = url.format({
 *     protocol: "https:",
 *     hostname: "api.example.com",
 *     pathname: "/v2/users"
 * });
 *
 * // Query strings
 * const params = new url.SearchParams({ page: "1", limit: "20" });
 * params.set("sort", "name");
 * console.log(params.toString()); // → "page=1&limit=20&sort=name"
 * ```
 *
 * @see https://github.com/ezet-galaxy/-titanpl-core#url-url
 */
export declare const url: TitanCore.URLModule;

/**
 * # Buffer Module
 *
 * Binary data encoding and decoding utilities. All methods are **synchronous**.
 *
 * **Methods:**
 * - `toBase64(data)` / `fromBase64(str)` — Base64 encoding
 * - `toHex(data)` / `fromHex(str)` — Hex encoding
 * - `toUtf8(bytes)` / `fromUtf8(str)` — UTF-8 encoding
 *
 * @example
 * ```js
 * import { buffer } from '@titanpl/core';
 *
 * // Base64
 * const b64 = buffer.toBase64("Hello, World!");
 * const decoded = buffer.toUtf8(buffer.fromBase64(b64));
 *
 * // Hex
 * const hex = buffer.toHex("Hello");
 * // → "48656c6c6f"
 * ```
 *
 * @see https://github.com/ezet-galaxy/-titanpl-core#buffer-buffer-utilities
 */
export declare const buffer: TitanCore.BufferModule;

/**
 * # Local Storage Module
 *
 * High-performance in-memory key-value store. All methods are **synchronous**.
 *
 * **Performance:** ~150,000+ ops/sec (native Rust RwLock<HashMap>)
 *
 * **Methods:**
 * - `get(key)` / `set(key, value)` — String storage
 * - `getObject(key)` / `setObject(key, value)` — Complex object storage
 * - `remove(key)` / `clear()` — Deletion
 * - `keys()` — List all keys
 * - `serialize(value)` / `deserialize(bytes)` — V8 serialization
 *
 * @example
 * ```js
 * import { ls } from '@titanpl/core';
 *
 * // String storage
 * ls.set("user:123", JSON.stringify({ name: "Alice" }));
 * const user = JSON.parse(ls.get("user:123") || "{}");
 *
 * // Complex objects (preserves Map, Set, Date)
 * const data = {
 *     users: new Map([["alice", { role: "admin" }]]),
 *     tags: new Set(["active"]),
 *     created: new Date()
 * };
 * ls.setObject("session", data);
 * const restored = ls.getObject("session");
 * // restored.users instanceof Map → true
 *
 * // Cleanup
 * ls.remove("user:123");
 * ls.clear();
 * ```
 *
 * @see https://github.com/ezet-galaxy/-titanpl-core#ls--localstorage-persistent-storage
 */
export declare const ls: TitanCore.LocalStorage;

/**
 * # Local Storage Module (Alias)
 *
 * Alias for `ls` — same high-performance key-value store.
 *
 * @see {@link ls}
 * @see https://github.com/ezet-galaxy/-titanpl-core#ls--localstorage-persistent-storage
 */
export declare const localStorage: TitanCore.LocalStorage;

/**
 * # Session Module
 *
 * Server-side session state management. All methods are **synchronous**.
 *
 * Uses composite keys (`{sessionId}:{key}`) for session isolation.
 *
 * **Methods:**
 * - `get(sessionId, key)` — Get session value
 * - `set(sessionId, key, value)` — Set session value
 * - `delete(sessionId, key)` — Delete session key
 * - `clear(sessionId)` — Clear entire session
 *
 * @example
 * ```js
 * import { session, crypto, cookies } from '@titanpl/core';
 *
 * export function handleRequest(req) {
 *     // Get or create session ID
 *     let sessionId = cookies.get(req, "sid");
 *     if (!sessionId) {
 *         sessionId = crypto.uuid();
 *         cookies.set(req, "sid", sessionId, { httpOnly: true });
 *     }
 *
 *     // Store user data
 *     session.set(sessionId, "userId", "123");
 *     session.set(sessionId, "cart", JSON.stringify([1, 2, 3]));
 *
 *     // Retrieve data
 *     const cart = JSON.parse(session.get(sessionId, "cart") || "[]");
 *
 *     // Logout
 *     session.clear(sessionId);
 * }
 * ```
 *
 * @see https://github.com/ezet-galaxy/-titanpl-core#session-server-side-sessions
 */
export declare const session: TitanCore.Session;

/**
 * # Cookies Module
 *
 * HTTP cookie parsing and setting utilities.
 *
 * **Methods:**
 * - `get(req, name)` — Read cookie from request
 * - `set(res, name, value, options)` — Set cookie on response
 * - `delete(res, name)` — Delete cookie
 *
 * **Options:** `httpOnly`, `secure`, `sameSite`, `maxAge`, `path`
 *
 * @example
 * ```js
 * import { cookies, crypto } from '@titanpl/core';
 *
 * export function auth(req) {
 *     // Read cookie
 *     const token = cookies.get(req, "auth_token");
 *
 *     if (!token) {
 *         // Set secure cookie
 *         cookies.set(req, "auth_token", crypto.uuid(), {
 *             httpOnly: true,
 *             secure: true,
 *             sameSite: "Strict",
 *             maxAge: 86400 * 7, // 7 days
 *             path: "/"
 *         });
 *     }
 *
 *     // Delete cookie (logout)
 *     cookies.delete(req, "auth_token");
 * }
 * ```
 *
 * @see https://github.com/ezet-galaxy/-titanpl-core#cookies-http-cookies
 */
export declare const cookies: TitanCore.Cookies;

/**
 * # Response Module
 *
 * HTTP response builder for controlled response formatting.
 * Supports both object-based and positional argument signatures.
 *
 * **Methods:**
 * - `response(body, status?, headers?)` — Custom response
 * - `response.json(data, status?, headers?)` — JSON response
 * - `response.html(content, status?, headers?)` — HTML response
 * - `response.text(content, status?, headers?)` — Plain text response
 * - `response.redirect(url, status?, headers?)` — Redirect response
 * - `response.empty(status?, headers?)` — Empty response (204)
 * - `response.binary(bytes, type?, headers?)` — Binary response
 *
 * @example
 * ```js
 * import { response, fs } from '@titanpl/core';
 *
 * // JSON response (Positional)
 * export function getUsers(req) {
 *     return response.json({ users: [] }, 200, { "Cache-Control": "max-age=60" });
 * }
 *
 * // Error response (Object-based)
 * export function notFound(req) {
 *     return response.json({ error: "Not found" }, { status: 404 });
 * }
 *
 * // HTML response
 * export function home(req) {
 *     const html = fs.readFile("./views/index.html");
 *     return response.html(html);
 * }
 *
 * // Redirect
 * export function legacy(req) {
 *     return response.redirect("/api/v2/users", 301);
 * }
 * ```
 *
 * @see https://titan-docs-ez.vercel.app/docs/04-runtime-apis
 */
export declare const response: TitanCore.ResponseModule;

/**
 * # Core Module
 *
 * Unified namespace providing access to all @titanpl/core APIs.
 * Useful for destructuring multiple modules at once.
 *
 * @example
 * ```js
 * import { core } from '@titanpl/core';
 *
 * // Destructure what you need
 * const { fs, crypto, os, response } = core;
 *
 * // Or access directly
 * const config = JSON.parse(core.fs.readFile("./config.json"));
 * const id = core.crypto.uuid();
 * ```
 *
 * @see https://github.com/ezet-galaxy/-titanpl-core
 */
export declare const core: TitanCore.Core;