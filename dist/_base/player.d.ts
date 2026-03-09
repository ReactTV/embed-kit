/**
 * Normalized player API and options.
 * createPlayer(container, id, options) returns an IEmbedPlayer; options callbacks use the I*Data types.
 */
/** Options passed to createPlayer(); callbacks receive the I*Data types below. */
export interface ICreatePlayerOptions {
    width?: number;
    height?: number;
    /** Full source URL for the embed. Used by the class-based player for the .src property. */
    url?: string;
    autoplay?: boolean;
    /** Initial volume 0–1. Not all providers support volume (e.g. some iframe embeds). */
    volume?: number;
    onReady?: () => void;
    onPlay?: () => void;
    onPause?: () => void;
    onBuffering?: () => void;
    onEnded?: () => void;
    onProgress?: (currentTime: number) => void;
    /** Fired when duration is known or changes (e.g. after metadata load, or live stream updates). */
    onDurationChange?: (duration: number) => void;
    /** Fired when a seek starts (e.g. user drags the progress bar). Use with onSeek (seek complete) for isSeeking UI. */
    onSeeking?: () => void;
    onSeek?: (currentTime: number) => void;
    onMute?: (data: IMuteData) => void;
    onError?: (data: IErrorData) => void;
    /** Fired when playback quality changes (e.g. resolution). YouTube: ev.data is quality string. */
    onPlaybackQualityChange?: (quality: string) => void;
    /** Fired when playback rate changes. YouTube: ev.data is new rate (number). */
    onPlaybackRateChange?: (rate: number) => void;
    /** Fired when autoplay was requested but blocked by the browser. */
    onAutoplayBlocked?: () => void;
    /** Fired when the player loads/unloads a module (e.g. captions). YouTube-specific. */
    onApiChange?: () => void;
    progressInterval?: number;
    /** Show native player controls. Default true. YouTube: playerVars.controls. */
    controls?: boolean;
    /** Load captions by default when available. YouTube: playerVars.cc_load_policy (1 = on, 0 = off). */
    enableCaptions?: boolean;
    /** Show video annotations (e.g. YouTube cards/overlays). YouTube: playerVars.iv_load_policy (1 = show, 3 = hide). */
    showAnnotations?: boolean;
    /** Provider-specific config. e.g. config.youtube.origin, config.vimeo.title. */
    config?: {
        youtube?: Record<string, number | string | undefined>;
        vimeo?: Record<string, number | string | undefined>;
    };
    [key: string]: unknown;
}
export interface IErrorData {
    code?: number | string;
    message?: string;
}
/** Payload for onMute callback. */
export interface IMuteData {
    muted: boolean;
}
/** Progress payload (e.g. currentTime, duration). Used by some providers. */
export interface IProgressData {
    currentTime: number;
    duration?: number;
}
/** Seek payload. Used by some providers. */
export interface ISeekData {
    currentTime: number;
}
/**
 * Normalized player state shape shared across embed providers.
 * Providers use this type (or extend it with & { ... }) for their internal state object.
 */
export interface TPlayerState {
    currentTime: number;
    duration: number;
    isPlaying: boolean;
    isPaused: boolean;
    muted: boolean;
    /** Volume 0–1 when supported by the provider. */
    volume?: number;
    error: IErrorData | null;
}
/** Returned by createPlayer(); normalized API across all providers. */
export interface IEmbedPlayer {
    play(): void | Promise<void>;
    pause(): void | Promise<void>;
    seek(seconds: number): void | Promise<void>;
    mute(): void | Promise<void>;
    unmute(): void | Promise<void>;
    destroy?(): void | Promise<void>;
    readonly paused: boolean;
    readonly currentTime: number;
    readonly duration: number;
    readonly muted: boolean;
    /** Volume 0–1. Undefined if the provider does not support volume or not yet known. */
    readonly volume?: number | undefined;
    /** Set volume 0–1. No-op if the provider does not support it. */
    setVolume?(volume: number): void | Promise<void>;
    /** Request picture-in-picture. Not supported by all providers (e.g. iframe embeds). */
    requestPictureInPicture?(): Promise<void>;
    readonly error: IErrorData | null;
}
export type TCreatePlayer = (container: HTMLElement, id: string, options?: ICreatePlayerOptions) => Promise<IEmbedPlayer>;
//# sourceMappingURL=player.d.ts.map