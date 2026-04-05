const b64chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

function local_btoa(input) {
    let str = String(input);
    let output = '';

    for (let i = 0; i < str.length; i += 3) {
        const char1 = str.charCodeAt(i);
        const char2 = str.charCodeAt(i + 1);
        const char3 = str.charCodeAt(i + 2);

        const enc1 = char1 >> 2;
        const enc2 = ((char1 & 3) << 4) | (char2 >> 4);
        let enc3 = ((char2 & 15) << 2) | (char3 >> 6);
        let enc4 = char3 & 63;

        if (isNaN(char2)) {
            enc3 = enc4 = 64;
        } else if (isNaN(char3)) {
            enc4 = 64;
        }

        output += b64chars.charAt(enc1) + b64chars.charAt(enc2);
        output += (enc3 === 64) ? '=' : b64chars.charAt(enc3);
        output += (enc4 === 64) ? '=' : b64chars.charAt(enc4);
    }

    return output;
}

function local_atob(input) {
    // Remove whitespace and padding '='
    let str = String(input).replace(/[\t\n\f\r =]/g, "");
    let output = '';

    for (let i = 0; i < str.length; i += 4) {
        const c1Str = str.charAt(i);
        const c2Str = str.charAt(i + 1);
        const c3Str = str.charAt(i + 2);
        const c4Str = str.charAt(i + 3);

        const e1 = b64chars.indexOf(c1Str);
        const e2 = c2Str ? b64chars.indexOf(c2Str) : -1;
        const e3 = c3Str ? b64chars.indexOf(c3Str) : -1;
        const e4 = c4Str ? b64chars.indexOf(c4Str) : -1;

        // e1 and e2 are required
        if (e1 < 0 || e2 < 0) continue;

        // Shift and mask to reconstruct bytes
        const c1 = (e1 << 2) | (e2 >> 4);
        output += String.fromCharCode(c1);

        if (e3 !== -1) {
            const c2 = ((e2 & 15) << 4) | (e3 >> 2);
            output += String.fromCharCode(c2);
        }
        if (e4 !== -1) {
            const c3 = ((e3 & 3) << 6) | e4;
            output += String.fromCharCode(c3);
        }
    }

    return output;
}

function local_utf8_encode(str) {
    let result = [];
    for (let i = 0; i < str.length; i++) {
        let c = str.charCodeAt(i);
        if (c < 0x80) { result.push(c); }
        else if (c < 0x800) {
            result.push(0xc0 | (c >> 6), 0x80 | (c & 0x3f));
        }
        else if (c < 0xd800 || c >= 0xe000) {
            result.push(0xe0 | (c >> 12), 0x80 | ((c >> 6) & 0x3f), 0x80 | (c & 0x3f));
        }
        else {
            i++;
            c = 0x10000 + (((c & 0x3ff) << 10) | (str.charCodeAt(i) & 0x3ff));
            result.push(0xf0 | (c >> 18), 0x80 | ((c >> 12) & 0x3f), 0x80 | ((c >> 6) & 0x3f), 0x80 | (c & 0x3f));
        }
    }
    return new Uint8Array(result);
}

function local_utf8_decode(bytes) {
    let str = "";
    let i = 0;
    while (i < bytes.length) {
        let c = bytes[i++];
        if (c > 127) {
            if (c > 191 && c < 224) {
                c = ((c & 31) << 6) | (bytes[i++] & 63);
            } else if (c > 223 && c < 240) {
                c = ((c & 15) << 12) | ((bytes[i++] & 63) << 6) | (bytes[i++] & 63);
            } else if (c > 239 && c < 248) {
                c = ((c & 7) << 18) | ((bytes[i++] & 63) << 12) | ((bytes[i++] & 63) << 6) | (bytes[i++] & 63);
            }
        }
        if (c <= 0xffff) str += String.fromCharCode(c);
        else if (c <= 0x10ffff) {
            c -= 0x10000;
            str += String.fromCharCode(c >> 10 | 0xd800) + String.fromCharCode(c & 0x3ff | 0xdc00);
        }
    }
    return str;
}


