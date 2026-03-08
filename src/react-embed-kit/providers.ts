import type { IEmbedProvider } from "../_base/index.js";
import { youtubeEmbedProvider } from "../youtube/index.js";
import { twitchEmbedProvider } from "../twitch/index.js";
import { tiktokEmbedProvider } from "../tiktok/index.js";
import { dailymotionEmbedProvider } from "../dailymotion/index.js";
import { vimeoEmbedProvider } from "../vimeo/index.js";

const PROVIDERS: IEmbedProvider[] = [
  youtubeEmbedProvider,
  twitchEmbedProvider,
  tiktokEmbedProvider,
  dailymotionEmbedProvider,
  vimeoEmbedProvider,
];

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
export function getProviderForUrl(url: string): ResolvedSource | null {
  const trimmed = url?.trim();
  if (!trimmed) return null;
  for (const provider of PROVIDERS) {
    const parsed = provider.parseSourceUrl(trimmed);
    if (parsed) {
      const result: ResolvedSource = { provider, id: parsed.id };
      if (parsed.options != null) result.options = parsed.options;
      return result;
    }
  }
  return null;
}

/** All built-in providers, in resolution order. Use to add custom providers or reorder. */
export function getDefaultProviders(): IEmbedProvider[] {
  return [...PROVIDERS];
}
