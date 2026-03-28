# @titanpl/core

The official Core Standard Library for Titan Planet - a high-performance JavaScript runtime extension. This library bridges high-performance Rust native implementations with an easy-to-use JavaScript API.

## Overview

`@titanpl/core` provides essential standard library modules for Titan applications, covering file system operations, cryptography, process management, networking, and more. All modules are implemented as native Rust extensions for maximum performance.

## Installation

```bash
npm install @titanpl/core
```

## Usage

The extension automatically attaches to the Titan runtime.

### Modern ESM Import (Highly Recommended)
Best for IDE support, autocompletion, and type checking.

**Make sure you installed `@titanpl/native`**

```javascript
import { fs, crypto, ls } from "@titanpl/native";

const content = fs.readFile("config.json");
```

---

## API Reference

### `fs` (File System)
Synchronous file system operations.
- `fs.readFile(path: string): string` - Read file content as UTF-8 string.
- `fs.readFileBase64(path: string): string` - Read file content as a Base64-encoded string.
- `fs.writeFile(path: string, content: string): void` - Write string content to file.
- `fs.writeFileBinary(path: string, bytes: Uint8Array): void` - Write binary content to file.
- `fs.exists(path: string): boolean` - Check if a path exists.
- `fs.isDirectory(path: string): boolean` - Check whether a path points to a directory.
- `fs.isFile(path: string): boolean` - Check whether a path points to a regular file.
- `fs.mkdir(path: string): void` - Create a directory (recursive).
- `fs.remove(path: string): void` - Remove file or directory.
- `fs.readdir(path: string): string[]` - List directory contents.
- `fs.stat(path: string): object` - Get file statistics `{ isFile: boolean, isDir: boolean, size: number, modified: number, type?: string }`.

Example:
```javascript
import { fs, response } from "@titanpl/core";

const imageBase64 = fs.readFileBase64("./public/logo.png");
const imageBytes = fs.readFileBinary("./public/logo.png");

if (fs.isFile("./public/logo.png")) {
  fs.mkdir("./backup");
  fs.writeFileBinary("./backup/logo-copy.png", imageBytes);
}
```

### `path` (Path Manipulation)
Utilities for handling file paths.
- `path.join(...parts: string[]): string` - Join path segments using platform-specific separators.
- `path.resolve(...parts: string[]): string` - Resolve path to an absolute path.
- `path.dirname(path: string): string` - Get the directory name of a path.
- `path.basename(path: string): string` - Get the base name (filename) of a path.
- `path.extname(path: string): string` - Get the extension of a path (including the dot).

### `crypto` (Cryptography)
Secure cryptographic utilities.
- `crypto.hash(algo: string, data: string): string` - Hash data (e.g., `sha256`, `sha512`).
- `crypto.randomBytes(size: number): string` - Generate random bytes as a hex string.
- `crypto.uuid(): string` - Generate a UUID v4.
- `crypto.encrypt(algorithm: string, key: string, plaintext: string): string` - Encrypt text using native Rust implementations.
- `crypto.decrypt(algorithm: string, key: string, ciphertext: string): string` - Decrypt text.
- `crypto.hashKeyed(algo: string, key: string, message: string): string` - Keyed-hash (HMAC) support.
- `crypto.compare(hash: string, target: string): boolean` - Securely compare two strings in constant time.

### `buffer` (Buffer Utilities)
Utilities for binary and data encoding.
- `buffer.fromBase64(str: string): Uint8Array` - Decode Base64 string to bytes.
- `buffer.toBase64(bytes: Uint8Array|string): string` - Encode bytes or string to Base64.

### `os` (Operating System)
Retrieve system-level information.
- `os.platform(): string` - OS platform (e.g., `linux`, `windows`, `darwin`).
- `os.cpus(): number` - Number of logical CPU cores.
- `os.totalMemory(): number` - Total system memory in bytes.
- `os.freeMemory(): number` - Free system memory in bytes.
- `os.tmpdir(): string` - Path to the system temporary directory.

### `net` (Network)
Basic network utilities.
- `net.resolveDNS(hostname: string): string[]` - Resolve a hostname to IP addresses.
- `net.ip(): string` - Get the local system IP address.

### `proc` (Process Management)
Manage and query system processes.
- `proc.pid(): number` - Get the Process ID of the current Titan runtime.
- `proc.info(): object` - Get basic info about the current process.
- `proc.run(command: string, args?: string[], cwd?: string): object` - Spawn a background process.
- `proc.kill(pid: number): boolean` - Terminate a process by PID.
- `proc.list(): object[]` - List all running system processes with CPU and memory usage.

### `time` (Time Utilities)
- `time.sleep(ms: number): void` - Synchronously block execution for `ms` milliseconds.
- `time.now(): number` - Returns `Date.now()`.

### `ls` (Persistent Local Storage)
High-performance key-value storage persisted to disk.
- `ls.get(key: string): string|null` - Retrieve a string value.
- `ls.set(key: string, value: string): void` - Persist a string value.
- `ls.remove(key: string): void` - Delete a key.
- `ls.clear(): void` - Clear all stored data.
- `ls.keys(): string[]` - List all stored keys.
- `ls.setObject(key: string, value: any): void` - Store a complex JS object using native V8 serialization.
- `ls.getObject(key: string): any` - Retrieve and restore a complex JS object.
- `ls.serialize(value: any): Uint8Array` - Native V8 serialization (supports Map, Set, Date, Uint8Array).
- `ls.deserialize(bytes: Uint8Array): any` - Native V8 deserialization.

### `session` (Session Management)
- `session.get(sid: string, key: string): string|null` - Get session data.
- `session.set(sid: string, key: string, value: string): void` - Set session data.
- `session.delete(sid: string, key: string): void` - Delete session data.
- `session.clear(sid: string): void` - Clear an entire session.

### `cookies` (HTTP Cookies)
- `cookies.get(req: object, name: string): string|null` - Extract cookie value from request.
- `cookies.set(res: object, name: string, value: string, options?: object): void` - Attach `Set-Cookie` to response.

### `url` (URL Parsing)
- `url.parse(str: string): URL` - Parse a URL string into a native URL object.
- `new url.SearchParams(init?: string)` - Construct query parameters.

### `response` (HTTP Response Builder)
Helper for constructing standardized Titan responses.
- `response.text(content: string, options?: object): object` - Create a plain text response.
- `response.json(data: any, options?: object): object` - Create a JSON response.
- `response.html(content: string, options?: object): object` - Create an HTML response.
- `response.binary(bytes: Uint8Array, options?: object): object` - Create a binary response for images, PDFs, downloads, and other raw bytes.
- `response.redirect(url: string, status?: number): object` - Create a redirect response.

Example:
```javascript
import { fs, response } from "@titanpl/native";

export function getLogo() {
  const bytes = fs.readFileBinary("./public/logo.png");

  return response.binary(bytes, {
    type: "image/png",
    headers: {
      "Cache-Control": "public, max-age=3600"
    }
  });
}
```

---

## Native Bindings
This extension includes native Rust bindings for high-performance operations. The native binary is automatically loaded by the Titan Runtime during initialization.

## License
ISC
