/**
 * Anonymous user session management client.
 *
 * Provides persistent anonymous identity for unauthenticated users, backed by:
 *
 *   - ECDSA P-256 device binding: a non-extractable CryptoKey pair is generated
 *     on first use and stored permanently in IndexedDB. Each session request is
 *     signed with the private key so the server can verify device ownership
 *     without sharing secrets.
 *
 *   - Multi-signal fingerprinting: FingerprintJS combined with WebGL, AudioContext,
 *     font metrics and hardware signals produces a richer hash than FingerprintJS
 *     alone, mitigating the open-source anti-fraud gap.
 *
 *   - Three-layer storage cross-validation: session data is written to
 *     localStorage, sessionStorage and IndexedDB. If the layers disagree on
 *     session_token / anonymous_id, the session is considered tampered and
 *     a fresh session is requested from the server.
 *
 * Usage:
 *   const client = new AnonymousUserClient({ baseUrl: 'https://gw.example.com' });
 *   await client.init();
 *   const session = await client.getOrCreateAnonymousSession();
 *   // Attach headers to every API request:
 *   const headers: Record<string, string> = {};
 *   client.attachHeaders(headers);
 *   // After OIDC login succeeds:
 *   const payload = client.getAssociationPayload(); // { anonymous_id: 'anon:...' }
 *   client.clear();
 */

import axios, { AxiosInstance } from 'axios';
import { collectFingerprintComponents } from './fingerprint-utils';

const isBrowser = typeof window !== 'undefined' && typeof document !== 'undefined';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface AnonymousSession {
    anonymous_id: string;
    session_token: string;
    expires_at: number; // Unix ms
    is_suspicious: boolean;
    public_key_b64: string;   // base64url SPKI DER of the device's public key
    fingerprint_hash: string;
}

interface StoredSession {
    anonymous_id: string;
    session_token: string;
    expires_at: number;
    public_key_b64: string;
    fingerprint_hash: string;
}

export interface AnonymousUserClientOptions {
    baseUrl: string;
    /** TTL slack in milliseconds before expiry to trigger proactive refresh (default: 5 minutes) */
    refreshSlackMs?: number;
    /** Path for the anonymous session endpoint (default: '/auth/anonymous') */
    anonymousPath?: string;
}

// ---------------------------------------------------------------------------
// IndexedDB helpers
// ---------------------------------------------------------------------------

const IDB_DB_NAME = 'stew_anon';
const IDB_STORE_SESSION = 'session';
const IDB_STORE_KEYS = 'keys';
const IDB_KEY_SESSION = 'current';
const IDB_KEY_PAIR = 'device_keypair';
const IDB_VERSION = 1;

function openAnonymousDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
        const req = indexedDB.open(IDB_DB_NAME, IDB_VERSION);
        req.onupgradeneeded = (event) => {
            const db = (event.target as IDBOpenDBRequest).result;
            if (!db.objectStoreNames.contains(IDB_STORE_SESSION)) {
                db.createObjectStore(IDB_STORE_SESSION);
            }
            if (!db.objectStoreNames.contains(IDB_STORE_KEYS)) {
                db.createObjectStore(IDB_STORE_KEYS);
            }
        };
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
    });
}

function idbPut(db: IDBDatabase, store: string, key: string, value: unknown): Promise<void> {
    return new Promise((resolve, reject) => {
        const tx = db.transaction(store, 'readwrite');
        tx.objectStore(store).put(value, key);
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
    });
}

function idbGet<T>(db: IDBDatabase, store: string, key: string): Promise<T | undefined> {
    return new Promise((resolve, reject) => {
        const tx = db.transaction(store, 'readonly');
        const req = tx.objectStore(store).get(key);
        req.onsuccess = () => resolve(req.result as T | undefined);
        req.onerror = () => reject(req.error);
    });
}

function idbDelete(db: IDBDatabase, store: string, key: string): Promise<void> {
    return new Promise((resolve, reject) => {
        const tx = db.transaction(store, 'readwrite');
        tx.objectStore(store).delete(key);
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
    });
}

// ---------------------------------------------------------------------------
// Web Crypto helpers
// ---------------------------------------------------------------------------

