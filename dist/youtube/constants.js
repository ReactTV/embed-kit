/**
 * Provider constants: test URLs and IDs for YouTube.
 * Use these in tests and test pages so videos stay valid in one place.
 */
/** Regex to match youtube.com/watch?...v=... URLs. */
export const REGEX_WATCH = /(?:youtube\.com\/watch\?.*\bv=)([a-zA-Z0-9_-]{11})/;
/** Regex to match youtu.be/{id} short URLs. */
export const REGEX_SHORT = /youtu\.be\/([a-zA-Z0-9_-]{11})/;
/** Regex to match youtube.com/embed/{id} URLs. */
export const REGEX_EMBED = /youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/;
/** Video ID for createPlayer and video-id attribute. */
export const VIDEO_ID = "dQw4w9WgXcQ";
/** Full watch URL for src attribute. */
export const SOURCE_URL = `https://www.youtube.com/watch?v=${VIDEO_ID}`;
//# sourceMappingURL=constants.js.map