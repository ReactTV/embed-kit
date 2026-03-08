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
  onMute?: (muted: boolean) => void;
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

/** Returned by createPlayer(); normalized API across all providers. */
export interface IEmbedPlayer {
  play(): void | Promise<void>;
  pause(): void | Promise<void>;
  readonly paused: Promise<boolean>;
  readonly currentTime: Promise<number>;
  readonly duration: Promise<number>;
  seek(seconds: number): void | Promise<void>;
  mute(): void | Promise<void>;
  unmute(): void | Promise<void>;
  readonly muted: boolean;
  readonly error: IErrorData | null;
  destroy?(): void | Promise<void>;
}

export type TCreatePlayer = (
  container: HTMLElement,
  id: string,
  options?: ICreatePlayerOptions
) => Promise<IEmbedPlayer>;
