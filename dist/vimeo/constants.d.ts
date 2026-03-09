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
export declare const REGEX_PLAYER: RegExp;
/** Regex to match h= hash param in URL (unlisted videos). */
export declare const REGEX_HASH: RegExp;
/** Regex to match vimeo.com/{id} direct URLs. */
export declare const REGEX_DIRECT: RegExp;
/** Regex to match vimeo.com/channels/.../{id} URLs. */
export declare const REGEX_CHANNELS: RegExp;
/** Regex to match vimeo.com/groups/.../videos/{id} URLs. */
export declare const REGEX_GROUPS: RegExp;
/** Video ID for createPlayer and video-id attribute. */
export declare const VIDEO_ID = "1170179436";
/** For unlisted videos, set this from the embed URL (Share → Embed on Vimeo). Omit for public. */
export declare const VIMEO_HASH: string | undefined;
/** Full URL for src attribute (includes ?h= when VIMEO_HASH is set). */
export declare const SOURCE_URL: string;
//# sourceMappingURL=constants.d.ts.map