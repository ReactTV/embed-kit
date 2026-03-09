/**
 * Provider constants: test URLs and IDs for TikTok.
 * Use these in tests and test pages so videos stay valid in one place.
 */
/** Regex to match tiktok.com/player/v1/{id} URLs. */
export const REGEX_PLAYER = /tiktok\.com\/player\/v1\/(\d+)/;
/** Regex to match vm.tiktok.com/{id} or vt.tiktok.com/{id} short URLs. */
export const REGEX_VM = /(?:vm|vt)\.tiktok\.com\/([\w-]+)/;
/** Regex to match tiktok.com/@{user}/video/{id} URLs. */
export const REGEX_VIDEO = /tiktok\.com\/@[\w.-]+\/video\/(\d+)/;
/** Regex to match tiktok.com/embed/v2/{id} URLs. */
export const REGEX_EMBED = /tiktok\.com\/embed\/v2\/(\d+)/;
/** Video ID for video-id attribute. */
export const VIDEO_ID = "7531511760524692750";
/** Full player URL for src attribute (embed format: player/v1/:id). */
export const SOURCE_URL = `https://www.tiktok.com/player/v1/${VIDEO_ID}`;
//# sourceMappingURL=constants.js.map