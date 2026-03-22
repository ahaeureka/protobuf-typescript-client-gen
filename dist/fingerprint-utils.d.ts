/**
 * Device fingerprint signal collection utilities.
 *
 * Combines FingerprintJS open-source signals with additional entropy sources
 * (WebGL, AudioContext, Canvas font metrics, hardware info) to produce a
 * richer fingerprint hash. All processing happens locally in the browser;
 * no data leaves the device from this module.
 *
 * Security note: The resulting hash is not used as a secret. It is signed
 * with the device's ECDSA private key (managed by AnonymousUserClient) before
 * being sent to the server, providing device-binding without sharing raw signals.
 */
export interface FingerprintComponents {
    /** Visitor ID and raw components from FingerprintJS */
    fpjs_visitor_id: string;
    fpjs_confidence: number;
    /** WebGL renderer and vendor string */
    webgl_renderer: string;
    webgl_vendor: string;
    /** Normalized audio context signal (floating-point rendered sum) */
    audio_hash: string;
    /** Canvas-measured pixel widths for 5 test fonts */
    font_metrics: string;
    /** Hardware concurrency, device memory, max touch points */
    hardware: string;
    /** timezone */
    timezone: string;
    /** screen dimensions and color depth */
    screen: string;
    /** navigator.language + navigator.languages */
    languages: string;
    /** Number of installed plugins */
    plugin_count: number;
    /** Cookie and localStorage availability */
    storage_flags: string;
}
/**
 * Compute SHA-256 over sorted JSON serialization of the components object.
 * Returns lowercase hex string.
 */
export declare function hashComponents(components: Record<string, unknown>): Promise<string>;
/**
 * Collect all available fingerprint signals from the current browser environment.
 * Returns both the structured components and the SHA-256 hash of the full signal set.
 */
export declare function collectFingerprintComponents(): Promise<{
    components: FingerprintComponents;
    hash: string;
}>;
