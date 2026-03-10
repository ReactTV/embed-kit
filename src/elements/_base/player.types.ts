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

/**
 * Public ref type for embed players. Typed as HTMLVideoElement so consuming apps
 * can use the ref like a native video element (play, pause, currentTime, etc.),
 * matching react-player and media-elements behavior.
 */
export type EmbedPlayerRef = HTMLVideoElement | null;
