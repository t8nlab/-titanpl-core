// =============================================================================
//  @titanpl/core — Global Type Declarations
//  The official Core Standard Library for Titan Planet
//  Version: 2.x
//  Repository: https://github.com/ezet-galaxy/-titanpl-core
// =============================================================================

// =============================================================================
//  Native Rust Bindings (Internal)
//  These are low-level bindings used internally by the JS implementation
// =============================================================================
declare var fs_read_file: any;
declare var fs_write_file: any;
declare var fs_readdir: any;
declare var fs_mkdir: any;
declare var fs_exists: any;
declare var fs_stat: any;
declare var fs_remove: any;
declare var path_cwd: any;
declare var crypto_hash: any;
declare var crypto_random_bytes: any;
declare var crypto_uuid: any;
declare var os_info: any;
declare var net_resolve: any;
declare var net_ip: any;
declare var proc_info: any;
declare var proc_run: any;
declare var proc_kill: any;
declare var proc_list: any;
declare var time_sleep: any;

// =============================================================================
//  Global Declarations
//  Uses `declare global` for proper declaration merging with TitanRuntimeUtils
// =============================================================================
declare global {
    // =========================================================================
    //  TitanCore Namespace
    //  Contains all type definitions for the core standard library modules
    // =========================================================================
    namespace TitanCore {
        // =====================================================================
        //  Core Interface — Unified Access Point
        // =====================================================================

        /**
         * # Core Module
         *
         * Unified access point to all `@titanpl/core` standard library APIs.
         * Access via `t.core` for namespaced organization.
         *
         * @example
         * ```js
         * // Destructure what you need
         * const { fs, crypto, os } = t.core;
         *
         * // Read config and generate secure ID
         * const config = JSON.parse(fs.readFile("./config.json"));
         * const requestId = crypto.uuid();
         * ```
         *
         * @see https://github.com/ezet-galaxy/-titanpl-core
         */
        interface Core {
            /** File System operations */
            fs: FileSystem;
            /** Path manipulation utilities */
            path: Path;
            /** Cryptographic functions */
            crypto: Crypto;
            /** Operating System information */
            os: OS;
            /** Network utilities */
            net: Net;
            /** Process management */
            proc: Process;
            /** Time utilities */
            time: Time;
            /** URL parsing and formatting */
            url: URLModule;
            /** Binary data encoding/decoding */
            buffer: BufferModule;
            /** Key-value local storage */
            ls: LocalStorage;
            /** Session state management */
            session: Session;
            /** HTTP cookie utilities */
            cookies: Cookies;
            /** HTTP response builder */
            response: ResponseModule;
        }

        // =====================================================================
        //  File System Module
        // =====================================================================

        /**
         * # File System API
         *
         * Native file operations backed by Rust. All methods are **synchronous**
         * for maximum performance in the Titan runtime — no `drift()` needed.
         *
         * **Performance:** Native Rust I/O with zero-copy where possible.
         *
         * @example
         * ```js
         * // Read and parse JSON config
         * const raw = t.fs.readFile("./config.json");
         * const config = JSON.parse(raw);
         *
         * // Write data to file
         * t.fs.writeFile("./output.json", JSON.stringify(data, null, 2));
         *
         * // Check existence before operations
         * if (t.fs.exists("./cache")) {
         *     const files = t.fs.readdir("./cache");
         *     t.log("Cache files:", files);
         * }
         *
         * // Get file metadata
         * const stats = t.fs.stat("./data.db");
         * t.log(`Size: ${stats.size} bytes, Modified: ${stats.modified}`);
         * ```
         *
         * @see https://github.com/ezet-galaxy/-titanpl-core#fs-file-system
         */
        interface FileSystem {
            /**
             * Read the entire contents of a file as a UTF-8 string.
             *
             * @param path - Absolute or relative path to the file
             * @returns File contents as UTF-8 string
             * @throws If the file does not exist or cannot be read
             *
             * @example
             * ```js
             * const content = t.fs.readFile("./data/users.json");
             * const users = JSON.parse(content);
             * ```
             */
            readFile(path: string): string;

            /**
             * Read the entire contents of a file as a Base64-encoded string.
             *
             * This is useful when you need to move binary file contents through
             * JSON, embed assets in data URLs, or store file data in systems that
             * expect plain strings.
             *
             * @param path - Absolute or relative path to the file
             * @returns File contents encoded as Base64
             * @throws If the file does not exist or cannot be read
             *
             * @example
             * ```js
             * const logoBase64 = t.fs.readFileBase64("./public/logo.png");
             *
             * return t.response.json({
             *     name: "logo.png",
             *     dataUrl: `data:image/png;base64,${logoBase64}`
             * });
             * ```
             */
            readFileBase64(path: string): string;

            /**
             * Read the entire contents of a file as raw binary bytes.
             *
             * Returns a `Uint8Array`, which is ideal for file downloads, hashing,
             * image processing, or passing binary data to `t.response.binary()`.
             *
             * @param path - Absolute or relative path to the file
             * @returns File contents as `Uint8Array`
             * @throws If the file does not exist or cannot be read
             *
             * @example
             * ```js
             * const pdfBytes = t.fs.readFileBinary("./files/report.pdf");
             * const checksum = t.crypto.hash("sha256", t.buffer.toHex(pdfBytes));
             *
             * t.log("PDF size:", pdfBytes.length);
             * t.log("Checksum:", checksum);
             * ```
             */
            readFileBinary(path: string): Uint8Array;

            /**
             * Write string content to a file, creating or overwriting it.
             *
             * Parent directories are **not** created automatically —
             * use `mkdir()` first if needed.
             *
             * @param path - Target file path
             * @param content - String content to write (UTF-8 encoded)
             *
             * @example
             * ```js
             * const data = { users: [], timestamp: Date.now() };
             * t.fs.writeFile("./output.json", JSON.stringify(data, null, 2));
             * ```
             */
            writeFile(path: string, content: string): void;

            /**
             * Write binary content to a file, creating or overwriting it.
             *
             * Use this when your source data is already in binary form such as a
             * `Uint8Array` from `t.buffer`, `t.fs.readFileBinary()`, or a network
             * response payload.
             *
             * Parent directories are **not** created automatically —
             * use `mkdir()` first if needed.
             *
             * @param path - Target file path
             * @param bytes - Binary content to write
             *
             * @example
             * ```js
             * const avatar = t.fs.readFileBinary("./seed/avatar.png");
             *
             * t.fs.mkdir("./uploads");
             * t.fs.writeFileBinary("./uploads/avatar-copy.png", avatar);
             * ```
             */
            writeFileBinary(path: string, bytes: Uint8Array): void;

            /**
             * List all entries (files and directories) in a directory.
             *
             * @param path - Directory path to list
             * @returns Array of entry names (not full paths)
             * @throws If the directory does not exist
             *
             * @example
             * ```js
             * const entries = t.fs.readdir("./uploads");
             * // → ["image1.png", "document.pdf", "archive"]
             *
             * // Filter by extension
             * const images = entries.filter(f => f.endsWith(".png"));
             * ```
             */
            readdir(path: string): string[];

            /**
             * Create a directory and all parent directories (recursive).
             *
             * No error if the directory already exists.
             *
             * @param path - Directory path to create
             *
             * @example
             * ```js
             * // Creates ./data/cache/temp and all parents
             * t.fs.mkdir("./data/cache/temp");
             * ```
             */
            mkdir(path: string): void;

            /**
             * Check if a file or directory exists at the given path.
             *
             * @param path - Path to check
             * @returns `true` if path exists, `false` otherwise
             *
             * @example
             * ```js
             * if (!t.fs.exists("./config.json")) {
             *     t.fs.writeFile("./config.json", "{}");
             * }
             * ```
             */
            exists(path: string): boolean;

            /**
             * Check whether the given path points to a directory.
             *
             * This is a convenience helper around `fs.stat()` when you only need
             * a boolean answer.
             *
             * @param path - Path to check
             * @returns `true` if the path exists and is a directory
             *
             * @example
             * ```js
             * if (t.fs.isDirectory("./app/actions")) {
             *     const files = t.fs.readdir("./app/actions");
             *     t.log("Action count:", files.length);
             * }
             * ```
             */
            isDirectory(path: string): boolean;

            /**
             * Check whether the given path points to a regular file.
             *
             * This is useful before reading user-provided paths or when filtering
             * directory entries down to files only.
             *
             * @param path - Path to check
             * @returns `true` if the path exists and is a file
             *
             * @example
             * ```js
             * const fullPath = t.path.join("./public", "favicon.ico");
             *
             * if (t.fs.isFile(fullPath)) {
             *     return t.response.binary(t.fs.readFileBinary(fullPath), {
             *         type: "image/x-icon"
             *     });
             * }
             *
             * return t.response.json({ error: "File not found" }, { status: 404 });
             * ```
             */
            isFile(path: string): boolean;

            /**
             * Get metadata/statistics about a file or directory.
             *
             * @param path - Path to stat
             * @returns Statistics object with size, type, and modification time
             * @throws If the path does not exist
             *
             * @example
             * ```js
             * const stats = t.fs.stat("./database.db");
             *
             * if (stats.isFile) {
             *     t.log(`Database size: ${stats.size} bytes`);
             *     t.log(`Last modified: ${new Date(stats.modified)}`);
             * }
             *
             * if (stats.isDir) {
             *     t.log("Path is a directory");
             * }
             * ```
             */
            stat(path: string): Stats;

            /**
             * Remove a file or directory (recursive for directories).
             *
             * **⚠️ Destructive operation** — cannot be undone.
             *
             * @param path - Path to remove
             * @throws If the path does not exist
             *
             * @example
             * ```js
             * // Remove a single file
             * t.fs.remove("./temp.txt");
             *
             * // Remove directory and all contents
             * t.fs.remove("./cache");
             * ```
             */
            remove(path: string): void;
        }

        /**
         * File or directory statistics returned by `fs.stat()`.
         */
        interface Stats {
            /** File size in bytes (0 for directories) */
            size: number;
            /** `true` if the path is a regular file */
            isFile: boolean;
            /** `true` if the path is a directory */
            isDir: boolean;
            /** Entry type reported by the runtime */
            type?: 'file' | 'directory' | string;
            /** Last modification time as Unix timestamp in milliseconds */
            modified: number;
        }

        // =====================================================================
        //  Path Module
        // =====================================================================

        /**
         * # Path API
         *
         * Cross-platform path manipulation utilities.
         * All methods are **synchronous** — no `drift()` needed.
         *
         * Uses the appropriate path separator for the current OS
         * (`/` on Unix, `\` on Windows).
         *
         * @example
         * ```js
         * // Build paths safely
         * const configPath = t.path.join("app", "config", "settings.json");
         * // Unix: "app/config/settings.json"
         * // Windows: "app\\config\\settings.json"
         *
         * // Get absolute path
         * const absolute = t.path.resolve("./data", "users.db");
         * // → "/home/app/data/users.db"
         *
         * // Extract path components
         * const file = "/var/log/app/error.log";
         * t.path.dirname(file);   // → "/var/log/app"
         * t.path.basename(file);  // → "error.log"
         * t.path.extname(file);   // → ".log"
         * ```
         *
         * @see https://github.com/ezet-galaxy/-titanpl-core#path-path-manipulation
         */
        interface Path {
            /**
             * Join multiple path segments into a single normalized path.
             *
             * Handles redundant separators and normalizes `.` and `..` segments.
             *
             * @param args - Two or more path segments to join
             * @returns Joined and normalized path string
             *
             * @example
             * ```js
             * t.path.join("app", "actions", "user.js");
             * // → "app/actions/user.js"
             *
             * t.path.join("/var", "log", "..", "data");
             * // → "/var/data"
             * ```
             */
            join(...args: string[]): string;

            /**
             * Resolve path segments to an absolute path.
             *
             * Processes from right to left, prepending each segment until
             * an absolute path is formed. If no absolute path is reached,
             * the current working directory is prepended.
             *
             * @param args - Path segments to resolve
             * @returns Absolute path string
             *
             * @example
             * ```js
             * // From current working directory
             * t.path.resolve("./config.json");
             * // → "/home/app/config.json"
             *
             * // Absolute path takes precedence
             * t.path.resolve("/etc", "passwd");
             * // → "/etc/passwd"
             * ```
             */
            resolve(...args: string[]): string;

            /**
             * Get the file extension including the leading dot.
             *
             * @param path - File path
             * @returns Extension (e.g., `".json"`, `".tar.gz"`) or empty string
             *
             * @example
             * ```js
             * t.path.extname("photo.png");      // → ".png"
             * t.path.extname("archive.tar.gz"); // → ".gz"
             * t.path.extname("Makefile");       // → ""
             * ```
             */
            extname(path: string): string;

            /**
             * Get the directory portion of a path.
             *
             * @param path - File or directory path
             * @returns Parent directory path
             *
             * @example
             * ```js
             * t.path.dirname("/var/log/app.log");
             * // → "/var/log"
             *
             * t.path.dirname("app/config.json");
             * // → "app"
             * ```
             */
            dirname(path: string): string;

            /**
             * Get the last segment (filename or directory name) of a path.
             *
             * @param path - Path to extract from
             * @returns Final path segment
             *
             * @example
             * ```js
             * t.path.basename("/var/log/app.log");
             * // → "app.log"
             *
             * t.path.basename("/var/log/");
             * // → "log"
             * ```
             */
            basename(path: string): string;
        }

        // =====================================================================
        //  Crypto Module
        // =====================================================================

        /**
         * # Cryptography API
         *
         * Cryptographic utilities powered by native Rust implementations.
         * All methods are **synchronous** — no `drift()` needed.
         *
         * **Security:** Uses constant-time comparisons where appropriate
         * to prevent timing attacks.
         *
         * @example
         * ```js
         * // Generate secure identifiers
         * const id = t.crypto.uuid();
         * const token = t.crypto.randomBytes(32);
         *
         * // Hash data
         * const hash = t.crypto.hash("sha256", "password123");
         *
         * // Secure comparison (timing-attack safe)
         * const isValid = t.crypto.compare(storedHash, computedHash);
         *
         * // Base64 encoding
         * const encoded = t.crypto.base64.encode("Hello World");
         * const decoded = t.crypto.base64.decode(encoded);
         *
         * // HMAC for webhook signatures
         * const signature = t.crypto.hashKeyed(
         *     "hmac-sha256",
         *     process.env.WEBHOOK_SECRET,
         *     JSON.stringify(payload)
         * );
         *
         * // Encryption/Decryption
         * const encrypted = t.crypto.encrypt("aes-256-gcm", key, "secret data");
         * const decrypted = t.crypto.decrypt("aes-256-gcm", key, encrypted);
         * ```
         *
         * @see https://github.com/ezet-galaxy/-titanpl-core#crypto-cryptography
         */
        interface Crypto {
            /**
             * Compute a cryptographic hash of the input data.
             *
             * @param algorithm - Hash algorithm: `"sha256"`, `"sha512"`, or `"md5"`
             * @param data - String data to hash
             * @returns Hex-encoded hash string
             *
             * @example
             * ```js
             * const hash = t.crypto.hash("sha256", "hello world");
             * // → "b94d27b9934d3e08a52e52d7da7dabfac484efe37a5380ee9088f7ace2efcde9"
             *
             * // MD5 (not recommended for security, but useful for checksums)
             * const checksum = t.crypto.hash("md5", fileContent);
             * ```
             */
            hash(algorithm: 'sha256' | 'sha512' | 'md5', data: string): string;

            /**
             * Generate cryptographically secure random bytes.
             *
             * @param size - Number of random bytes to generate
             * @returns Hex-encoded string (length = size × 2)
             *
             * @example
             * ```js
             * // Generate a 256-bit (32-byte) random token
             * const token = t.crypto.randomBytes(32);
             * // → "a1b2c3d4e5f6..." (64 hex characters)
             *
             * // Generate a short verification code
             * const code = t.crypto.randomBytes(4);
             * // → "f7a3b2c1" (8 hex characters)
             * ```
             */
            randomBytes(size: number): string;

            /**
             * Generate a random UUID v4.
             *
             * @returns UUID string in standard format
             *
             * @example
             * ```js
             * const id = t.crypto.uuid();
             * // → "550e8400-e29b-41d4-a716-446655440000"
             *
             * // Use as database primary key
             * const user = { id: t.crypto.uuid(), name: "Alice" };
             * ```
             */
            uuid(): string;

            /**
             * Base64 encoding/decoding utilities.
             *
             * @example
             * ```js
             * // Encode string to Base64
             * const encoded = t.crypto.base64.encode("Hello World");
             * // → "SGVsbG8gV29ybGQ="
             *
             * // Decode Base64 to string
             * const decoded = t.crypto.base64.decode(encoded);
             * // → "Hello World"
             * ```
             */
            base64: {
                /**
                 * Encode a string to Base64.
                 * @param str - String to encode
                 * @returns Base64-encoded string
                 */
                encode(str: string): string;

                /**
                 * Decode a Base64 string.
                 * @param str - Base64-encoded string
                 * @returns Decoded string
                 */
                decode(str: string): string;
            };

            /**
             * Perform a constant-time string comparison.
             *
             * **Security:** Prevents timing attacks by ensuring comparison
             * takes the same time regardless of where strings differ.
             * Always use this for comparing hashes, tokens, or secrets.
             *
             * @param hash - First string (typically the expected/stored value)
             * @param target - Second string (typically the user-provided value)
             * @returns `true` if strings are identical, `false` otherwise
             *
             * @example
             * ```js
             * // Verify a password hash
             * const storedHash = getUserHash(email);
             * const computedHash = t.crypto.hash("sha256", password + salt);
             *
             * if (t.crypto.compare(storedHash, computedHash)) {
             *     return { success: true };
             * }
             *
             * // Verify webhook signature
             * const expected = t.crypto.hashKeyed("hmac-sha256", secret, body);
             * const provided = req.headers["x-signature"];
             *
             * if (!t.crypto.compare(expected, provided)) {
             *     return t.response.json({ error: "Invalid signature" }, 401);
             * }
             * ```
             */
            compare(hash: string, target: string): boolean;

            /**
             * Encrypt plaintext using AES-256-GCM.
             *
             * @param algorithm - Encryption algorithm (use `"aes-256-gcm"`)
             * @param key - 32-byte encryption key
             * @param plaintext - Data to encrypt
             * @returns Base64-encoded ciphertext (includes IV and auth tag)
             *
             * @example
             * ```js
             * const key = process.env.ENCRYPTION_KEY; // 32-byte key
             * const encrypted = t.crypto.encrypt("aes-256-gcm", key, "sensitive data");
             * // Store encrypted value safely
             * ```
             */
            encrypt(algorithm: string, key: string, plaintext: string): string;

            /**
             * Decrypt ciphertext encrypted with AES-256-GCM.
             *
             * @param algorithm - Decryption algorithm (use `"aes-256-gcm"`)
             * @param key - Same 32-byte key used for encryption
             * @param ciphertext - Base64-encoded ciphertext from `encrypt()`
             * @returns Original plaintext string
             * @throws If decryption fails (wrong key, corrupted data, etc.)
             *
             * @example
             * ```js
             * const key = process.env.ENCRYPTION_KEY;
             * const decrypted = t.crypto.decrypt("aes-256-gcm", key, encrypted);
             * // → "sensitive data"
             * ```
             */
            decrypt(algorithm: string, key: string, ciphertext: string): string;

            /**
             * Compute an HMAC (Hash-based Message Authentication Code).
             *
             * Used for message authentication and webhook signature verification.
             *
             * @param algorithm - HMAC algorithm: `"hmac-sha256"` or `"hmac-sha512"`
             * @param key - Secret key for the HMAC
             * @param message - Message to authenticate
             * @returns Hex-encoded HMAC string
             *
             * @example
             * ```js
             * // Sign outgoing webhook
             * const payload = JSON.stringify({ event: "user.created", data: user });
             * const signature = t.crypto.hashKeyed("hmac-sha256", webhookSecret, payload);
             *
             * drift(t.fetch(webhookUrl, {
             *     method: "POST",
             *     headers: {
             *         "Content-Type": "application/json",
             *         "X-Signature": signature
             *     },
             *     body: payload
             * }));
             *
             * // Verify incoming webhook
             * export function webhook(req) {
             *     const expected = t.crypto.hashKeyed(
             *         "hmac-sha256",
             *         process.env.WEBHOOK_SECRET,
             *         JSON.stringify(req.body)
             *     );
             *
             *     if (!t.crypto.compare(expected, req.headers["x-signature"])) {
             *         return t.response.json({ error: "Invalid signature" }, 401);
             *     }
             *
             *     // Process verified webhook...
             * }
             * ```
             */
            hashKeyed(algorithm: 'hmac-sha256' | 'hmac-sha512', key: string, message: string): string;
        }

        // =====================================================================
        //  OS Module
        // =====================================================================

        /**
         * # Operating System API
         *
         * Retrieve system information about the host machine.
         * All methods are **synchronous** — no `drift()` needed.
         *
         * @example
         * ```js
         * export function systemInfo(req) {
         *     return {
         *         platform: t.os.platform(),     // "linux", "darwin", "windows"
         *         cpus: t.os.cpus(),             // 8
         *         totalMemory: t.os.totalMemory(), // 17179869184 (16 GB)
         *         freeMemory: t.os.freeMemory(),   // 8589934592 (8 GB)
         *         tmpdir: t.os.tmpdir()          // "/tmp"
         *     };
         * }
         * ```
         *
         * @see https://github.com/ezet-galaxy/-titanpl-core#os-operating-system
         */
        interface OS {
            /**
             * Get the operating system platform identifier.
             *
             * @returns Platform string: `"linux"`, `"darwin"` (macOS), or `"windows"`
             *
             * @example
             * ```js
             * const platform = t.os.platform();
             *
             * if (platform === "windows") {
             *     // Windows-specific logic
             * }
             * ```
             */
            platform(): string;

            /**
             * Get the number of logical CPU cores.
             *
             * @returns Number of CPU cores available
             *
             * @example
             * ```js
             * const workers = Math.max(1, t.os.cpus() - 1);
             * t.log(`Starting ${workers} worker threads`);
             * ```
             */
            cpus(): number;

            /**
             * Get the total system memory in bytes.
             *
             * @returns Total memory in bytes
             *
             * @example
             * ```js
             * const totalGB = t.os.totalMemory() / (1024 ** 3);
             * t.log(`Total RAM: ${totalGB.toFixed(2)} GB`);
             * ```
             */
            totalMemory(): number;

            /**
             * Get the currently available (free) system memory in bytes.
             *
             * @returns Free memory in bytes
             *
             * @example
             * ```js
             * const freeGB = t.os.freeMemory() / (1024 ** 3);
             * const totalGB = t.os.totalMemory() / (1024 ** 3);
             * const usedPercent = ((1 - freeGB / totalGB) * 100).toFixed(1);
             *
             * t.log(`Memory usage: ${usedPercent}%`);
             * ```
             */
            freeMemory(): number;

            /**
             * Get the path to the system's temporary directory.
             *
             * @returns Temporary directory path
             *
             * @example
             * ```js
             * const tempFile = t.path.join(t.os.tmpdir(), "upload-" + t.crypto.uuid());
             * t.fs.writeFile(tempFile, data);
             * ```
             */
            tmpdir(): string;
        }

        // =====================================================================
        //  Network Module
        // =====================================================================

        /**
         * # Network API
         *
         * Network utilities for DNS resolution and IP lookup.
         * All methods are **synchronous** — no `drift()` needed.
         *
         * @example
         * ```js
         * // Resolve domain to IP addresses
         * const ips = t.net.resolveDNS("google.com");
         * t.log("Google IPs:", ips);
         *
         * // Get local IP
         * const localIp = t.net.ip();
         * t.log("Server IP:", localIp);
         * ```
         *
         * @see https://github.com/ezet-galaxy/-titanpl-core#net-network
         */
        interface Net {
            /**
             * Resolve a hostname to its IP addresses via DNS lookup.
             *
             * @param hostname - Domain name to resolve (e.g., `"example.com"`)
             * @returns Array of IP address strings
             *
             * @example
             * ```js
             * const ips = t.net.resolveDNS("github.com");
             * // → ["140.82.114.3", "140.82.114.4"]
             * ```
             */
            resolveDNS(hostname: string): string[];

            /**
             * Get the local IP address of the server.
             *
             * @returns Local IP address string
             *
             * @example
             * ```js
             * const serverIp = t.net.ip();
             * // → "192.168.1.100"
             * ```
             */
            ip(): string;

            /**
             * Check if a host is reachable.
             *
             * **Note:** Implementation may be limited on some platforms.
             *
             * @param host - Hostname or IP address to ping
             * @returns `true` if host responds, `false` otherwise
             *
             * @example
             * ```js
             * const isReachable = t.net.ping("8.8.8.8");
             * ```
             */
            ping(host: string): boolean;
        }

        // =====================================================================
        //  Process Module
        // =====================================================================

        /**
         * # Process API
         *
         * Runtime process information and subprocess management.
         * All methods are **synchronous** — no `drift()` needed.
         *
         * @example
         * ```js
         * export function processInfo(req) {
         *     return {
         *         pid: t.proc.pid(),
         *         uptime: t.proc.uptime(),
         *         memory: t.proc.memory()
         *     };
         * }
         *
         * // Spawn a subprocess
         * const result = t.proc.run("ls", ["-la"], "./data");
         * t.log("Spawned process:", result.pid);
         * ```
         *
         * @see https://github.com/ezet-galaxy/-titanpl-core#proc-process
         */
        interface Process {
            /**
             * Get the process ID of the Titan server.
             *
             * @returns Numeric process ID
             *
             * @example
             * ```js
             * const pid = t.proc.pid();
             * t.log(`Server running as PID ${pid}`);
             * ```
             */
            pid(): number;

            /**
             * Get the server uptime in seconds.
             *
             * @returns Uptime in seconds since server start
             *
             * @example
             * ```js
             * const uptime = t.proc.uptime();
             * const hours = Math.floor(uptime / 3600);
             * const minutes = Math.floor((uptime % 3600) / 60);
             * t.log(`Uptime: ${hours}h ${minutes}m`);
             * ```
             */
            uptime(): number;

            /**
             * Get memory usage statistics for the server process.
             *
             * @returns Object with memory metrics (rss, heapTotal, heapUsed, etc.)
             *
             * @example
             * ```js
             * const mem = t.proc.memory();
             * t.log(`RSS: ${(mem.rss / 1024 / 1024).toFixed(2)} MB`);
             * ```
             */
            memory(): Record<string, any>;

            /**
             * Spawn a subprocess.
             *
             * @param command - Executable to run
             * @param args - Command-line arguments
             * @param cwd - Working directory (optional)
             * @returns Object with spawn result: `{ ok, pid, cwd }`
             *
             * @example
             * ```js
             * // Run a shell command
             * const result = t.proc.run("node", ["script.js", "--verbose"], "./scripts");
             *
             * if (result.ok) {
             *     t.log(`Spawned process ${result.pid} in ${result.cwd}`);
             * }
             * ```
             */
            run(command: string, args: string[], cwd?: string): {
                /** Whether the process was spawned successfully */
                ok: boolean;
                /** Process ID of the spawned process */
                pid: number;
                /** Working directory of the process */
                cwd: string;
            };

            /**
             * Kill a process by PID.
             *
             * @param pid - Process ID to terminate
             * @returns `true` if the signal was sent successfully
             *
             * @example
             * ```js
             * const killed = t.proc.kill(12345);
             * t.log(killed ? "Process terminated" : "Failed to kill process");
             * ```
             */
            kill(pid: number): boolean;

            /**
             * List running processes.
             *
             * @returns Array of process information objects
             *
             * @example
             * ```js
             * const processes = t.proc.list();
             * processes.forEach(p => {
             *     t.log(`${p.pid}: ${p.name} (${p.cmd})`);
             * });
             * ```
             */
            list(): Array<{
                /** Process ID */
                pid: number;
                /** Process name */
                name: string;
                /** Command line */
                cmd: string;
                /** CPU usage percentage (may be undefined) */
                cpu?: number;
                /** Memory usage in bytes (may be undefined) */
                memory?: number;
            }>;
        }

        // =====================================================================
        //  Time Module
        // =====================================================================

        /**
         * # Time API
         *
         * Time utilities including sleep, timestamps, and high-resolution clock.
         * All methods are **synchronous** — no `drift()` needed.
         *
         * @example
         * ```js
         * // Measure execution time
         * const start = t.time.now();
         * // ... perform operations ...
         * const elapsed = t.time.now() - start;
         * t.log(`Operation took ${elapsed}ms`);
         *
         * // Get ISO timestamp for logging
         * const timestamp = t.time.timestamp();
         * // → "2026-01-15T12:30:45.123Z"
         *
         * // Rate limiting with sleep
         * t.time.sleep(100); // Pause for 100ms
         * ```
         *
         * @see https://github.com/ezet-galaxy/-titanpl-core#time-time
         */
        interface Time {
            /**
             * Pause execution for the specified duration.
             *
             * **Note:** This is a blocking sleep — use sparingly.
             * For non-blocking delays in async contexts, consider
             * `drift(t.time.sleep(ms))` if supported.
             *
             * @param ms - Duration to sleep in milliseconds
             *
             * @example
             * ```js
             * // Simple rate limiting
             * t.time.sleep(100);
             *
             * // Retry with backoff
             * for (let i = 0; i < 3; i++) {
             *     const result = tryOperation();
             *     if (result.ok) break;
             *     t.time.sleep(1000 * Math.pow(2, i)); // 1s, 2s, 4s
             * }
             * ```
             */
            sleep(ms: number): void;

            /**
             * Get the current time as a high-resolution millisecond timestamp.
             *
             * @returns Numeric timestamp in milliseconds (similar to `Date.now()`)
             *
             * @example
             * ```js
             * const start = t.time.now();
             * performExpensiveOperation();
             * const duration = t.time.now() - start;
             * t.log(`Completed in ${duration}ms`);
             * ```
             */
            now(): number;

            /**
             * Get the current time as an ISO 8601 formatted string.
             *
             * @returns ISO timestamp string (e.g., `"2026-01-15T12:30:45.123Z"`)
             *
             * @example
             * ```js
             * const log = {
             *     timestamp: t.time.timestamp(),
             *     level: "info",
             *     message: "Server started"
             * };
             * ```
             */
            timestamp(): string;
        }

        // =====================================================================
        //  URL Module
        // =====================================================================

        /**
         * # URL API
         *
         * URL parsing, formatting, and query string manipulation.
         * All methods are **synchronous** — no `drift()` needed.
         *
         * @example
         * ```js
         * // Parse a URL
         * const parsed = t.url.parse("https://api.example.com:8080/users?page=2&limit=10#section");
         * // → { protocol: "https:", hostname: "api.example.com", port: "8080", ... }
         *
         * // Build a URL
         * const url = t.url.format({
         *     protocol: "https:",
         *     hostname: "api.example.com",
         *     pathname: "/v2/users"
         * });
         * // → "https://api.example.com/v2/users"
         *
         * // Work with query strings
         * const params = new t.url.SearchParams({ page: "1", limit: "20" });
         * params.set("sort", "name");
         * const queryString = params.toString();
         * // → "page=1&limit=20&sort=name"
         * ```
         *
         * @see https://github.com/ezet-galaxy/-titanpl-core#url-url
         */
        interface URLModule {
            /**
             * Parse a URL string into its component parts.
             *
             * @param url - URL string to parse
             * @returns Parsed URL object with protocol, hostname, port, etc.
             *
             * @example
             * ```js
             * const url = t.url.parse("https://user:pass@example.com:8080/path?q=1#hash");
             * // → {
             * //     protocol: "https:",
             * //     hostname: "example.com",
             * //     port: "8080",
             * //     pathname: "/path",
             * //     search: "?q=1",
             * //     hash: "#hash"
             * // }
             * ```
             */
            parse(url: string): UrlObject;

            /**
             * Format a URL object back into a URL string.
             *
             * @param urlObj - URL object with components
             * @returns Formatted URL string
             *
             * @example
             * ```js
             * const url = t.url.format({
             *     protocol: "https:",
             *     hostname: "api.example.com",
             *     pathname: "/users",
             *     search: "?active=true"
             * });
             * // → "https://api.example.com/users?active=true"
             * ```
             */
            format(urlObj: any): string;

            /**
             * URLSearchParams constructor for query string manipulation.
             *
             * @example
             * ```js
             * // From string
             * const params = new t.url.SearchParams("page=1&limit=20");
             *
             * // From object
             * const params = new t.url.SearchParams({ page: "1", limit: "20" });
             *
             * params.get("page");     // → "1"
             * params.set("sort", "name");
             * params.has("limit");    // → true
             * params.delete("limit");
             * params.toString();      // → "page=1&sort=name"
             * ```
             */
            SearchParams: typeof TitanURLSearchParams;
        }

        /**
         * Parsed URL components returned by `url.parse()`.
         */
        interface UrlObject {
            /** Protocol with colon (e.g., `"https:"`) */
            protocol: string;
            /** Hostname without port (e.g., `"example.com"`) */
            hostname: string;
            /** Port number as string (e.g., `"8080"`) or empty */
            port: string;
            /** Path portion (e.g., `"/api/users"`) */
            pathname: string;
            /** Query string with `?` (e.g., `"?page=1"`) or empty */
            search: string;
            /** Fragment with `#` (e.g., `"#section"`) or empty */
            hash: string;
        }

        /**
         * URLSearchParams for query string parsing and manipulation.
         *
         * Similar to the Web API `URLSearchParams`.
         */
        class TitanURLSearchParams {
            /**
             * Create a new URLSearchParams instance.
             *
             * @param init - Initial value: query string or key-value object
             */
            constructor(init?: string | Record<string, string>);

            /**
             * Get the value of a query parameter.
             *
             * @param key - Parameter name
             * @returns Parameter value or `null` if not found
             */
            get(key: string): string | null;

            /**
             * Set a query parameter (creates or updates).
             *
             * @param key - Parameter name
             * @param value - Parameter value
             */
            set(key: string, value: string): void;

            /**
             * Check if a parameter exists.
             *
             * @param key - Parameter name
             * @returns `true` if the parameter exists
             */
            has(key: string): boolean;

            /**
             * Delete a query parameter.
             *
             * @param key - Parameter name to remove
             */
            delete(key: string): void;

            /**
             * Convert to a URL-encoded query string (without leading `?`).
             *
             * @returns Query string (e.g., `"page=1&limit=20"`)
             */
            toString(): string;

            /**
             * Get all key-value pairs as an array of tuples.
             *
             * @returns Array of `[key, value]` tuples
             */
            entries(): [string, string][];

            /**
             * Get all parameter names.
             *
             * @returns Array of keys
             */
            keys(): string[];

            /**
             * Get all parameter values.
             *
             * @returns Array of values
             */
            values(): string[];
        }

        // =====================================================================
        //  Buffer Module
        // =====================================================================

        /**
         * # Buffer API
         *
         * Binary data encoding and decoding utilities.
         * All methods are **synchronous** — no `drift()` needed.
         *
         * Supports conversions between strings, `Uint8Array`, Base64, and Hex.
         *
         * @example
         * ```js
         * // Base64 encode/decode
         * const encoded = t.buffer.toBase64("Hello, World!");
         * // → "SGVsbG8sIFdvcmxkIQ=="
         *
         * const bytes = t.buffer.fromBase64(encoded);
         * const decoded = t.buffer.toUtf8(bytes);
         * // → "Hello, World!"
         *
         * // Hex encode/decode
         * const hex = t.buffer.toHex("Hello");
         * // → "48656c6c6f"
         *
         * const original = t.buffer.toUtf8(t.buffer.fromHex(hex));
         * // → "Hello"
         * ```
         *
         * @see https://github.com/ezet-galaxy/-titanpl-core#buffer-buffer-utilities
         */
        interface BufferModule {
            /**
             * Decode a Base64-encoded string to bytes.
             *
             * @param str - Base64-encoded string
             * @returns Decoded byte array
             *
             * @example
             * ```js
             * const bytes = t.buffer.fromBase64("SGVsbG8=");
             * const text = t.buffer.toUtf8(bytes);
             * // → "Hello"
             * ```
             */
            fromBase64(str: string): Uint8Array;

            /**
             * Encode bytes or a string to Base64.
             *
             * @param bytes - `Uint8Array` or plain string to encode
             * @returns Base64-encoded string
             *
             * @example
             * ```js
             * const b64 = t.buffer.toBase64("Hello, World!");
             * // → "SGVsbG8sIFdvcmxkIQ=="
             * ```
             */
            toBase64(bytes: Uint8Array | string): string;

            /**
             * Decode a hex-encoded string to bytes.
             *
             * @param str - Hex-encoded string (e.g., `"48656c6c6f"`)
             * @returns Decoded byte array
             *
             * @example
             * ```js
             * const bytes = t.buffer.fromHex("48656c6c6f");
             * const text = t.buffer.toUtf8(bytes);
             * // → "Hello"
             * ```
             */
            fromHex(str: string): Uint8Array;

            /**
             * Encode bytes or a string to hexadecimal.
             *
             * @param bytes - `Uint8Array` or plain string to encode
             * @returns Hex-encoded string
             *
             * @example
             * ```js
             * const hex = t.buffer.toHex("Hello");
             * // → "48656c6c6f"
             * ```
             */
            toHex(bytes: Uint8Array | string): string;

            /**
             * Encode a UTF-8 string to bytes.
             *
             * @param str - String to encode
             * @returns UTF-8 encoded byte array
             *
             * @example
             * ```js
             * const bytes = t.buffer.fromUtf8("Hello");
             * // → Uint8Array [72, 101, 108, 108, 111]
             * ```
             */
            fromUtf8(str: string): Uint8Array;

            /**
             * Decode bytes to a UTF-8 string.
             *
             * @param bytes - Byte array to decode
             * @returns UTF-8 decoded string
             *
             * @example
             * ```js
             * const bytes = new Uint8Array([72, 101, 108, 108, 111]);
             * const text = t.buffer.toUtf8(bytes);
             * // → "Hello"
             * ```
             */
            toUtf8(bytes: Uint8Array): string;
        }

        // =====================================================================
        //  Local Storage Module
        // =====================================================================

        /**
         * # Local Storage API
         *
         * High-performance in-memory key-value store backed by native Rust
         * `RwLock<HashMap>`. Data persists across requests but is **volatile**
         * (lost on server restart).
         *
         * **Performance Benchmarks (10,000 operations):**
         * - 📖 Read: ~156,250 ops/sec (0.0064ms avg)
         * - ✍️ Write: ~89,286 ops/sec (0.0112ms avg)
         * - 🔄 Mixed: ~125,000 ops/sec (0.008ms avg)
         *
         * **Characteristics:**
         * - ⚡ ~1000x faster than file-based storage
         * - 💾 In-memory only (not persistent across restarts)
         * - 🔒 Thread-safe with RwLock (multiple readers, single writer)
         * - 📦 Supports V8 Serialization for complex objects (Map, Set, Date, etc.)
         *
         * All methods are **synchronous** — no `drift()` needed.
         *
         * @example
         * ```js
         * // Basic string storage
         * t.ls.set("user:123", JSON.stringify({ name: "Alice", role: "admin" }));
         * const userData = JSON.parse(t.ls.get("user:123") || "{}");
         *
         * // Complex object storage (preserves Map, Set, Date, etc.)
         * const data = {
         *     users: new Map([["alice", { role: "admin" }]]),
         *     tags: new Set(["active", "verified"]),
         *     created: new Date()
         * };
         * t.ls.setObject("complex:data", data);
         * const restored = t.ls.getObject("complex:data");
         * // restored.users instanceof Map → true
         *
         * // List and cleanup
         * const allKeys = t.ls.keys();
         * t.ls.remove("user:123");
         * t.ls.clear(); // Remove all data
         * ```
         *
         * @see https://github.com/ezet-galaxy/-titanpl-core#ls--localstorage-persistent-storage
         */
        interface LocalStorage {
            /**
             * Get a string value by key.
             *
             * @param key - Storage key
             * @returns Stored string value, or `null` if not found
             *
             * @example
             * ```js
             * const value = t.ls.get("config:theme");
             * // → "dark" or null
             * ```
             */
            get(key: string): string | null;

            /**
             * Store a string value under a key.
             *
             * @param key - Storage key
             * @param value - String value to store
             *
             * @example
             * ```js
             * t.ls.set("config:theme", "dark");
             * t.ls.set("user:123", JSON.stringify({ name: "Alice" }));
             * ```
             */
            set(key: string, value: string): void;

            /**
             * Remove a key from storage.
             *
             * @param key - Key to remove (no error if key doesn't exist)
             *
             * @example
             * ```js
             * t.ls.remove("session:expired");
             * ```
             */
            remove(key: string): void;

            /**
             * Clear all keys and values from storage.
             *
             * **⚠️ Destructive operation** — removes everything.
             *
             * @example
             * ```js
             * t.ls.clear();
             * ```
             */
            clear(): void;

            /**
             * Get a list of all stored keys.
             *
             * @returns Array of all key names
             *
             * @example
             * ```js
             * const keys = t.ls.keys();
             * // → ["user:123", "config:theme", "cache:data"]
             *
             * // Filter keys by prefix
             * const userKeys = keys.filter(k => k.startsWith("user:"));
             * ```
             */
            keys(): string[];

            /**
             * Store a complex JavaScript object using V8 serialization.
             *
             * **Advantages over JSON.stringify:**
             * - ✅ Preserves `Map`, `Set`, `Date`, `RegExp`, `BigInt`
             * - ✅ Handles circular references
             * - ✅ ~50x faster than JSON for large objects
             *
             * @param key - Storage key
             * @param value - Any JavaScript value to store
             *
             * @example
             * ```js
             * const session = {
             *     user: { id: 1, name: "Alice" },
             *     permissions: new Set(["read", "write"]),
             *     metadata: new Map([["loginTime", new Date()]]),
             *     count: BigInt(9007199254740993)
             * };
             *
             * t.ls.setObject("session:abc", session);
             * ```
             */
            setObject(key: string, value: any): void;

            /**
             * Retrieve and deserialize a complex JavaScript object.
             *
             * @typeParam T - Expected return type
             * @param key - Storage key
             * @returns Deserialized object, or `null` if not found or invalid
             *
             * @example
             * ```js
             * const session = t.ls.getObject("session:abc");
             *
             * if (session) {
             *     session.permissions instanceof Set; // → true
             *     session.metadata instanceof Map;    // → true
             *     session.metadata.get("loginTime") instanceof Date; // → true
             * }
             * ```
             */
            getObject<T = any>(key: string): T | null;

            /**
             * Serialize a JavaScript value to V8 binary format.
             *
             * Useful for manual serialization before storing or transmitting.
             *
             * @param value - Value to serialize
             * @returns Binary representation as `Uint8Array`
             *
             * @example
             * ```js
             * const data = { map: new Map([["a", 1]]) };
             * const bytes = t.ls.serialize(data);
             * // bytes can be stored, sent over network, etc.
             * ```
             */
            serialize(value: any): Uint8Array;

            /**
             * Deserialize V8 binary format back to a JavaScript value.
             *
             * @param bytes - Binary data to deserialize
             * @returns Original JavaScript value
             *
             * @example
             * ```js
             * const data = t.ls.deserialize(bytes);
             * // data.map instanceof Map → true
             * ```
             */
            deserialize(bytes: Uint8Array): any;

            /**
             * Register a custom class for serialization/hydration support.
             *
             * @param ClassRef - Constructor function of the class
             * @param hydrateFn - Optional custom hydration function
             * @param typeName - Optional type name override
             *
             * @example
             * ```js
             * class User {
             *     constructor(name, email) {
             *         this.name = name;
             *         this.email = email;
             *     }
             * }
             *
             * t.ls.register(User, (data) => new User(data.name, data.email));
             * ```
             */
            register(ClassRef: Function, hydrateFn?: Function, typeName?: string): void;

            /**
             * Hydrate a custom object from serialized data.
             *
             * @param typeName - Registered type name
             * @param data - Plain object data
             * @returns Hydrated class instance
             *
             * @example
             * ```js
             * const user = t.ls.hydrate("User", { name: "Alice", email: "alice@example.com" });
             * // user instanceof User → true
             * ```
             */
            hydrate(typeName: string, data: object): any;
        }

        // =====================================================================
        //  Session Module
        // =====================================================================

        /**
         * # Session API
         *
         * High-performance server-side session state management.
         * Uses composite keys (`{sessionId}:{key}`) for isolation.
         *
         * **Implementation:** Native Rust `RwLock<HashMap>`
         * **Performance:** Same as LocalStorage (~89K-156K ops/sec)
         *
         * **Characteristics:**
         * - 🔐 Session-scoped (isolated per session ID)
         * - ⚡ Sub-millisecond operations
         * - 💾 In-memory only (not persistent across restarts)
         *
         * All methods are **synchronous** — no `drift()` needed.
         *
         * @example
         * ```js
         * // Get session ID from cookie or header
         * const sessionId = t.cookies.get(req, "session_id") || t.crypto.uuid();
         *
         * // Store shopping cart
         * t.session.set(sessionId, "cart", JSON.stringify([
         *     { productId: 1, quantity: 2 },
         *     { productId: 5, quantity: 1 }
         * ]));
         *
         * // Retrieve cart
         * const cart = JSON.parse(t.session.get(sessionId, "cart") || "[]");
         *
         * // Store user authentication state
         * t.session.set(sessionId, "userId", "123");
         * t.session.set(sessionId, "role", "admin");
         *
         * // Logout: clear entire session
         * t.session.clear(sessionId);
         * ```
         *
         * @see https://github.com/ezet-galaxy/-titanpl-core#session-server-side-sessions
         */
        interface Session {
            /**
             * Get a value from a session.
             *
             * @param sessionId - Unique session identifier
             * @param key - Key within the session
             * @returns Stored value, or `null` if not found
             *
             * @example
             * ```js
             * const userId = t.session.get(sessionId, "userId");
             * if (!userId) {
             *     return t.response.json({ error: "Not authenticated" }, 401);
             * }
             * ```
             */
            get(sessionId: string, key: string): string | null;

            /**
             * Store a value in a session.
             *
             * @param sessionId - Unique session identifier
             * @param key - Key within the session
             * @param value - Value to store
             *
             * @example
             * ```js
             * t.session.set(sessionId, "lastActivity", t.time.timestamp());
             * t.session.set(sessionId, "preferences", JSON.stringify({ theme: "dark" }));
             * ```
             */
            set(sessionId: string, key: string, value: string): void;

            /**
             * Delete a single key from a session.
             *
             * @param sessionId - Unique session identifier
             * @param key - Key to delete
             *
             * @example
             * ```js
             * t.session.delete(sessionId, "tempData");
             * ```
             */
            delete(sessionId: string, key: string): void;

            /**
             * Clear an entire session (remove all data for this session ID).
             *
             * Useful for logout functionality.
             *
             * @param sessionId - Unique session identifier
             *
             * @example
             * ```js
             * export function logout(req) {
             *     const sessionId = t.cookies.get(req, "session_id");
             *     if (sessionId) {
             *         t.session.clear(sessionId);
             *         t.cookies.delete(req, "session_id");
             *     }
             *     return t.response.redirect("/login");
             * }
             * ```
             */
            clear(sessionId: string): void;
        }

        // =====================================================================
        //  Cookies Module
        // =====================================================================

        /**
         * # Cookie API
         *
         * HTTP cookie parsing and setting utilities.
         *
         * @example
         * ```js
         * export function handleAuth(req) {
         *     // Read a cookie
         *     const token = t.cookies.get(req, "auth_token");
         *
         *     if (!token) {
         *         // Set a new cookie
         *         const newToken = t.crypto.uuid();
         *         t.cookies.set(req, "auth_token", newToken, {
         *             httpOnly: true,
         *             secure: true,
         *             sameSite: "Strict",
         *             maxAge: 86400 * 7, // 7 days
         *             path: "/"
         *         });
         *         return { token: newToken, isNew: true };
         *     }
         *
         *     return { token, isNew: false };
         * }
         *
         * export function logout(req) {
         *     t.cookies.delete(req, "auth_token");
         *     return t.response.redirect("/login");
         * }
         * ```
         *
         * @see https://github.com/ezet-galaxy/-titanpl-core#cookies-http-cookies
         */
        interface Cookies {
            /**
             * Parse and retrieve a cookie value from the request.
             *
             * @param req - Titan request object
             * @param name - Cookie name
             * @returns Cookie value, or `null` if not found
             *
             * @example
             * ```js
             * const sessionId = t.cookies.get(req, "session_id");
             * const theme = t.cookies.get(req, "theme") || "light";
             * ```
             */
            get(req: any, name: string): string | null;

            /**
             * Set a cookie on the response.
             *
             * @param res - Response context (typically the request object in Titan)
             * @param name - Cookie name
             * @param value - Cookie value
             * @param options - Cookie options (httpOnly, secure, sameSite, etc.)
             *
             * @example
             * ```js
             * // Secure authentication cookie
             * t.cookies.set(req, "auth_token", token, {
             *     httpOnly: true,    // Not accessible via JavaScript
             *     secure: true,      // HTTPS only
             *     sameSite: "Strict", // CSRF protection
             *     maxAge: 86400,     // 1 day in seconds
             *     path: "/"
             * });
             *
             * // Simple preference cookie
             * t.cookies.set(req, "theme", "dark", {
             *     maxAge: 86400 * 365 // 1 year
             * });
             * ```
             */
            set(res: any, name: string, value: string, options?: CookieOptions): void;

            /**
             * Delete a cookie by setting its expiration in the past.
             *
             * @param res - Response context
             * @param name - Cookie name to delete
             *
             * @example
             * ```js
             * t.cookies.delete(req, "auth_token");
             * t.cookies.delete(req, "session_id");
             * ```
             */
            delete(res: any, name: string): void;
        }

        /**
         * Options for configuring cookies.
         */
        interface CookieOptions {
            /**
             * Maximum age in seconds before the cookie expires.
             *
             * @example
             * ```js
             * maxAge: 86400      // 1 day
             * maxAge: 86400 * 7  // 1 week
             * maxAge: 86400 * 30 // 30 days
             * ```
             */
            maxAge?: number;

            /**
             * URL path where the cookie is valid.
             * @default "/"
             */
            path?: string;

            /**
             * If `true`, cookie is not accessible via JavaScript (`document.cookie`).
             * **Recommended for authentication tokens.**
             */
            httpOnly?: boolean;

            /**
             * If `true`, cookie is only sent over HTTPS connections.
             * **Recommended for production.**
             */
            secure?: boolean;

            /**
             * SameSite policy for CSRF protection.
             * - `"Strict"` — Cookie only sent for same-site requests
             * - `"Lax"` — Cookie sent for same-site + top-level navigation
             * - `"None"` — Cookie sent for all requests (requires `secure: true`)
             */
            sameSite?: 'Strict' | 'Lax' | 'None';
        }

        // =====================================================================
        //  Response Module
        // =====================================================================

        /**
         * # Response API
         *
         * HTTP response builder for controlled response formatting.
         * Creates `ResponseObject` instances that the Titan runtime processes.
         *
         * @example
         * ```js
         * // JSON response
         * export function getUser(req) {
         *     const user = findUser(req.params.id);
         *     if (!user) {
         *         return t.response.json({ error: "User not found" }, 404);
         *     }
         *     return t.response.json(user);
         * }
         *
         * // HTML response
         * export function homePage(req) {
         *     const html = t.fs.readFile("./views/home.html");
         *     return t.response.html(html);
         * }
         *
         * // Redirect
         * export function oldEndpoint(req) {
         *     return t.response.redirect("/api/v2/users");
         * }
         *
         * // Custom response with headers
         * export function download(req) {
         *     const content = t.fs.readFile("./data/export.csv");
         *     return t.response({
         *         status: 200,
         *         headers: {
         *             "Content-Type": "text/csv",
         *             "Content-Disposition": "attachment; filename=\"export.csv\""
         *         },
         *         body: content
         *     });
         * }
         *
         * // Empty response (204 No Content)
         * export function deleteUser(req) {
         *     removeUser(req.params.id);
         *     return t.response.empty();
         * }
         * ```
         *
         * @see https://titan-docs-ez.vercel.app/docs/04-runtime-apis
         */
        interface ResponseModule {
            /**
             * Create a fully custom response.
             *
             * @param options - Response configuration
             * @returns ResponseObject for the Titan runtime
             *
             * @example
             * ```js
             * return t.response({
             *     status: 201,
             *     headers: {
             *         "X-Request-Id": requestId,
             *         "Content-Type": "application/json"
             *     },
             *     body: JSON.stringify({ created: true })
             * });
             * ```
             */
            (options: ResponseOptions): ResponseObject;

            /**
             * Send a plain text response.
             *
             * Automatically sets `Content-Type: text/plain; charset=utf-8`.
             *
             * @param content - Text content to send
             * @param options - Optional response options (status, headers)
             * @returns ResponseObject
             *
             * @example
             * ```js
             * return t.response.text("Hello, World!");
             * return t.response.text("Not Found", { status: 404 });
             * ```
             */
            text(content: string, options?: ResponseOptions): ResponseObject;

            /**
             * Send an HTML response.
             *
             * Automatically sets `Content-Type: text/html; charset=utf-8`.
             *
             * @param content - HTML content to send
             * @param options - Optional response options (status, headers)
             * @returns ResponseObject
             *
             * @example
             * ```js
             * const html = `<!DOCTYPE html>
             * <html><body><h1>Welcome</h1></body></html>`;
             * return t.response.html(html);
             *
             * // From file
             * const page = t.fs.readFile("./views/index.html");
             * return t.response.html(page);
             * ```
             */
            html(content: string, options?: ResponseOptions): ResponseObject;

            /**
             * Send a JSON response.
             *
             * Automatically sets `Content-Type: application/json` and
             * serializes the content with `JSON.stringify()`.
             *
             * @param content - JavaScript object to serialize as JSON
             * @param options - Optional response options (status, headers)
             * @returns ResponseObject
             *
             * @example
             * ```js
             * // Success response
             * return t.response.json({ users: [], total: 0 });
             *
             * // Error response
             * return t.response.json({ error: "Invalid input" }, { status: 400 });
             *
             * // Created response
             * return t.response.json({ id: newId, created: true }, { status: 201 });
             * ```
             */
            json(content: any, options?: ResponseOptions): ResponseObject;

            /**
             * Send a binary response using raw bytes.
             *
             * This helper is intended for file downloads, images, PDFs, audio,
             * or any other non-text payload. It marks the response as binary so
             * the Titan runtime can send the bytes directly instead of treating
             * them like a UTF-8 string.
             *
             * By default, `Content-Type` is set to
             * `application/octet-stream`. You can override it with `options.type`.
             *
             * @param bytes - Raw binary payload as `Uint8Array`
             * @param options - Optional response options including `status`, `headers`, and MIME `type`
             * @returns ResponseObject
             *
             * @example
             * ```js
             * export function getLogo() {
             *     const bytes = t.fs.readFileBinary("./public/logo.png");
             *     return t.response.binary(bytes, {
             *         type: "image/png",
             *         headers: {
             *             "Cache-Control": "public, max-age=3600"
             *         }
             *     });
             * }
             *
             * export function downloadBackup() {
             *     const backup = t.fs.readFileBinary("./backups/latest.zip");
             *     return t.response.binary(backup, {
             *         type: "application/zip",
             *         status: 200,
             *         headers: {
             *             "Content-Disposition": "attachment; filename=\"latest.zip\""
             *         }
             *     });
             * }
             * ```
             */
            binary(bytes: Uint8Array, options?: BinaryResponseOptions): ResponseObject;

            /**
             * Create an HTTP redirect response.
             *
             * @param url - Target URL to redirect to
             * @param status - HTTP status code (default: 302 Found)
             * @returns ResponseObject
             *
             * @example
             * ```js
             * // Temporary redirect (302)
             * return t.response.redirect("/login");
             *
             * // Permanent redirect (301)
             * return t.response.redirect("/api/v2/users", 301);
             *
             * // External redirect
             * return t.response.redirect("https://example.com/callback");
             * ```
             */
            redirect(url: string, status?: number): ResponseObject;

            /**
             * Create an empty response (no body).
             *
             * Useful for DELETE operations or acknowledgments.
             *
             * @param status - HTTP status code (default: 204 No Content)
             * @returns ResponseObject
             *
             * @example
             * ```js
             * // After successful deletion
             * return t.response.empty(); // 204 No Content
             *
             * // Accepted for processing
             * return t.response.empty(202);
             * ```
             */
            empty(status?: number): ResponseObject;
        }

        /**
         * Options for constructing a custom response.
         */
        interface ResponseOptions {
            /**
             * HTTP status code.
             * @default 200
             *
             * @example
             * ```js
             * status: 200  // OK
             * status: 201  // Created
             * status: 400  // Bad Request
             * status: 404  // Not Found
             * status: 500  // Internal Server Error
             * ```
             */
            status?: number;

            /**
             * Custom HTTP headers as key-value pairs.
             *
             * @example
             * ```js
             * headers: {
             *     "Content-Type": "application/pdf",
             *     "Content-Disposition": "attachment; filename=\"doc.pdf\"",
             *     "X-Request-Id": requestId
             * }
             * ```
             */
            headers?: Record<string, string>;

            /**
             * Response body as a string.
             *
             * For JSON, use `JSON.stringify(data)`.
             */
            body?: string;
        }

        /**
         * Options for binary responses created by `t.response.binary()`.
         */
        interface BinaryResponseOptions extends ResponseOptions {
            /**
             * MIME type for the binary payload.
             * @default "application/octet-stream"
             *
             * @example
             * ```js
             * type: "image/png"
             * type: "application/pdf"
             * type: "audio/mpeg"
             * ```
             */
            type?: string;

            /**
             * Binary responses ignore `body` and send the provided byte array
             * directly.
             */
            body?: never;
        }

        /**
         * Standardized response object consumed by the Titan runtime.
         *
         * Created by `t.response()` and its helper methods.
         * Do not construct manually — use the Response API.
         */
        interface ResponseObject {
            /** Internal marker for Titan runtime response detection */
            _isResponse: true;
            /** HTTP status code */
            status: number;
            /** HTTP headers */
            headers: Record<string, string>;
            /** Response body as text or binary bytes */
            body: string | Uint8Array;
            /** `true` when the response body should be sent as raw bytes */
            _isBinary?: true;
        }
    }

    // =========================================================================
    //  Declaration Merging: Extend TitanRuntimeUtils
    //  This makes t.response, t.core, etc. available automatically when
    //  @titanpl/core is installed
    // =========================================================================

    /**
     * Extension of the base Titan runtime utilities.
     *
     * When `@titanpl/core` is installed, these properties are automatically
     * available on the `t` global object.
     */
    interface TitanRuntimeUtils {
        /**
         * HTTP Response Builder.
         *
         * Create controlled HTTP responses with proper status codes,
         * headers, and body formatting.
         *
         * @see {@link TitanCore.ResponseModule}
         */
        response: TitanCore.ResponseModule;

        /**
         * Core namespace providing unified access to all APIs.
         *
         * @example
         * ```js
         * const { fs, crypto, os } = t.core;
         * ```
         *
         * @see {@link TitanCore.Core}
         */
        core: TitanCore.Core;

        /**
         * File System API — Native file operations.
         * @see {@link TitanCore.FileSystem}
         */
        fs: TitanCore.FileSystem;

        /**
         * Path API — Cross-platform path manipulation.
         * @see {@link TitanCore.Path}
         */
        path: TitanCore.Path;

        /**
         * Cryptography API — Hashing, encryption, and random generation.
         * @see {@link TitanCore.Crypto}
         */
        crypto: TitanCore.Crypto;

        /**
         * Operating System API — System information.
         * @see {@link TitanCore.OS}
         */
        os: TitanCore.OS;

        /**
         * Network API — DNS resolution and IP utilities.
         * @see {@link TitanCore.Net}
         */
        net: TitanCore.Net;

        /**
         * Process API — Runtime process information.
         * @see {@link TitanCore.Process}
         */
        proc: TitanCore.Process;

        /**
         * Time API — Timestamps, sleep, and timing utilities.
         * @see {@link TitanCore.Time}
         */
        time: TitanCore.Time;

        /**
         * URL API — URL parsing and formatting.
         * @see {@link TitanCore.URLModule}
         */
        url: TitanCore.URLModule;

        /**
         * Buffer API — Binary data encoding/decoding.
         * @see {@link TitanCore.BufferModule}
         */
        buffer: TitanCore.BufferModule;

        /**
         * Local Storage API — High-performance key-value store.
         * @see {@link TitanCore.LocalStorage}
         */
        ls: TitanCore.LocalStorage;

        /**
         * Alias for `t.ls` (Local Storage).
         * @see {@link TitanCore.LocalStorage}
         */
        localStorage: TitanCore.LocalStorage;

        /**
         * Session API — Server-side session management.
         * @see {@link TitanCore.Session}
         */
        session: TitanCore.Session;

        /**
         * Cookie API — HTTP cookie utilities.
         * @see {@link TitanCore.Cookies}
         */
        cookies: TitanCore.Cookies;
    }

    // =========================================================================
    //  Titan Runtime Namespace (Legacy/Alternative Access)
    //  Provides Titan.Runtime interface for alternative access patterns
    // =========================================================================

    /**
     * Titan Runtime namespace for alternative access patterns.
     *
     * @example
     * ```js
     * // Alternative access via Titan namespace
     * const core: Titan.Runtime["@titanpl/core"] = t.core;
     * ```
     */
    namespace Titan {
        /**
         * Runtime interface defining all available APIs.
         */
        interface Runtime {
            /**
             * # @titanpl/core
             * The official Core Standard Library for Titan Planet.
             *
             * @example
             * ```js
             * const { fs, crypto, os } = t.core;
             * ```
             */
            "@titanpl/core": TitanCore.Core;

            /** Alias for @titanpl/core */
            "titan-core": TitanCore.Core;

            /** File System - Native file operations backed by Rust. */
            fs: TitanCore.FileSystem;

            /** Path manipulation utilities. */
            path: TitanCore.Path;

            /** Cryptographic utilities using native Rust implementations. */
            crypto: TitanCore.Crypto;

            /** Operating System - Deep system introspection. */
            os: TitanCore.OS;

            /** Network - Low-level networking and DNS utilities. */
            net: TitanCore.Net;

            /** Process - Runtime execution control and monitoring. */
            proc: TitanCore.Process;

            /** Time - High-resolution timing and scheduling. */
            time: TitanCore.Time;

            /** URL - Robust URL parsing and construction. */
            url: TitanCore.URLModule;

            /** Buffer - High-performance binary data handling. */
            buffer: TitanCore.BufferModule;

            /** Local Storage - High-performance in-memory key-value store. */
            ls: TitanCore.LocalStorage;

            /** Alias for `t.ls` - Local Storage */
            localStorage: TitanCore.LocalStorage;

            /** Session - High-performance session management. */
            session: TitanCore.Session;

            /** Cookie - Standard-compliant HTTP cookie management. */
            cookies: TitanCore.Cookies;

            /** Response - HTTP Response Builder. */
            response: TitanCore.ResponseModule;

            /** Core namespace - Unified access to all APIs. */
            core: TitanCore.Core;
        }
    }
}

export {};
