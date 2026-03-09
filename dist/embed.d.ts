import type { EmbedProvider, IframeEmbedProps, ParsedEmbed } from "./_base/index.js";
export interface ResolvedEmbed {
    parsed: ParsedEmbed;
    provider: EmbedProvider;
}
/**
 * Resolve a source URL to a provider and id. Tries each provider in order;
 * returns the first match or null if none recognize the URL.
 */
export declare function resolveEmbedUrl(url: string, providers?: EmbedProvider[]): ResolvedEmbed | null;
/**
 * Accept a source URL from any supported provider and return the iframe HTML.
 * Optional props (width, height, title, etc.) are merged with the generated
 * embed URL; `src` is always set from the resolved provider.
 *
 * Returns null if the URL is not recognized by any provider.
 */
export declare function renderIframeFromUrl(url: string, props?: Partial<Omit<IframeEmbedProps, "src">>, providers?: EmbedProvider[]): string | null;
//# sourceMappingURL=embed.d.ts.map