// Native bindings are loaded by the runtime into t["@titanpl/core"]
const natives = t["@titanpl/core"] || {};

// --- FS ---
/** File System module */
const fs = {
    /** Reads file content as string. Supports options: { encoding: 'utf8' } or encoding name string. */
    readFile: (path, options) => {
        const encoding = typeof options === 'string' ? options : (options && options.encoding);
        const res = natives.fs_read_file(path);
        if (res && typeof res === 'string' && res.startsWith("ERROR:")) throw new Error(res);
        return res;
    },
    /** Writes content to file */
    writeFile: (path, content) => {
        const res = natives.fs_write_file(path, content);
        if (res && typeof res === 'string' && res.startsWith("ERROR:")) throw new Error(res);
    },
    /** Reads directory contents */
    readdir: (path) => {
        const res = natives.fs_readdir(path);
        try {
            return typeof res === 'string' ? JSON.parse(res) : res;
        } catch (e) {
            return [];
        }
    },
    /** Creates direction recursively */
    mkdir: (path) => {
        const res = natives.fs_mkdir(path);
        if (res && typeof res === 'string' && res.startsWith("ERROR:")) throw new Error(res);
    },
    /** Checks if path exists */
    exists: (path) => {
        return natives.fs_exists(path);
    },
    /** Returns file stats */
    stat: (path) => {
        const res = natives.fs_stat(path);
        try {
            return typeof res === 'string' ? JSON.parse(res) : res;
        } catch (e) {
            return {};
        }
    },
    /** Removes file or directory */
    remove: (path) => {
        const res = natives.fs_remove(path);
        if (res && typeof res === 'string' && res.startsWith("ERROR:")) throw new Error(res);
    },
    /** Reads file content as base64 string */
    readFileBase64: (path) => {
        const res = natives.fs_read_file_base64(path);
        if (res && typeof res === 'string' && res.startsWith("ERROR:")) throw new Error(res);
        return res;
    },
    /** Reads file content as binary (Uint8Array) */
    readFileBinary: (path) => {
        const base64 = fs.readFileBase64(path);
        return buffer.fromBase64(base64);
    },
    /** Writes binary content to file */
    writeFileBinary: (path, bytes) => {
        const base64 = buffer.toBase64(bytes);
        fs.writeFile(path, base64);
    },
    /** Checks if path is directory */
    isDirectory: (path) => {
        const stats = fs.stat(path);
        return stats.type === 'directory';
    },
    /** Checks if path is file */
    isFile: (path) => {
        const stats = fs.stat(path);
        return stats.type === 'file';
    }
};

// --- Path ---
/** Path manipulation module */
const path = {
    join: (...args) => {
        return args
            .map((part, i) => {
                if (!part) return '';
                let p = part.replace(/\\/g, '/');
                if (i === 0) return p.trim().replace(/[\/]*$/g, '');
                return p.trim().replace(/(^[\/]*|[\/]*$)/g, '');
            })
            .filter(x => x.length)
            .join('/');
    },
    resolve: (...args) => {
        let resolved = '';
        for (let arg of args) {
            // If an argument is absolute, it becomes the new base
            const isAbs = /^\/|^[a-zA-Z]:[\/\\]/.test(arg);
            if (isAbs) {
                resolved = arg;
            } else {
                resolved = path.join(resolved, arg);
            }
        }
        // If still not absolute, prepend CWD
        const isCurrentlyAbs = /^\/|^[a-zA-Z]:[\/\\]/.test(resolved);
        if (!isCurrentlyAbs && natives.path_cwd) {
            const cwd = natives.path_cwd();
            if (cwd) {
                resolved = path.join(cwd, resolved);
            }
        }
        return resolved;
    },
    extname: (p) => {
        const parts = p.split('.');
        return parts.length > 1 && !p.startsWith('.') ? '.' + parts.pop() : '';
    },
    dirname: (p) => {
        const parts = p.split('/');
        parts.pop();
        return parts.join('/') || '.';
    },
    basename: (p) => p.split('/').pop()
};