const ECDSA_PARAMS: EcKeyGenParams = { name: 'ECDSA', namedCurve: 'P-256' };
const SIGN_PARAMS: EcdsaParams = { name: 'ECDSA', hash: 'SHA-256' };

async function generateKeyPair(): Promise<CryptoKeyPair> {
    return crypto.subtle.generateKey(ECDSA_PARAMS, false /* not extractable */, ['sign', 'verify']);
}

async function exportPublicKeyB64(publicKey: CryptoKey): Promise<string> {
    const spki = await crypto.subtle.exportKey('spki', publicKey);
    return b64urlEncode(new Uint8Array(spki));
}

async function signPayload(privateKey: CryptoKey, message: string): Promise<string> {
    const encoded = new TextEncoder().encode(message);
    const sig = await crypto.subtle.sign(SIGN_PARAMS, privateKey, encoded);
    return b64urlEncode(new Uint8Array(sig));
}

// ---------------------------------------------------------------------------
// Base64url helpers (no dependencies)
// ---------------------------------------------------------------------------

function b64urlEncode(bytes: Uint8Array): string {
    const binary = Array.from(bytes).map(b => String.fromCharCode(b)).join('');
    return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

function b64urlDecode(str: string): Uint8Array {
    const padded = str.replace(/-/g, '+').replace(/_/g, '/').padEnd(
        str.length + (4 - (str.length % 4)) % 4, '='
    );
    const binary = atob(padded);
    return Uint8Array.from(binary, c => c.charCodeAt(0));
}

// ---------------------------------------------------------------------------
// Nonce generator
// ---------------------------------------------------------------------------

function generateNonce(): string {
    const bytes = crypto.getRandomValues(new Uint8Array(16));
    return b64urlEncode(bytes);
}

// ---------------------------------------------------------------------------
// localStorage / sessionStorage helpers (safe wrappers)
// ---------------------------------------------------------------------------

const LS_KEY = 'stew_anon_session';
const SS_KEY = 'stew_anon_session';

function lsWrite(session: StoredSession): void {
    try { localStorage.setItem(LS_KEY, JSON.stringify(session)); } catch { /* noop */ }
}

function lsRead(): StoredSession | null {
    try {
        const raw = localStorage.getItem(LS_KEY);
        return raw ? (JSON.parse(raw) as StoredSession) : null;
    } catch { return null; }
}

function lsClear(): void {
    try { localStorage.removeItem(LS_KEY); } catch { /* noop */ }
}

function ssWrite(session: StoredSession): void {
    try { sessionStorage.setItem(SS_KEY, JSON.stringify(session)); } catch { /* noop */ }
}

function ssRead(): StoredSession | null {
    try {
        const raw = sessionStorage.getItem(SS_KEY);
        return raw ? (JSON.parse(raw) as StoredSession) : null;
    } catch { return null; }
}

function ssClear(): void {
    try { sessionStorage.removeItem(SS_KEY); } catch { /* noop */ }
}

// ---------------------------------------------------------------------------
// Main client
// ---------------------------------------------------------------------------

export class AnonymousUserClient {
    private readonly baseUrl: string;
    private readonly refreshSlackMs: number;
    private readonly anonymousPath: string;
    private readonly http: AxiosInstance;

    private db: IDBDatabase | null = null;
    private keyPair: CryptoKeyPair | null = null;
    private publicKeyB64: string = '';
    private session: AnonymousSession | null = null;
    private initPromise: Promise<void> | null = null;

    constructor(options: AnonymousUserClientOptions) {
        this.baseUrl = options.baseUrl.replace(/\/$/, '');
        this.refreshSlackMs = options.refreshSlackMs ?? 5 * 60 * 1000;
        this.anonymousPath = options.anonymousPath ?? '/auth/anonymous';
        this.http = axios.create({
            baseURL: this.baseUrl,
            timeout: 10000,
            withCredentials: true,
        });
    }

    /**
     * Initialize the client: open IndexedDB, load or generate the ECDSA key pair,
     * and restore any previously stored session. Must be called before other methods.
     */
    async init(): Promise<void> {
        if (this.initPromise) return this.initPromise;
        this.initPromise = this._init();
        return this.initPromise;
    }

    private async _init(): Promise<void> {
        if (!isBrowser) return;
        try {
            this.db = await openAnonymousDB();
            await this.loadOrInitKeyPair();
            await this.restoreSession();
        } catch (err) {
            // Non-fatal: continue without persistence
            console.warn('[AnonymousClient] init error, continuing without persistence:', err);
        }
    }

    /**
     * Get the current valid anonymous session, creating or renewing it if needed.
     * Always calls init() internally if not yet initialized.
     */
    async getOrCreateAnonymousSession(): Promise<AnonymousSession> {
        await this.init();

        if (this.session && this.isSessionFresh(this.session)) {
            return this.session;
        }

        return this.requestNewSession();
    }

    /**
     * Proactively refresh the session if it is close to expiry.
     */
    async refreshSessionIfExpired(): Promise<void> {
        await this.init();
        if (!this.session || !this.isSessionFresh(this.session)) {
            await this.requestNewSession();
        }
    }

    /** Returns the current anonymous_id, or null if no session has been created yet. */
    getAnonymousId(): string | null {
        return this.session?.anonymous_id ?? null;
    }

    /** Returns the current session JWT token, or null. */
    getSessionToken(): string | null {
        return this.session?.session_token ?? null;
    }

    /**
     * Returns the association payload to be passed during OIDC login,
     * so the backend can link the anonymous session to the user account.
     */
    getAssociationPayload(): { anonymous_id: string } | null {
        const id = this.getAnonymousId();
        return id ? { anonymous_id: id } : null;
    }

    /**
     * Attach anonymous session headers to an outgoing request headers map.
     * Injects X-Anonymous-Token (JWT) and X-Device-Fingerprint (hash).
     */
    attachHeaders(headers: Record<string, string>): void {
        if (this.session) {
            headers['X-Anonymous-Token'] = this.session.session_token;
            headers['X-Device-Fingerprint'] = this.session.fingerprint_hash;
        }
    }

    /**
     * Clear all local anonymous session data.
     * Call this after a successful OIDC login to transition to authenticated state.
     */
    clear(): void {
        this.session = null;
        lsClear();
        ssClear();
        if (this.db) {
            idbDelete(this.db, IDB_STORE_SESSION, IDB_KEY_SESSION).catch(() => { /* noop */ });
        }
    }

    // -------------------------------------------------------------------------
    // Private: ECDSA key management
    // -------------------------------------------------------------------------

    private async loadOrInitKeyPair(): Promise<void> {
        if (!this.db) return;
        try {
            const stored = await idbGet<CryptoKeyPair>(this.db, IDB_STORE_KEYS, IDB_KEY_PAIR);
            if (stored && stored.privateKey && stored.publicKey) {
                this.keyPair = stored;
                this.publicKeyB64 = await exportPublicKeyB64(stored.publicKey);
                return;
            }
        } catch { /* generate fresh */ }

        const kp = await generateKeyPair();
        this.keyPair = kp;
        this.publicKeyB64 = await exportPublicKeyB64(kp.publicKey);
        try {
            await idbPut(this.db, IDB_STORE_KEYS, IDB_KEY_PAIR, kp);
        } catch { /* non-fatal */ }
    }

    // -------------------------------------------------------------------------
    // Private: session persistence and consistency validation
    // -------------------------------------------------------------------------

    private async restoreSession(): Promise<void> {
        const ls = lsRead();
        const ss = ssRead();
        const idb = this.db
            ? await idbGet<StoredSession>(this.db, IDB_STORE_SESSION, IDB_KEY_SESSION)
            : undefined;

        // Choose the most reliable source: IDB > LS > SS
        const candidate = idb ?? ls ?? ss ?? null;
        if (!candidate) return;

        const consistent = this.verifyStorageConsistency(ls, ss ?? undefined, idb);
        if (!consistent) {
            // Layers disagree - clear everything and force fresh session on next call
            console.warn('[AnonymousClient] Storage inconsistency detected, clearing cached session');
            this.clearAllStorage();
            return;
        }

        // Validate the public key matches the loaded key pair
        if (this.publicKeyB64 && candidate.public_key_b64 !== this.publicKeyB64) {
            console.warn('[AnonymousClient] Public key mismatch, discarding cached session');
            this.clearAllStorage();
            return;
        }

        if (!this.isStoredSessionFresh(candidate)) return;

        this.session = {
            ...candidate,
            is_suspicious: false,
        };
    }

    /**
     * True if all present layers agree on anonymous_id and session_token.
     * Missing layers are not penalised (e.g. sessionStorage cleared on tab close).
     */
    private verifyStorageConsistency(
        ls: StoredSession | null,
        ss: StoredSession | undefined,
        idb: StoredSession | undefined,
    ): boolean {
        const sources = [ls, ss, idb].filter((s): s is StoredSession => !!s);
        if (sources.length <= 1) return true;
        const [first, ...rest] = sources;
        return rest.every(
            s => s.anonymous_id === first.anonymous_id && s.session_token === first.session_token
        );
    }

    private clearAllStorage(): void {
        lsClear();
        ssClear();
        if (this.db) {
            idbDelete(this.db, IDB_STORE_SESSION, IDB_KEY_SESSION).catch(() => { /* noop */ });
        }
    }

    private isSessionFresh(session: AnonymousSession): boolean {
        return session.expires_at - this.refreshSlackMs > Date.now();
    }

    private isStoredSessionFresh(session: StoredSession): boolean {
        return session.expires_at - this.refreshSlackMs > Date.now();
    }

    private async writeToAllStorages(session: AnonymousSession): Promise<void> {
        const stored: StoredSession = {
            anonymous_id: session.anonymous_id,
            session_token: session.session_token,
            expires_at: session.expires_at,
            public_key_b64: session.public_key_b64,
            fingerprint_hash: session.fingerprint_hash,
        };
        lsWrite(stored);
        ssWrite(stored);
        if (this.db) {
            try {
                await idbPut(this.db, IDB_STORE_SESSION, IDB_KEY_SESSION, stored);
            } catch { /* non-fatal */ }
        }
    }

    // -------------------------------------------------------------------------
    // Private: server request
    // -------------------------------------------------------------------------

    private async requestNewSession(): Promise<AnonymousSession> {
        if (!isBrowser) {
            throw new Error('[AnonymousClient] requestNewSession requires browser environment');
        }

        const { components, hash } = await collectFingerprintComponents();

        const timestamp = Date.now();
        const nonce = generateNonce();
        const message = `${hash}:${timestamp}:${nonce}`;

        let signature = '';
        let publicKeyB64 = this.publicKeyB64;

        if (this.keyPair?.privateKey) {
            try {
                signature = await signPayload(this.keyPair.privateKey, message);
            } catch (err) {
                console.warn('[AnonymousClient] Failed to sign fingerprint, regenerating key pair:', err);
                const kp = await generateKeyPair();
                this.keyPair = kp;
                this.publicKeyB64 = await exportPublicKeyB64(kp.publicKey);
                publicKeyB64 = this.publicKeyB64;
                signature = await signPayload(kp.privateKey, message);
                if (this.db) {
                    await idbPut(this.db, IDB_STORE_KEYS, IDB_KEY_PAIR, kp).catch(() => { /* noop */ });
                }
            }
        }

        const existingId = this.session?.anonymous_id ?? '';
        const componentCount = Object.keys(components).length;

        const requestBody = {
            fingerprint_hash: hash,
            signature,
            public_key: publicKeyB64,
            timestamp,
            nonce,
            anonymous_id: existingId,
            components_count: componentCount,
        };

        const response = await this.http.post<{
            anonymous_id: string;
            session_token: string;
            expires_at: number;
            is_suspicious: boolean;
        }>(this.anonymousPath, requestBody);

        const responseData = response.data;
        // Handle APIResponse wrapper if present
        const data = (responseData as any)?.data ?? responseData;

        const session: AnonymousSession = {
            anonymous_id: data.anonymous_id,
            session_token: data.session_token,
            expires_at: typeof data.expires_at === 'number'
                ? (data.expires_at < 1e12 ? data.expires_at * 1000 : data.expires_at) // handle both s and ms
                : Date.now() + 30 * 24 * 60 * 60 * 1000,
            is_suspicious: data.is_suspicious ?? false,
            public_key_b64: publicKeyB64,
            fingerprint_hash: hash,
        };

        this.session = session;
        await this.writeToAllStorages(session);
        return session;
    }
}
