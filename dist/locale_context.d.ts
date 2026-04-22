type HeaderCarrier = {
    has?: (name: string) => boolean;
    set?: (name: string, value: string) => void;
    [key: string]: unknown;
};
export declare function setPreferredRequestLocale(locale?: string | null): void;
export declare function getStoredRequestLocale(): string | null;
export declare function detectBrowserRequestLocale(): string | null;
export declare function resolveRequestLocale(explicitLocale?: string | null): string | null;
export declare function buildAcceptLanguageHeader(explicitLocale?: string | null): string | null;
export declare function applyAcceptLanguageHeader<T extends HeaderCarrier>(headers: T, explicitLocale?: string | null): T;
export declare function withLocaleBusinessContext(businessContext?: Record<string, unknown>, explicitLocale?: string | null): Record<string, unknown> | undefined;
export {};