// --- Crypto ---
/** Cryptography module */
const crypto = {
    hash: (algo, data) => natives.crypto_hash ? natives.crypto_hash(algo, data) : "",
    randomBytes: (size) => natives.crypto_random_bytes ? natives.crypto_random_bytes(size) : "",
    uuid: () => natives.crypto_uuid ? natives.crypto_uuid() : "",
    base64: {
        encode: (str) => local_btoa(str),
        decode: (str) => local_atob(str),
    },
    // Extended API
    /** Encrypts data using AES-256-GCM. Returns Base64 string. */
    encrypt: (algorithm, key, plaintext) => {
        const res = natives.crypto_encrypt(algorithm, JSON.stringify({ key, plaintext }));
        if (res && typeof res === 'string' && res.startsWith("ERROR:")) throw new Error(res.substring(6));
        return res;
    },
    /** Decrypts data using AES-256-GCM. Returns plaintext string. */
    decrypt: (algorithm, key, ciphertext) => {
        const res = natives.crypto_decrypt(algorithm, JSON.stringify({ key, ciphertext }));
        if (res && typeof res === 'string' && res.startsWith("ERROR:")) throw new Error(res.substring(6));
        return res;
    },
    /** Computes HMAC-SHA256/512. Returns Hex string. */
    hashKeyed: (algorithm, key, message) => {
        const res = natives.crypto_hash_keyed(algorithm, JSON.stringify({ key, message }));
        if (res && typeof res === 'string' && res.startsWith("ERROR:")) throw new Error(res.substring(6));
        return res;
    },
    /** Constant-time string comparison */
    compare: (a, b) => {
        if (natives.crypto_compare) return natives.crypto_compare(a, b);
        // Fallback insecure
        if (a.length !== b.length) return false;
        let mismatch = 0;
        for (let i = 0; i < a.length; ++i) {
            mismatch |= (a.charCodeAt(i) ^ b.charCodeAt(i));
        }
        return mismatch === 0;
    }
};

// --- Buffer ---
// Helper for hex
function hexToBytes(hex) {
    const bytes = new Uint8Array(hex.length / 2);
    for (let i = 0; i < bytes.length; i++) {
        bytes[i] = parseInt(hex.substr(i * 2, 2), 16);
    }
    return bytes;
}
function bytesToHex(bytes) {
    return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
}

/** Buffer utility module */
const buffer = {
    /** Creates Uint8Array from Base64 string */
    fromBase64: (str) => {
        const binary = local_atob(str);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) {
            bytes[i] = binary.charCodeAt(i);
        }
        return bytes;
    },
    /** encoded Uint8Array or String to Base64 string */
    toBase64: (bytes) => {
        let binary = '';
        if (typeof bytes === 'string') {
            return local_btoa(bytes);
        }
        // Uint8Array
        const len = bytes.byteLength;
        for (let i = 0; i < len; i++) {
            binary += String.fromCharCode(bytes[i]);
        }
        return local_btoa(binary);
    },
    /** Creates Uint8Array from Hex string */
    fromHex: (str) => hexToBytes(str),
    /** Encodes bytes to Hex string */
    toHex: (bytes) => {
        if (typeof bytes === 'string') {
            return bytesToHex(local_utf8_encode(bytes));
        }
        return bytesToHex(bytes);
    },
    /** Creates Uint8Array from UTF-8 string */
    fromUtf8: (str) => local_utf8_encode(str),
    /** Decodes bytes to UTF-8 string */
    toUtf8: (bytes) => local_utf8_decode(bytes)
};

