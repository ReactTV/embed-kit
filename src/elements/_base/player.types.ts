export interface IEmbedProgressEvent {
  target: { currentTime: number };
  detail: number;
}

export const DISPATCHED_EVENTS = {
  ready: "onReady",
  play: "onPlay",
  pause: "onPause",
  buffering: "onBuffering",
  ended: "onEnded",
  error: "onError",
  progress: "onProgress",
  durationchange: "onDurationChange",
  mute: "onMuteChange",
  volume: "onVolumeChange",
  playbackRateChange: "onPlaybackRateChange",
  playbackQualityChange: "onPlaybackQualityChange",
  cued: "onCued",
};

export type TDispatchedEventPayloads = {
  onReady: void;
  onPlay: void;
  onPause: void;
  onBuffering: void;
  onEnded: void;
  onCued: void;
  onProgress: number;
  onError: MediaError;
  onDurationChange: number;
  onMuteChange: boolean;
  onVolumeChange: number;
  onPlaybackRateChange: number;
  onPlaybackQualityChange: string;
};

/** Detail type for each dispatched event. Use `undefined` for events with no payload. */
export interface IDispatchedEventCallbacks {
  onReady?: () => void;
  onPlay?: () => void;
  onPause?: () => void;
  onBuffering?: () => void;
  onEnded?: () => void;
  onError?: (error: TDispatchedEventPayloads["onError"]) => void;
  onProgress?: (progress: TDispatchedEventPayloads["onProgress"]) => void;
  onDurationChange?: (duration: TDispatchedEventPayloads["onDurationChange"]) => void;
  onMuteChange?: (mute: TDispatchedEventPayloads["onMuteChange"]) => void;
  onVolumeChange?: (volume: TDispatchedEventPayloads["onVolumeChange"]) => void;
  onPlaybackRateChange?: (playbackRate: TDispatchedEventPayloads["onPlaybackRateChange"]) => void;
  onPlaybackQualityChange?: (
    playbackQuality: TDispatchedEventPayloads["onPlaybackQualityChange"]
  ) => void;
  onCued?: () => void;
}

/**
 * Public ref type for embed players. Typed as HTMLVideoElement so consuming apps
 * can use the ref like a native video element (play, pause, currentTime, etc.),
 * matching react-player and media-elements behavior.
 */
export type EmbedPlayerRef = HTMLVideoElement | null;
