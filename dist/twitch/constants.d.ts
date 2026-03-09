/**
 * Provider constants: test URLs and IDs for Twitch.
 * Use these in tests and test pages so videos stay valid in one place.
 */
/** Embed origin for postMessage validation. */
export declare const EMBED_ORIGIN = "https://player.twitch.tv";
/** postMessage namespace for embed lifecycle events (ready, seek, play, etc.). */
export declare const NS_EMBED = "twitch-embed";
/** postMessage namespace for player control and UPDATE_STATE. */
export declare const NS_PLAYER_PROXY = "twitch-embed-player-proxy";
/**
 * Playback state strings from Twitch embed UPDATE_STATE.params.playback.
 * @see https://github.com/muxinc/media-elements/blob/main/packages/twitch-video-element/twitch-video-element.js
 */
export declare const PlaybackState: {
    readonly BUFFERING: "Buffering";
    readonly ENDED: "Ended";
    readonly IDLE: "Idle";
    readonly PAUSED: "Paused";
    readonly PLAYING: "Playing";
    readonly READY: "Ready";
};
/**
 * Numeric command codes for postMessage to the embed (namespace twitch-embed-player-proxy).
 * @see https://github.com/twitchdev/issues/issues/125
 */
export declare const PlayerCommands: {
    readonly DISABLE_CAPTIONS: 0;
    readonly ENABLE_CAPTIONS: 1;
    readonly PAUSE: 2;
    readonly PLAY: 3;
    readonly SEEK: 4;
    readonly SET_CHANNEL: 5;
    readonly SET_CHANNEL_ID: 6;
    readonly SET_COLLECTION: 7;
    readonly SET_QUALITY: 8;
    readonly SET_VIDEO: 9;
    readonly SET_MUTED: 10;
    readonly SET_VOLUME: 11;
};
/** Regex to match twitch.tv/videos/{id} URLs. */
export declare const REGEX_VIDEO: RegExp;
/** Regex to match clips.twitch.tv/{slug} URLs. */
export declare const REGEX_CLIPS_HOST: RegExp;
/** Regex to match twitch.tv/.../clip/{slug} URLs. */
export declare const REGEX_CLIP: RegExp;
/** Regex to match twitch.tv/{channel} URLs. */
export declare const REGEX_CHANNEL: RegExp;
/** Video ID for createPlayer and video embeds. */
export declare const VIDEO_ID = "2398764730";
/** Full video URL for src attribute. */
export declare const VIDEO_SOURCE_URL = "https://www.twitch.tv/videos/2398764730";
/** Clip slug for clip embeds. */
export declare const CLIP_SLUG = "BrightResourcefulLeopardSeemsGood-CVvpRL5aVhKwP6_U";
/** Full clip URL for src attribute. */
export declare const CLIP_SOURCE_URL = "https://clips.twitch.tv/BrightResourcefulLeopardSeemsGood-CVvpRL5aVhKwP6_U";
/** Channel name for livestream embeds. */
export declare const CHANNEL_NAME = "twitch";
/** Full livestream URL for src attribute. */
export declare const CHANNEL_SOURCE_URL = "https://www.twitch.tv/twitch";
//# sourceMappingURL=constants.d.ts.map