// --- Local Storage ---
/** High-performance in-memory Local Storage (backed by native RwLock<HashMap>) */
const ls = {
    get: (key) => {
        return natives.ls_get(key);
    },
    set: (key, value) => {
        natives.ls_set(key, String(value));
    },
    remove: (key) => {
        natives.ls_remove(key);
    },
    clear: () => {
        natives.ls_clear();
    },
    keys: () => {
        const result = natives.ls_keys();
        try {
            return typeof result === 'string' ? JSON.parse(result) : result;
        } catch (e) {
            return [];
        }
    },
    /** Native V8 serialization - supports Map, Set, Date, Uint8Array, etc. */
    serialize: (value) => {
        return t.serialize ? t.serialize(value) : (natives.serialize ? natives.serialize(value) : null);
    },
    /** Native V8 deserialization - restores complex JS objects */
    deserialize: (bytes) => {
        return t.deserialize ? t.deserialize(bytes) : (natives.deserialize ? natives.deserialize(bytes) : null);
    },
    /** Store a complex JS object using native V8 serialization */
    setObject: (key, value) => {
        if (!natives.serialize) return;
        const bytes = natives.serialize(value);
        const base64 = buffer.toBase64(bytes);
        natives.ls_set(key, base64);
    },
    /** Retrieve and restore a complex JS object */
    getObject: (key) => {
        if (!natives.deserialize) return null;
        const base64 = natives.ls_get(key);
        if (!base64) return null;
        try {
            const bytes = buffer.fromBase64(base64);
            return natives.deserialize(bytes);
        } catch (e) {
            return null;
        }
    }
};

// --- Sessions ---
/** High-performance in-memory Session Management (backed by native RwLock<HashMap>) */
const session = {
    get: (sessionId, key) => {
        return natives.session_get(sessionId, key);
    },
    set: (sessionId, key, value) => {
        natives.session_set(sessionId, JSON.stringify({ key, value: String(value) }));
    },
    delete: (sessionId, key) => {
        natives.session_delete(sessionId, key);
    },
    clear: (sessionId) => {
        natives.session_clear(sessionId);
    }
};


// --- Cookies ---
/** HTTP Cookie Utilities */
const cookies = {
    /** Parses cookie from request headers */
    get: (req, name) => {
        if (!req || !req.headers) return null;
        const cookieHeader = req.headers.cookie;
        if (!cookieHeader) return null;
        const cookies = cookieHeader.split(';');
        for (let c of cookies) {
            const [k, v] = c.trim().split('=');
            if (k === name) return decodeURIComponent(v);
        }
        return null;
    },
    /** Sets Set-Cookie header on response */
    set: (res, name, value, options = {}) => {
        if (!res) return;
        let cookie = `${name}=${encodeURIComponent(value)}`;
        if (options.maxAge) cookie += `; Max-Age=${options.maxAge}`;
        if (options.path) cookie += `; Path=${options.path}`;
        if (options.httpOnly) cookie += `; HttpOnly`;
        if (options.secure) cookie += `; Secure`;
        if (options.sameSite) cookie += `; SameSite=${options.sameSite}`;

        const getHeader = (n) => {
            if (res.getHeader) return res.getHeader(n);
            return res.headers ? res.headers[n] : null;
        };

        const setHeader = (n, v) => {
            if (res.setHeader) return res.setHeader(n, v);
            if (!res.headers) res.headers = {};
            res.headers[n] = v;
        };

        let prev = getHeader('Set-Cookie');
        if (prev) {
            if (Array.isArray(prev)) {
                prev.push(cookie);
                setHeader('Set-Cookie', prev);
            } else {
                setHeader('Set-Cookie', [prev, cookie]);
            }
        } else {
            setHeader('Set-Cookie', cookie);
        }
    },
    /** Deletes cookie by setting maxAge=0 */
    delete: (res, name) => {
        cookies.set(res, name, "", { maxAge: 0, path: '/' });
    }
};



// --- Response ---
/**
 * Advanced HTTP Response Management
 * 
 * This module provides functions to create standardized response objects
 * for the Titan runtime. All methods support both positional and object-based
 * argument signatures.
 * 
 * @example
 * // Standard usage (object-based)
 * return response({
 *   status: 200,
 *   headers: { "X-Powered-By": "Titan" },
 *   body: "Hello World"
 * });
 * 
 * // Helper usage (positional)
 * return response.json({ ok: true }, 201, { "Access-Control-Allow-Origin": "*" });
 */
