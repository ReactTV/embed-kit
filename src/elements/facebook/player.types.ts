export type FacebookVideoEvent =
  | "startedPlaying"
  | "paused"
  | "finishedPlaying"
  | "startedBuffering"
  | "finishedBuffering"
  | "error";

export interface IFacebookVideoPlayer {
  play(): void;
  pause(): void;
  seek(seconds: number): void;
  mute(): void;
  unmute(): void;
  isMuted(): boolean;
  setVolume(volume: number): void;
  getVolume(): number;
  getCurrentPosition(): number;
  getDuration(): number;
  subscribe(
    event: FacebookVideoEvent,
    eventCallback: (e?: unknown) => void
  ): { release: (event: FacebookVideoEvent) => void };
}

export interface IFacebookXfbmlReadyMessage {
  type: string;
  id?: string;
  instance?: IFacebookVideoPlayer;
}
