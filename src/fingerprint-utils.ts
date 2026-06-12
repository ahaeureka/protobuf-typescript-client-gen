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

const isBrowser = typeof window !== 'undefined' && typeof document !== 'undefined';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Individual collectors
// ---------------------------------------------------------------------------

async function collectFingerprintJSBase(): Promise<{ visitor_id: string; confidence: number }> {
    if (!isBrowser) {
        return { visitor_id: 'ssr', confidence: 0 };
    }
    try {
        // Dynamic import so bundlers can tree-shake when not needed.
        const FingerprintJS = await import('@fingerprintjs/fingerprintjs');
        const fp = await FingerprintJS.load();
        const result = await fp.get();
        return { visitor_id: result.visitorId, confidence: result.confidence.score };
    } catch {
        return { visitor_id: 'unavailable', confidence: 0 };
    }
}

function collectWebGLSignals(): { renderer: string; vendor: string } {
    if (!isBrowser) return { renderer: '', vendor: '' };
    try {
        const canvas = document.createElement('canvas');
        const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
        if (!gl) return { renderer: 'none', vendor: 'none' };
        const ext = (gl as WebGLRenderingContext).getExtension('WEBGL_debug_renderer_info');
        if (!ext) return { renderer: 'blocked', vendor: 'blocked' };
        const renderer = (gl as WebGLRenderingContext).getParameter(ext.UNMASKED_RENDERER_WEBGL) as string ?? '';
        const vendor = (gl as WebGLRenderingContext).getParameter(ext.UNMASKED_VENDOR_WEBGL) as string ?? '';
        return { renderer, vendor };
    } catch {
        return { renderer: 'error', vendor: 'error' };
    }
}

async function collectAudioContextSignal(): Promise<string> {
    if (!isBrowser || typeof AudioContext === 'undefined') return 'unavailable';
    try {
        const ctx = new AudioContext();
        const oscillator = ctx.createOscillator();
        const analyser = ctx.createAnalyser();
        const gain = ctx.createGain();
        const scriptProcessor = ctx.createScriptProcessor(4096, 1, 1);

        gain.gain.value = 0; // silent
        oscillator.type = 'triangle';
        oscillator.frequency.value = 10000;
        oscillator.connect(analyser);
        analyser.connect(scriptProcessor);
        scriptProcessor.connect(gain);
        gain.connect(ctx.destination);

        const sample = await new Promise<number>((resolve) => {
            scriptProcessor.onaudioprocess = (event: AudioProcessingEvent) => {
                const data = event.inputBuffer.getChannelData(0);
                let sum = 0;
                for (let i = 0; i < data.length; i++) {
                    sum += Math.abs(data[i]);
                }
                resolve(sum);
            };
            oscillator.start(0);
            setTimeout(() => resolve(-1), 200);
        });

        oscillator.stop();
        await ctx.close();
        return sample.toFixed(6);
    } catch {
        return 'error';
    }
}

function collectFontMetrics(): string {
    if (!isBrowser) return '';
    const testString = 'mmmmmmmmmmlli';
    const testFonts = ['monospace', 'serif', 'sans-serif', 'cursive', 'fantasy'];
    const baseFont = 'monospace';
    try {
        const canvas = document.createElement('canvas');
        const ctx2d = canvas.getContext('2d');
        if (!ctx2d) return 'no-canvas';
        ctx2d.font = `72px ${baseFont}`;
        const baseWidth = ctx2d.measureText(testString).width;
        const widths = testFonts.map(font => {
            ctx2d.font = `72px ${font}, ${baseFont}`;
            return ctx2d.measureText(testString).width;
        });
        return [baseWidth, ...widths].map(w => w.toFixed(2)).join(',');
    } catch {
        return 'error';
    }
}

function collectHardwareSignals(): string {
    if (!isBrowser) return '';
    const nav = navigator as any;
    const parts = [
        String(nav.hardwareConcurrency ?? 0),
        String(nav.deviceMemory ?? 0),
        String(nav.maxTouchPoints ?? 0),
    ];
    return parts.join(',');
}

function collectScreenSignals(): string {
    if (!isBrowser) return '';
    const s = window.screen;
    return `${s.width}x${s.height}x${s.colorDepth}x${s.pixelDepth ?? 0}`;
}

function collectLanguageSignals(): string {
    if (!isBrowser) return '';
    const nav = navigator as any;
    const langs = Array.isArray(nav.languages) ? nav.languages.join(',') : '';
    return `${nav.language ?? ''}|${langs}`;
}

function collectStorageFlags(): string {
    if (!isBrowser) return '';
    const cookieEnabled = navigator.cookieEnabled ? '1' : '0';
    let lsEnabled = '0';
    let idbEnabled = '0';
    try {
        localStorage.setItem('__fp_test__', '1');
        localStorage.removeItem('__fp_test__');
        lsEnabled = '1';
    } catch { /* noop */ }
    try {
        idbEnabled = typeof indexedDB !== 'undefined' ? '1' : '0';
    } catch { /* noop */ }
    return `c${cookieEnabled}l${lsEnabled}i${idbEnabled}`;
}

// ---------------------------------------------------------------------------
// Hash utility (SHA-256 via Web Crypto)
// ---------------------------------------------------------------------------

/**
 * Compute SHA-256 over sorted JSON serialization of the components object.
 * Returns lowercase hex string.
 */
export async function hashComponents(components: Record<string, unknown>): Promise<string> {
    if (!isBrowser || typeof crypto === 'undefined' || !crypto.subtle) {
        // Fallback: deterministic string hash (not cryptographic, only for non-browser)
        const str = JSON.stringify(components, Object.keys(components).sort());
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            hash = (Math.imul(31, hash) + str.charCodeAt(i)) | 0;
        }
        return Math.abs(hash).toString(16).padStart(8, '0');
    }
    const sorted: Record<string, unknown> = {};
    Object.keys(components).sort().forEach(k => { sorted[k] = components[k]; });
    const encoded = new TextEncoder().encode(JSON.stringify(sorted));
    const hashBuf = await crypto.subtle.digest('SHA-256', encoded);
    return Array.from(new Uint8Array(hashBuf))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
}

// ---------------------------------------------------------------------------
// Main collector
// ---------------------------------------------------------------------------

/**
 * Collect all available fingerprint signals from the current browser environment.
 * Returns both the structured components and the SHA-256 hash of the full signal set.
 */
export async function collectFingerprintComponents(): Promise<{
    components: FingerprintComponents;
    hash: string;
}> {
    const [fpBase, audioHash] = await Promise.all([
        collectFingerprintJSBase(),
        collectAudioContextSignal(),
    ]);

    const webgl = collectWebGLSignals();
    const fontMetrics = collectFontMetrics();
    const hardware = collectHardwareSignals();

    const components: FingerprintComponents = {
        fpjs_visitor_id: fpBase.visitor_id,
        fpjs_confidence: fpBase.confidence,
        webgl_renderer: webgl.renderer,
        webgl_vendor: webgl.vendor,
        audio_hash: audioHash,
        font_metrics: fontMetrics,
        hardware: hardware,
        timezone: isBrowser ? Intl.DateTimeFormat().resolvedOptions().timeZone : '',
        screen: collectScreenSignals(),
        languages: collectLanguageSignals(),
        plugin_count: isBrowser ? (navigator.plugins?.length ?? 0) : 0,
        storage_flags: collectStorageFlags(),
    };

    const hash = await hashComponents(components as unknown as Record<string, unknown>);
    return { components, hash };
}