const response = (optionsOrBody, status = 200, headers = {}) => {
    // Determine if first arg is an options object
    const IsObjectArg = optionsOrBody && typeof optionsOrBody === 'object' && !Array.isArray(optionsOrBody);
    
    // It's an options object if it has known keys OR if it's the only argument passed and it's an object
    const isOptions = IsObjectArg && ('body' in optionsOrBody || 'status' in optionsOrBody || 'headers' in optionsOrBody || Object.keys(optionsOrBody).length === 0);

    if (isOptions) {
        return {
            _isResponse: true,
            status: optionsOrBody.status || 200,
            headers: optionsOrBody.headers || {},
            body: optionsOrBody.body || ""
        };
    }

    // Otherwise treat as (body, status, headers)
    return {
        _isResponse: true,
        status: typeof status === 'number' ? status : 200,
        headers: (typeof status === 'object' ? status : headers) || {},
        body: optionsOrBody ?? ""
    };
};

/**
 * Internal helper to parse overloaded response arguments
 * @private
 */
function _parseResArgs(content, statusOrOptions, headers, defaultType) {
    let status = 200;
    let finalHeaders = {};

    if (statusOrOptions && typeof statusOrOptions === 'object' && !Array.isArray(statusOrOptions)) {
        status = statusOrOptions.status || 200;
        finalHeaders = { ...(statusOrOptions.headers || {}) };
    } else {
        status = typeof statusOrOptions === 'number' ? statusOrOptions : 200;
        finalHeaders = { ...(headers || {}) };
    }

    if (defaultType && !finalHeaders["Content-Type"]) {
        finalHeaders["Content-Type"] = defaultType;
    }

    return { status, headers: finalHeaders, body: content };
}

/**
 * Returns a plain text response.
 * @param {string} content - The text body
 * @param {number|object} [statusOrOptions=200] - Status code or { status, headers }
 * @param {object} [headers={}] - Additional headers (if status is number)
 * @returns {object} Standardized response object
 */
response.text = (content, statusOrOptions = 200, headers = {}) => {
    const res = _parseResArgs(String(content), statusOrOptions, headers, "text/plain; charset=utf-8");
    return { _isResponse: true, ...res };
};

/**
 * Returns an HTML response.
 * @param {string} content - The HTML string
 * @param {number|object} [statusOrOptions=200] - Status code or { status, headers }
 * @param {object} [headers={}] - Additional headers (if status is number)
 * @returns {object} Standardized response object
 */
response.html = (content, statusOrOptions = 200, headers = {}) => {
    const res = _parseResArgs(content, statusOrOptions, headers, "text/html; charset=utf-8");
    return { _isResponse: true, ...res };
};

/**
 * Returns a JSON response.
 * @param {any} content - Data to be stringified
 * @param {number|object} [statusOrOptions=200] - Status code or { status, headers }
 * @param {object} [headers={}] - Additional headers (if status is number)
 * @returns {object} Standardized response object
 * 
 * @example
 * return response.json({ message: "Success" }, 200, { "X-Custom": "Value" });
 */
response.json = (content, statusOrOptions = 200, headers = {}) => {
    const res = _parseResArgs(content, statusOrOptions, headers, "application/json");
    return {
        _isResponse: true,
        status: res.status,
        headers: res.headers,
        body: JSON.stringify(content)
    };
};

/**
 * Returns a redirect response.
 * @param {string} url - Destination URL
 * @param {number|object} [statusOrOptions=302] - Status code or { status, headers }
 * @param {object} [headers={}] - Additional headers
 * @returns {object} Standardized response object
 */
response.redirect = (url, statusOrOptions = 302, headers = {}) => {
    const res = _parseResArgs("", statusOrOptions, headers);
    res.headers["Location"] = url;
    // Default redirect status if not provided or provided as object without status
    if (typeof statusOrOptions !== 'number' && (!statusOrOptions || !statusOrOptions.status)) {
        res.status = 302;
    }
    return { _isResponse: true, ...res };
};

/**
 * Returns an empty response (usually 204 No Content).
 * @param {number|object} [statusOrOptions=204] - Status code or { status, headers }
 * @param {object} [headers={}] - Additional headers
 * @returns {object} Standardized response object
 */
response.empty = (statusOrOptions = 204, headers = {}) => {
    const res = _parseResArgs("", statusOrOptions, headers);
    // Default empty status
    if (typeof statusOrOptions !== 'number' && (!statusOrOptions || !statusOrOptions.status)) {
        res.status = 204;
    }
    return { _isResponse: true, ...res };
};

