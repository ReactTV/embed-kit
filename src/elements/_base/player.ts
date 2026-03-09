/**
 * Normalized player API and options.
 * createPlayer(container, id, options) returns an IEmbedPlayer; options callbacks use the I*Data types.
 */
export interface ICreatePlayerOptions {
  width?: number;
  height?: number;
  url?: string;
  autoplay?: boolean;
  volume?: number;
  onReady?: () => void;
  onPlay?: () => void;
  onPause?: () => void;
  onBuffering?: () => void;
  onEnded?: () => void;
  onProgress?: (event: IEmbedProgressEvent) => void;
  onDurationChange?: (duration: number) => void;
  onSeeking?: () => void;
  onSeek?: (currentTime: number) => void;
  onMute?: (data: IMuteData) => void;
  onError?: (data: IErrorData) => void;
  onPlaybackQualityChange?: (quality: string) => void;
  onPlaybackRateChange?: (rate: number) => void;
  onAutoplayBlocked?: () => void;
  onApiChange?: () => void;
  progressInterval?: number;
  controls?: boolean;
  enableCaptions?: boolean;
  showAnnotations?: boolean;
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

export interface IMuteData {
  muted: boolean;
}

export interface IEmbedProgressEvent {
  target: { currentTime: number };
  detail: number;
}

export interface IProgressData {
  currentTime: number;
  duration?: number;
}

export interface ISeekData {
  currentTime: number;
}

export interface TPlayerState {
  currentTime: number;
  duration: number;
  isPlaying: boolean;
  isPaused: boolean;
  muted: boolean;
  volume?: number;
  error: MediaError | null;
}

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
  readonly volume?: number | undefined;
  setVolume?(volume: number): void | Promise<void>;
  requestPictureInPicture?(): Promise<void>;
  readonly error: MediaError | null;
}

export type TCreatePlayer = (
  container: HTMLElement,
  id: string,
  options?: ICreatePlayerOptions
) => Promise<IEmbedPlayer>;
