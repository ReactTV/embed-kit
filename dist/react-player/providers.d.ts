import type { IEmbedProvider } from "../_base/index.js";
export interface ResolvedSource {
    provider: IEmbedProvider;
    id: string;
    options?: Record<string, unknown>;
}
/**
 * Parses a URL and returns the matching embed provider plus the extracted video/source id.
 * Tries each built-in provider (YouTube, Twitch, TikTok, Dailymotion, Vimeo) in order.
 * @param url - Full URL (e.g. youtube.com/watch?v=..., twitch.tv/videos/..., tiktok.com/...)
 * @returns The provider, id, and any parsed options, or null if no provider matched
 */
export declare function getProviderForUrl(url: string): ResolvedSource | null;
/** All built-in providers, in resolution order. Use to add custom providers or reorder. */
export declare function getDefaultProviders(): IEmbedProvider[];
//# sourceMappingURL=providers.d.ts.map