/**
 * Returns a binary response.
 * @param {Uint8Array|string} bytes - Binary data
 * @param {string|object} [typeOrOptions="application/octet-stream"] - MIME type or { status, headers, type }
 * @param {object} [headers={}] - Additional headers
 * @returns {object} Standardized response object
 */
response.binary = (bytes, typeOrOptions = "application/octet-stream", headers = {}) => {
    let status = 200;
    let finalHeaders = {};
    let type = "application/octet-stream";

    if (typeOrOptions && typeof typeOrOptions === 'object') {
        status = typeOrOptions.status || 200;
        finalHeaders = { ...(typeOrOptions.headers || {}) };
        type = typeOrOptions.type || typeOrOptions.contentType || "application/octet-stream";
    } else {
        type = typeof typeOrOptions === 'string' ? typeOrOptions : "application/octet-stream";
        finalHeaders = { ...(headers || {}) };
    }

    if (!finalHeaders["Content-Type"]) {
        finalHeaders["Content-Type"] = type;
    }

    return {
        _isResponse: true,
        status: status,
        headers: finalHeaders,
        body: bytes,
        _isBinary: true
    };
};

// --- OS ---
const os = {
    platform: () => {
        if (!natives.os_info) return "unknown";
        const result = natives.os_info();
        const info = typeof result === 'string' ? JSON.parse(result) : result;
        return info.platform;
    },
    cpus: () => {
        if (!natives.os_info) return 1;
        const result = natives.os_info();
        const info = typeof result === 'string' ? JSON.parse(result) : result;
        return info.cpus;
    },
    totalMemory: () => {
        if (!natives.os_info) return 0;
        const result = natives.os_info();
        const info = typeof result === 'string' ? JSON.parse(result) : result;
        return info.totalMemory;
    },
    freeMemory: () => {
        if (!natives.os_info) return 0;
        const result = natives.os_info();
        const info = typeof result === 'string' ? JSON.parse(result) : result;
        return info.freeMemory;
    },
    tmpdir: () => {
        if (!natives.os_info) return '/tmp';
        try {
            const result = natives.os_info();
            const info = typeof result === 'string' ? JSON.parse(result) : result;
            return info.tempDir || info.tmpdir || '/tmp';
        } catch (e) {
            return '/tmp';
        }
    },
    info: () => {
        if (!natives.os_info) return {};
        const result = natives.os_info();
        return typeof result === 'string' ? JSON.parse(result) : result;
    }
};

// --- Net ---
const net = {
    resolveDNS: (hostname) => {
        if (!natives.net_resolve) return [];
        const result = natives.net_resolve(hostname);
        return typeof result === 'string' ? JSON.parse(result) : result;
    },
    ip: () => natives.net_ip ? natives.net_ip() : "127.0.0.1",
    ping: (host) => true
};

// --- Proc ---
const proc = {
    pid: () => {
        if (!natives.proc_info) return 0;
        const result = natives.proc_info();
        if (!result) return 0;
        const info = typeof result === 'string' ? JSON.parse(result) : result;
        return info.pid;
    },
    uptime: () => {
        if (!natives.proc_info) return 0;
        const result = natives.proc_info();
        if (!result) return 0;
        const info = typeof result === 'string' ? JSON.parse(result) : result;
        return info.uptime;
    },
    info: () => {
        if (!natives.proc_info) return {};
        const result = natives.proc_info();
        return typeof result === 'string' ? JSON.parse(result) : result;
    },
    list: () => {
        if (!natives.proc_list) return [];
        const result = natives.proc_list();
        return typeof result === 'string' ? JSON.parse(result) : result;
    },
    run: (cmd, args = []) => {
        if (!natives.proc_run) return { ok: false, error: 'Not implemented' };
        const result = natives.proc_run(JSON.stringify({ cmd, args }));
        return typeof result === 'string' ? JSON.parse(result) : result;
    },
    kill: (pid) => {
        if (!natives.proc_kill) return false;
        return natives.proc_kill(pid);
    },
    memory: () => ({})
};

