/**
 * Provider constants: test URLs and IDs for Twitch.
 * Use these in tests and test pages so videos stay valid in one place.
 */
/** Embed origin for postMessage validation. */
export const EMBED_ORIGIN = "https://player.twitch.tv";
/** postMessage namespace for embed lifecycle events (ready, seek, play, etc.). */
export const NS_EMBED = "twitch-embed";
/** postMessage namespace for player control and UPDATE_STATE. */
export const NS_PLAYER_PROXY = "twitch-embed-player-proxy";
/**
 * Playback state strings from Twitch embed UPDATE_STATE.params.playback.
 * @see https://github.com/muxinc/media-elements/blob/main/packages/twitch-video-element/twitch-video-element.js
 */
export const PlaybackState = {
    BUFFERING: "Buffering",
    ENDED: "Ended",
    IDLE: "Idle",
    PAUSED: "Paused",
    PLAYING: "Playing",
    READY: "Ready",
};
/**
 * Numeric command codes for postMessage to the embed (namespace twitch-embed-player-proxy).
 * @see https://github.com/twitchdev/issues/issues/125
 */
export const PlayerCommands = {
    DISABLE_CAPTIONS: 0,
    ENABLE_CAPTIONS: 1,
    PAUSE: 2,
    PLAY: 3,
    SEEK: 4,
    SET_CHANNEL: 5,
    SET_CHANNEL_ID: 6,
    SET_COLLECTION: 7,
    SET_QUALITY: 8,
    SET_VIDEO: 9,
    SET_MUTED: 10,
    SET_VOLUME: 11,
};
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
//# sourceMappingURL=constants.js.map