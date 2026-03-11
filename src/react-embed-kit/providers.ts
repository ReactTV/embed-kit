import { REGEX_WATCH, REGEX_SHORT, REGEX_EMBED } from "../elements/youtube/constants.js";
import { REGEX_VIDEO as TWITCH_VIDEO, REGEX_CLIPS_HOST, REGEX_CLIP, REGEX_CHANNEL } from "../elements/twitch/constants.js";
import { REGEX_PLAYER as TIKTOK_PLAYER, REGEX_VM, REGEX_VIDEO as TIKTOK_VIDEO, REGEX_EMBED as TIKTOK_EMBED, REGEX_SHARE as TIKTOK_SHARE } from "../elements/tiktok/constants.js";
import { REGEX_VIDEO as DM_VIDEO, REGEX_SHORT as DM_SHORT, REGEX_EMBED as DM_EMBED } from "../elements/dailymotion/constants.js";
import {
  REGEX_PLAYER as VIMEO_PLAYER,
  REGEX_DIRECT,
  REGEX_CHANNELS,
  REGEX_GROUPS,
} from "../elements/vimeo/constants.js";

export const EMBED_TAG = {
  YOUTUBE: "youtube-video",
  TWITCH: "twitch-video",
  TIKTOK: "tiktok-video",
  DAILYMOTION: "dailymotion-video",
  VIMEO: "vimeo-video",
} as const;

export type EmbedTagName = (typeof EMBED_TAG)[keyof typeof EMBED_TAG];

export interface ResolvedEmbed {
  tagName: EmbedTagName;
  url: string;
}

function match(url: string, regex: RegExp): boolean {
  return regex.test(url.trim());
}

/**
 * Parses a URL and returns the matching embed tag name and the URL to use as src.
 * Tries each built-in provider (YouTube, Twitch, TikTok, Dailymotion, Vimeo) in order.
 */
export function getProviderForUrl(url: string): ResolvedEmbed | null {
  const trimmed = url?.trim();
  if (!trimmed) return null;

  if (match(trimmed, REGEX_WATCH) || match(trimmed, REGEX_SHORT) || match(trimmed, REGEX_EMBED)) {
    return { tagName: EMBED_TAG.YOUTUBE, url: trimmed };
  }
  if (
    match(trimmed, TWITCH_VIDEO) ||
    match(trimmed, REGEX_CLIPS_HOST) ||
    match(trimmed, REGEX_CLIP) ||
    match(trimmed, REGEX_CHANNEL)
  ) {
    return { tagName: EMBED_TAG.TWITCH, url: trimmed };
  }
  if (
    match(trimmed, TIKTOK_PLAYER) ||
    match(trimmed, REGEX_VM) ||
    match(trimmed, TIKTOK_VIDEO) ||
    match(trimmed, TIKTOK_EMBED) ||
    match(trimmed, TIKTOK_SHARE)
  ) {
    return { tagName: EMBED_TAG.TIKTOK, url: trimmed };
  }
  if (match(trimmed, DM_VIDEO) || match(trimmed, DM_SHORT) || match(trimmed, DM_EMBED)) {
    return { tagName: EMBED_TAG.DAILYMOTION, url: trimmed };
  }
  if (
    match(trimmed, VIMEO_PLAYER) ||
    match(trimmed, REGEX_DIRECT) ||
    match(trimmed, REGEX_CHANNELS) ||
    match(trimmed, REGEX_GROUPS)
  ) {
    return { tagName: EMBED_TAG.VIMEO, url: trimmed };
  }
  return null;
}

const PLAYER_MODULE_PATHS: Record<EmbedTagName, () => Promise<unknown>> = {
  [EMBED_TAG.YOUTUBE]: () => import("../elements/youtube/player.js"),
  [EMBED_TAG.TWITCH]: () => import("../elements/twitch/player.js"),
  [EMBED_TAG.TIKTOK]: () => import("../elements/tiktok/player.js"),
  [EMBED_TAG.DAILYMOTION]: () => import("../elements/dailymotion/player.js"),
  [EMBED_TAG.VIMEO]: () => import("../elements/vimeo/player.js"),
};

const loadedTags = new Set<EmbedTagName>();

/**
 * Ensures the custom element for the given tag is defined by loading its player module.
 */
export function loadPlayerModule(tagName: EmbedTagName): Promise<void> {
  if (loadedTags.has(tagName)) return Promise.resolve();
  const loader = PLAYER_MODULE_PATHS[tagName];
  if (!loader) return Promise.resolve();
  return loader().then(() => {
    loadedTags.add(tagName);
  });
}
