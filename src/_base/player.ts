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
  onEnded?: () => void;
  onProgress?: (data: IProgressData) => void;
  onMute?: (data: IMuteData) => void;
  onError?: (data: IErrorData) => void;
  [key: string]: unknown;
}

export interface IProgressData {
  currentTime: number;
  duration?: number;
}

export interface IMuteData {
  muted: boolean;
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
  readonly autoplay: Promise<boolean>;
  mute(): void | Promise<void>;
  unmute(): void | Promise<void>;
  readonly muted: Promise<boolean>;
  readonly lastError: IErrorData | null;
  destroy?(): void | Promise<void>;
}

export type TCreatePlayer = (
  container: HTMLElement,
  id: string,
  options?: ICreatePlayerOptions
) => Promise<IEmbedPlayer>;
