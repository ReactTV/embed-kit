/**
 * Normalized player API and options.
 * Embed elements are typed as HTMLVideoElement (EmbedPlayerRef) for consumers.
 */
export interface ICreatePlayerOptions {
  width?: number;
  height?: number;
  url?: string;
  autoplay?: boolean;
  muted?: boolean;
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

/**
 * Public ref type for embed players. Typed as HTMLVideoElement so consuming apps
 * can use the ref like a native video element (play, pause, currentTime, etc.),
 * matching react-player and media-elements behavior.
 */
export type EmbedPlayerRef = HTMLVideoElement | null;

export type TCreatePlayer = (
  container: HTMLElement,
  id: string,
  options?: ICreatePlayerOptions
) => Promise<NonNullable<EmbedPlayerRef>>;
