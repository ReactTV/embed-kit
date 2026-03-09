import { renderEmbedIframe } from "./_base/index.js";
import { DailymotionEmbed } from "./dailymotion/index.js";
import { InternetArchiveEmbed } from "./internet-archive/index.js";
import { TikTokEmbed } from "./tiktok/index.js";
import { TwitchEmbed } from "./twitch/index.js";
import { YouTubeEmbed } from "./youtube/index.js";
const DEFAULT_PROVIDERS = [
    new YouTubeEmbed(),
    new TwitchEmbed(),
    new TikTokEmbed(),
    new InternetArchiveEmbed(),
    new DailymotionEmbed(),
];
/**
 * Resolve a source URL to a provider and id. Tries each provider in order;
 * returns the first match or null if none recognize the URL.
 */
export function resolveEmbedUrl(url, providers = DEFAULT_PROVIDERS) {
    for (const provider of providers) {
        const parsed = provider.parseSourceUrl(url);
        if (parsed)
            return { parsed, provider };
    }
    return null;
}
/**
 * Accept a source URL from any supported provider and return the iframe HTML.
 * Optional props (width, height, title, etc.) are merged with the generated
 * embed URL; `src` is always set from the resolved provider.
 *
 * Returns null if the URL is not recognized by any provider.
 */
export function renderIframeFromUrl(url, props, providers = DEFAULT_PROVIDERS) {
    const resolved = resolveEmbedUrl(url, providers);
    if (!resolved)
        return null;
    const { parsed, provider } = resolved;
    const embedUrl = provider.getEmbedUrl(parsed.id, parsed.options);
    return renderEmbedIframe({ ...props, src: embedUrl });
}
//# sourceMappingURL=embed.js.map