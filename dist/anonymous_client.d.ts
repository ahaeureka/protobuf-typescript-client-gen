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
export interface AnonymousSession {
    anonymous_id: string;
    session_token: string;
    expires_at: number;
    is_suspicious: boolean;
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
export declare class AnonymousUserClient {
    private readonly baseUrl;
    private readonly refreshSlackMs;
    private readonly anonymousPath;
    private readonly http;
    private db;
    private keyPair;
    private publicKeyB64;
    private session;
    private initPromise;
    constructor(options: AnonymousUserClientOptions);
    /**
     * Initialize the client: open IndexedDB, load or generate the ECDSA key pair,
     * and restore any previously stored session. Must be called before other methods.
     */
    init(): Promise<void>;
    private _init;
    /**
     * Get the current valid anonymous session, creating or renewing it if needed.
     * Always calls init() internally if not yet initialized.
     */
    getOrCreateAnonymousSession(): Promise<AnonymousSession>;
    /**
     * Proactively refresh the session if it is close to expiry.
     */
    refreshSessionIfExpired(): Promise<void>;
    /** Returns the current anonymous_id, or null if no session has been created yet. */
    getAnonymousId(): string | null;
    /** Returns the current session JWT token, or null. */
    getSessionToken(): string | null;
    /**
     * Returns the association payload to be passed during OIDC login,
     * so the backend can link the anonymous session to the user account.
     */
    getAssociationPayload(): {
        anonymous_id: string;
    } | null;
    /**
     * Attach anonymous session headers to an outgoing request headers map.
     * Injects X-Anonymous-Token (JWT) and X-Device-Fingerprint (hash).
     */
    attachHeaders(headers: Record<string, string>): void;
    /**
     * Clear all local anonymous session data.
     * Call this after a successful OIDC login to transition to authenticated state.
     */
    clear(): void;
    private loadOrInitKeyPair;
    private restoreSession;
    /**
     * True if all present layers agree on anonymous_id and session_token.
     * Missing layers are not penalised (e.g. sessionStorage cleared on tab close).
     */
    private verifyStorageConsistency;
    private clearAllStorage;
    private isSessionFresh;
    private isStoredSessionFresh;
    private writeToAllStorages;
    private requestNewSession;
}
