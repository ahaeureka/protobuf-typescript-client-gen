const DEFAULT_LOCALE_STORAGE_KEYS = ['stew:locale', 'locale'];

type HeaderCarrier = {
    has?: (name: string) => boolean;
    set?: (name: string, value: string) => void;
    [key: string]: unknown;
};

let preferredRequestLocale: string | null = null;

function isBrowserRuntime(): boolean {
    return typeof window !== 'undefined' && typeof navigator !== 'undefined';
}

function normalizeLocaleCandidate(locale?: string | null): string | null {
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

function readLocaleFromStorage(storage?: Storage): string | null {
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
        } catch {
            return null;
        }
    }

    return null;
}

function uniqueLocales(locales: readonly string[]): string[] {
    const seen = new Set<string>();
    const result: string[] = [];

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

function readHeaderValue(headers: HeaderCarrier, name: string): string | undefined {
    const target = name.toLowerCase();
    for (const [key, value] of Object.entries(headers)) {
        if (key.toLowerCase() === target && typeof value === 'string') {
            return value;
        }
    }
    return undefined;
}

export function setPreferredRequestLocale(locale?: string | null): void {
    preferredRequestLocale = normalizeLocaleCandidate(locale);
}

export function getStoredRequestLocale(): string | null {
    if (!isBrowserRuntime()) {
        return null;
    }

    return (
        readLocaleFromStorage(window.localStorage)
        || readLocaleFromStorage(window.sessionStorage)
    );
}

export function detectBrowserRequestLocale(): string | null {
    if (!isBrowserRuntime()) {
        return null;
    }

    const locales = uniqueLocales(navigator.languages ?? []);
    if (locales.length > 0) {
        return locales[0];
    }

    return normalizeLocaleCandidate(navigator.language);
}

export function resolveRequestLocale(explicitLocale?: string | null): string | null {
    return (
        normalizeLocaleCandidate(explicitLocale)
        || preferredRequestLocale
        || getStoredRequestLocale()
        || detectBrowserRequestLocale()
    );
}

export function buildAcceptLanguageHeader(explicitLocale?: string | null): string | null {
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

export function applyAcceptLanguageHeader<T extends HeaderCarrier>(
    headers: T,
    explicitLocale?: string | null,
): T {
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

    (headers as HeaderCarrier & Record<string, unknown>)['Accept-Language'] = headerValue;
    return headers;
}

export function withLocaleBusinessContext(
    businessContext?: Record<string, unknown>,
    explicitLocale?: string | null,
): Record<string, unknown> | undefined {
    const locale = resolveRequestLocale(explicitLocale);
    if (!locale) {
        return businessContext;
    }

    return {
        ...(businessContext ?? {}),
        locale,
    };
}