// --- Time ---
const time = {
    sleep: (ms) => {
        if (natives.time_sleep) natives.time_sleep(ms);
    },
    now: () => Date.now(),
    timestamp: () => new Date().toISOString()
};

// --- URL ---
class TitanURLSearchParams {
    constructor(init = '') {
        this._params = {};
        if (typeof init === 'string') {
            const query = init.startsWith('?') ? init.slice(1) : init;
            query.split('&').forEach(pair => {
                const [key, value] = pair.split('=').map(decodeURIComponent);
                if (key) this._params[key] = value || '';
            });
        } else if (typeof init === 'object') {
            Object.assign(this._params, init);
        }
    }
    append(key, value) {
        if (!this._params[key]) this._params[key] = [];
        if (!Array.isArray(this._params[key])) this._params[key] = [this._params[key]];
        this._params[key].push(String(value));
    }
    get(key) {
        const val = this._params[key];
        return Array.isArray(val) ? val[0] : (val || null);
    }
    getAll(key) {
        const val = this._params[key];
        if (!val) return [];
        return Array.isArray(val) ? val : [val];
    }
    set(key, value) { this._params[key] = String(value); }
    has(key) { return key in this._params; }
    delete(key) { delete this._params[key]; }
    forEach(callback) {
        for (const [key, value] of this.entries()) {
            callback(value, key, this);
        }
    }
    sort() {
        const sorted = {};
        const keys = Object.keys(this._params).sort();
        for (const key of keys) sorted[key] = this._params[key];
        this._params = sorted;
    }
    toString() {
        return Object.entries(this._params)
            .flatMap(([k, v]) => {
                const values = Array.isArray(v) ? v : [v];
                return values.map(val => `${encodeURIComponent(k)}=${encodeURIComponent(val)}`);
            })
            .join('&');
    }
    entries() {
        const result = [];
        for (const [k, v] of Object.entries(this._params)) {
            const values = Array.isArray(v) ? v : [v];
            for (const val of values) result.push([k, val]);
        }
        return result;
    }
    keys() { return Object.keys(this._params); }
    values() { 
        const result = [];
        for (const v of Object.values(this._params)) {
            if (Array.isArray(v)) result.push(...v);
            else result.push(v);
        }
        return result;
    }
}

const url = {
    parse: (str) => {
        if (typeof URL !== 'undefined') {
            try { return new URL(str); } catch { return null; }
        }
        const match = str.match(/^(https?:)\/\/([^\/:]+)(?::(\d+))?(\/[^?#]*)?(\?[^#]*)?(#.*)?$/);
        if (!match) return null;
        return {
            protocol: match[1],
            hostname: match[2],
            port: match[3] || '',
            pathname: match[4] || '/',
            search: match[5] || '',
            hash: match[6] || ''
        };
    },
    format: (obj) => obj.toString ? obj.toString() : String(obj),
    SearchParams: TitanURLSearchParams
};

// Create the main core export object (following titan-valid pattern)
const core = {
    fs,
    path,
    crypto,
    os,
    net,
    proc,
    time,
    url,
    buffer, // t.core.buffer
    ls,
    session,
    cookies,
    response
};

t.fs = fs;
t.path = path;
t.crypto = crypto;
t.os = os;
t.net = net;
t.proc = proc;
t.time = time;
t.url = url;

// New Global Modules
t.buffer = buffer;
t.ls = ls;
t.localStorage = ls;
t.session = session;
t.cookies = cookies;
t.response = response;

// Attach core as unified namespace (main access point)
t.core = core;

// Register as extension under multiple names for compatibility
t["titan-core"] = core;
t["@titanpl/core"] = core;

// Also register in t.exts
if (!t.exts) t.exts = {};
t.exts["titan-core"] = core;
t.exts["@titanpl/core"] = core;

/**
 * ESM Exports for testing and standard imports
 */
export {
    fs,
    path,
    crypto,
    os,
    net,
    proc,
    time,
    url,
    buffer,
    ls,
    session,
    cookies,
    response,
    core
};

export default core;