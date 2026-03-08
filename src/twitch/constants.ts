/**
 * Provider constants: test URLs and IDs for Twitch.
 * Use these in tests and test pages so videos stay valid in one place.
 */

/** Regex to match twitch.tv/videos/{id} URLs. */
export const REGEX_VIDEO = /twitch\.tv\/videos\/(\d+)/;

/** Regex to match clips.twitch.tv/{slug} URLs. */
export const REGEX_CLIPS_HOST = /clips\.twitch\.tv\/([\w-]+)/;

/** Regex to match twitch.tv/.../clip/{slug} URLs. */
export const REGEX_CLIP = /twitch\.tv\/(?:[\w-]+\/)?clip\/([\w-]+)/;

/** Regex to match twitch.tv/{channel} URLs. */
export const REGEX_CHANNEL = /twitch\.tv\/([a-zA-Z0-9_]+)(?:\/|$|\?)/;

/** Video ID for createPlayer and video embeds. */
export const VIDEO_ID = "2398764730";

/** Full video URL for src attribute. */
export const VIDEO_SOURCE_URL = `https://www.twitch.tv/videos/${VIDEO_ID}`;

/** Clip slug for clip embeds. */
export const CLIP_SLUG = "BrightResourcefulLeopardSeemsGood-CVvpRL5aVhKwP6_U";

/** Full clip URL for src attribute. */
export const CLIP_SOURCE_URL = `https://clips.twitch.tv/${CLIP_SLUG}`;

/** Channel name for livestream embeds. */
export const CHANNEL_NAME = "twitch";

/** Full livestream URL for src attribute. */
export const CHANNEL_SOURCE_URL = `https://www.twitch.tv/${CHANNEL_NAME}`;
