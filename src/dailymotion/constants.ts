/**
 * Provider constants: test URLs and IDs for Dailymotion.
 * Use these in tests and test pages so videos stay valid in one place.
 */

/** Regex to match dailymotion.com/video/{id} URLs. */
export const REGEX_VIDEO = /dailymotion\.com\/video\/([a-zA-Z0-9]+)/;

/** Regex to match dai.ly/{id} short URLs. */
export const REGEX_SHORT = /dai\.ly\/([a-zA-Z0-9]+)/;

/** Regex to match dailymotion.com/embed/video/{id} URLs. */
export const REGEX_EMBED = /dailymotion\.com\/embed\/video\/([a-zA-Z0-9]+)/;

/** Video ID for createPlayer and video-id attribute. */
export const VIDEO_ID = "xcs52i";

/** Full URL for src attribute. */
export const SOURCE_URL = `https://www.dailymotion.com/video/${VIDEO_ID}`;
