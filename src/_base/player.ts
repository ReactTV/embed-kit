/**
 * Normalized player API and options.
 * createPlayer(container, id, options) returns an IEmbedPlayer; options callbacks use the I*Data types.
 */

/** Options passed to createPlayer(); callbacks receive the I*Data types below. */
export interface ICreatePlayerOptions {
  width?: string | number;
  height?: string | number;
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
  [key: string]: unknown;
}

export interface IErrorData {
  code?: number | string;
  message?: string;
}

/** Returned by createPlayer(); normalized API across all providers. */
export interface IEmbedPlayer {
  readonly ready: Promise<void>;
  play(): void | Promise<void>;
  pause(): void | Promise<void>;
  readonly paused: Promise<boolean>;
  readonly currentTime: Promise<number>;
  readonly duration: Promise<number>;
  seek(seconds: number): void | Promise<void>;
  mute(): void | Promise<void>;
  unmute(): void | Promise<void>;
  readonly muted: Promise<boolean>;
  readonly error: IErrorData | null;
  destroy?(): void | Promise<void>;
}

export type TCreatePlayer = (
  container: HTMLElement,
  id: string,
  options?: ICreatePlayerOptions
) => Promise<IEmbedPlayer>;
