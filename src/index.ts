/**
 * embed-kit — Normalized API for YouTube, Twitch, TikTok, and other embed sources.
 */

export type {
  EmbedOptions,
  EmbedProvider,
  IframeEmbedProps,
  ParsedEmbed,
} from "./_base/index.js";
export { renderEmbedIframe } from "./_base/index.js";
export { YouTubeEmbed } from "./youtube/index.js";
export { TwitchEmbed } from "./twitch/index.js";
export { TikTokEmbed } from "./tiktok/index.js";
export { InternetArchiveEmbed } from "./internet-archive/index.js";
export { DailymotionEmbed } from "./dailymotion/index.js";
