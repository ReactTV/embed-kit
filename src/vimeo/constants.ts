/**
 * Provider constants: test URLs and IDs for Vimeo.
 * Use these in tests and test pages so videos stay valid in one place.
 *
 * If embeds show "video does not exist":
 * 1. Testing from localhost: In Vimeo → video → Settings → Privacy → Embed,
 *    add "localhost" (or your domain) to the allowed list.
 * 2. Unlisted videos: Get the embed code from Vimeo (Share → Embed) and copy
 *    the `h=...` value from the URL; set VIMEO_HASH below or pass options.vimeoHash.
 */

/** Regex to match player.vimeo.com/video/{id} URLs. */
export const REGEX_PLAYER = /player\.vimeo\.com\/video\/(\d+)/;

/** Regex to match h= hash param in URL (unlisted videos). */
export const REGEX_HASH = /[?&]h=([^&]+)/;

/** Regex to match vimeo.com/{id} direct URLs. */
export const REGEX_DIRECT = /vimeo\.com\/(\d+)(?:\/|$|\?)/;

/** Regex to match vimeo.com/channels/.../{id} URLs. */
export const REGEX_CHANNELS = /vimeo\.com\/channels\/[\w-]+\/(\d+)/;

/** Regex to match vimeo.com/groups/.../videos/{id} URLs. */
export const REGEX_GROUPS = /vimeo\.com\/groups\/[\w-]+\/videos\/(\d+)/;

/** Video ID for createPlayer and video-id attribute. */
export const VIDEO_ID = "1170179436";

/** For unlisted videos, set this from the embed URL (Share → Embed on Vimeo). Omit for public. */
export const VIMEO_HASH: string | undefined = undefined;

/** Full URL for src attribute (includes ?h= when VIMEO_HASH is set). */
export const SOURCE_URL = VIMEO_HASH
  ? `https://vimeo.com/${VIDEO_ID}?h=${VIMEO_HASH}`
  : `https://vimeo.com/${VIDEO_ID}`;
