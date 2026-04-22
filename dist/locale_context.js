"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setPreferredRequestLocale = setPreferredRequestLocale;
exports.getStoredRequestLocale = getStoredRequestLocale;
exports.detectBrowserRequestLocale = detectBrowserRequestLocale;
exports.resolveRequestLocale = resolveRequestLocale;
exports.buildAcceptLanguageHeader = buildAcceptLanguageHeader;
exports.applyAcceptLanguageHeader = applyAcceptLanguageHeader;
exports.withLocaleBusinessContext = withLocaleBusinessContext;
const DEFAULT_LOCALE_STORAGE_KEYS = ['stew:locale', 'locale'];
let preferredRequestLocale = null;
function isBrowserRuntime() {
    return typeof window !== 'undefined' && typeof navigator !== 'undefined';
}
function normalizeLocaleCandidate(locale) {
    if (!locale) {
        return null;
    }
    const trimmed = locale.trim();
    if (!trimmed) {
        return null;
    }
    const normalized = trimmed.replace(/_/g, '-');
    const lower = normalized.toLowerCase();
    if (lower === 'zh' || lower.startsWith('zh-')) {
        return 'zh-CN';
    }
    if (lower === 'en' || lower.startsWith('en-')) {
        return 'en';
    }
    return normalized;
}
function readLocaleFromStorage(storage) {
    if (!storage) {
        return null;
    }
    for (const key of DEFAULT_LOCALE_STORAGE_KEYS) {
        try {
            const value = storage.getItem(key);
            const normalized = normalizeLocaleCandidate(value);
            if (normalized) {
                return normalized;
            }
        }
        catch {
            return null;
        }
    }
    return null;
}
function uniqueLocales(locales) {
    const seen = new Set();
    const result = [];
    for (const locale of locales) {
        const normalized = normalizeLocaleCandidate(locale);
        if (!normalized) {
            continue;
        }
        const key = normalized.toLowerCase();
        if (seen.has(key)) {
            continue;
        }
        seen.add(key);
        result.push(normalized);
    }
    return result;
}
function readHeaderValue(headers, name) {
    const target = name.toLowerCase();
    for (const [key, value] of Object.entries(headers)) {
        if (key.toLowerCase() === target && typeof value === 'string') {
            return value;
        }
    }
    return undefined;
}
function setPreferredRequestLocale(locale) {
    preferredRequestLocale = normalizeLocaleCandidate(locale);
}
function getStoredRequestLocale() {
    if (!isBrowserRuntime()) {
        return null;
    }
    return (readLocaleFromStorage(window.localStorage)
        || readLocaleFromStorage(window.sessionStorage));
}
function detectBrowserRequestLocale() {
    if (!isBrowserRuntime()) {
        return null;
    }
    const locales = uniqueLocales(navigator.languages ?? []);
    if (locales.length > 0) {
        return locales[0];
    }
    return normalizeLocaleCandidate(navigator.language);
}
function resolveRequestLocale(explicitLocale) {
    return (normalizeLocaleCandidate(explicitLocale)
        || preferredRequestLocale
        || getStoredRequestLocale()
        || detectBrowserRequestLocale());
}
function buildAcceptLanguageHeader(explicitLocale) {
    const explicit = normalizeLocaleCandidate(explicitLocale);
    if (explicit) {
        return explicit;
    }
    if (preferredRequestLocale) {
        return preferredRequestLocale;
    }
    const stored = getStoredRequestLocale();
    if (stored) {
        return stored;
    }
    if (!isBrowserRuntime()) {
        return null;
    }
    const locales = uniqueLocales(navigator.languages ?? []);
    if (locales.length > 0) {
        return locales.join(', ');
    }
    return normalizeLocaleCandidate(navigator.language);
}
function applyAcceptLanguageHeader(headers, explicitLocale) {
    const headerValue = buildAcceptLanguageHeader(explicitLocale);
    if (!headerValue) {
        return headers;
    }
    if (typeof headers.has === 'function' && headers.has('Accept-Language')) {
        return headers;
    }
    if (readHeaderValue(headers, 'Accept-Language')) {
        return headers;
    }
    if (typeof headers.set === 'function') {
        headers.set('Accept-Language', headerValue);
        return headers;
    }
    headers['Accept-Language'] = headerValue;
    return headers;
}
function withLocaleBusinessContext(businessContext, explicitLocale) {
    const locale = resolveRequestLocale(explicitLocale);
    if (!locale) {
        return businessContext;
    }
    return {
        ...(businessContext ?? {}),
        locale,
    };
}
