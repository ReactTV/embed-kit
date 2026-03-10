export const YT_PLAYER_STATE = {
  ENDED: 0,
  PLAYING: 1,
  PAUSED: 2,
  BUFFERING: 3,
  CUED: 5,
} as const;

declare global {
  interface Window {
    YT?: {
      Player: new (el: string | HTMLElement, opts: YTOptions) => YTPlayer;
      PlayerState: typeof YT_PLAYER_STATE;
    };
    onYouTubeIframeAPIReady?: () => void;
  }
}

export interface YTOptions {
  videoId: string;
  width?: number;
  height?: number;
  playerVars?: Record<string, number | string>;
  events?: {
    onReady?: (ev: { target: YTPlayer }) => void;
    onStateChange?: (ev: { data: number }) => void;
    onError?: (ev: { data: number }) => void;
    onPlaybackQualityChange?: (ev: { data: string }) => void;
    onPlaybackRateChange?: (ev: { data: number }) => void;
    onAutoplayBlocked?: () => void;
    onApiChange?: () => void;
  };
}

export interface YTPlayer {
  addEventListener: (event: string, callback: (data: any) => void) => void;
  playVideo: () => void;
  pauseVideo: () => void;
  getPlayerState: () => number;
  getCurrentTime: () => number;
  getDuration: () => number;
  seekTo: (seconds: number, allowSeekAhead: boolean) => void;
  mute: () => void;
  unMute: () => void;
  isMuted: () => boolean;
  getVolume: () => number;
  setVolume: (volume: number) => void;
}

export interface IYTVolumeChangeEvent {
  target: YTPlayer;
  data: { volume: number; muted: boolean; unstorable: boolean };
}

export interface IYTPlaybackRateChangeEvent {
  target: YTPlayer;
  data: number;
}

export interface IYTPlaybackQualityChangeEvent {
  target: YTPlayer;
  data: string;
}

export interface IVideoProgressEvent {
  target: YTPlayer;
  data: number; // milliseconds
}
