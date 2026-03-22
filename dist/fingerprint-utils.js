"use strict";
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
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.hashComponents = hashComponents;
exports.collectFingerprintComponents = collectFingerprintComponents;
const isBrowser = typeof window !== 'undefined' && typeof document !== 'undefined';
// ---------------------------------------------------------------------------
// Individual collectors
// ---------------------------------------------------------------------------
async function collectFingerprintJSBase() {
    if (!isBrowser) {
        return { visitor_id: 'ssr', confidence: 0 };
    }
    try {
        // Dynamic import so bundlers can tree-shake when not needed.
        const FingerprintJS = await Promise.resolve().then(() => __importStar(require('@fingerprintjs/fingerprintjs')));
        const fp = await FingerprintJS.load();
        const result = await fp.get();
        return { visitor_id: result.visitorId, confidence: result.confidence.score };
    }
    catch {
        return { visitor_id: 'unavailable', confidence: 0 };
    }
}
function collectWebGLSignals() {
    if (!isBrowser)
        return { renderer: '', vendor: '' };
    try {
        const canvas = document.createElement('canvas');
        const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
        if (!gl)
            return { renderer: 'none', vendor: 'none' };
        const ext = gl.getExtension('WEBGL_debug_renderer_info');
        if (!ext)
            return { renderer: 'blocked', vendor: 'blocked' };
        const renderer = gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) ?? '';
        const vendor = gl.getParameter(ext.UNMASKED_VENDOR_WEBGL) ?? '';
        return { renderer, vendor };
    }
    catch {
        return { renderer: 'error', vendor: 'error' };
    }
}
async function collectAudioContextSignal() {
    if (!isBrowser || typeof AudioContext === 'undefined')
        return 'unavailable';
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
        const sample = await new Promise((resolve) => {
            scriptProcessor.onaudioprocess = (event) => {
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
    }
    catch {
        return 'error';
    }
}
function collectFontMetrics() {
    if (!isBrowser)
        return '';
    const testString = 'mmmmmmmmmmlli';
    const testFonts = ['monospace', 'serif', 'sans-serif', 'cursive', 'fantasy'];
    const baseFont = 'monospace';
    try {
        const canvas = document.createElement('canvas');
        const ctx2d = canvas.getContext('2d');
        if (!ctx2d)
            return 'no-canvas';
        ctx2d.font = `72px ${baseFont}`;
        const baseWidth = ctx2d.measureText(testString).width;
        const widths = testFonts.map(font => {
            ctx2d.font = `72px ${font}, ${baseFont}`;
            return ctx2d.measureText(testString).width;
        });
        return [baseWidth, ...widths].map(w => w.toFixed(2)).join(',');
    }
    catch {
        return 'error';
    }
}
function collectHardwareSignals() {
    if (!isBrowser)
        return '';
    const nav = navigator;
    const parts = [
        String(nav.hardwareConcurrency ?? 0),
        String(nav.deviceMemory ?? 0),
        String(nav.maxTouchPoints ?? 0),
    ];
    return parts.join(',');
}
function collectScreenSignals() {
    if (!isBrowser)
        return '';
    const s = window.screen;
    return `${s.width}x${s.height}x${s.colorDepth}x${s.pixelDepth ?? 0}`;
}
function collectLanguageSignals() {
    if (!isBrowser)
        return '';
    const nav = navigator;
    const langs = Array.isArray(nav.languages) ? nav.languages.join(',') : '';
    return `${nav.language ?? ''}|${langs}`;
}
function collectStorageFlags() {
    if (!isBrowser)
        return '';
    const cookieEnabled = navigator.cookieEnabled ? '1' : '0';
    let lsEnabled = '0';
    let idbEnabled = '0';
    try {
        localStorage.setItem('__fp_test__', '1');
        localStorage.removeItem('__fp_test__');
        lsEnabled = '1';
    }
    catch { /* noop */ }
    try {
        idbEnabled = typeof indexedDB !== 'undefined' ? '1' : '0';
    }
    catch { /* noop */ }
    return `c${cookieEnabled}l${lsEnabled}i${idbEnabled}`;
}
// ---------------------------------------------------------------------------
// Hash utility (SHA-256 via Web Crypto)
// ---------------------------------------------------------------------------
/**
 * Compute SHA-256 over sorted JSON serialization of the components object.
 * Returns lowercase hex string.
 */
async function hashComponents(components) {
    if (!isBrowser || typeof crypto === 'undefined' || !crypto.subtle) {
        // Fallback: deterministic string hash (not cryptographic, only for non-browser)
        const str = JSON.stringify(components, Object.keys(components).sort());
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            hash = (Math.imul(31, hash) + str.charCodeAt(i)) | 0;
        }
        return Math.abs(hash).toString(16).padStart(8, '0');
    }
    const sorted = {};
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
async function collectFingerprintComponents() {
    const [fpBase, audioHash] = await Promise.all([
        collectFingerprintJSBase(),
        collectAudioContextSignal(),
    ]);
    const webgl = collectWebGLSignals();
    const fontMetrics = collectFontMetrics();
    const hardware = collectHardwareSignals();
    const components = {
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
    const hash = await hashComponents(components);
    return { components, hash };
}
