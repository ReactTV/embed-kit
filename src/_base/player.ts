/**
 * Normalized player API and options.
 * createPlayer(container, id, options) returns an IEmbedPlayer; options callbacks use the I*Data types.
 */

/** Options passed to createPlayer(); callbacks receive the I*Data types below. */
export interface ICreatePlayerOptions {
  width?: number;
  height?: number;
  autoplay?: boolean;
  onReady?: () => void;
  onPlay?: () => void;
  onPause?: () => void;
  onBuffering?: () => void;
  onEnded?: () => void;
  onProgress?: (currentTime: number) => void;
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
  readonly error: IErrorData | null;
}

export type TCreatePlayer = (
  container: HTMLElement,
  id: string,
  options?: ICreatePlayerOptions
) => Promise<IEmbedPlayer>;
