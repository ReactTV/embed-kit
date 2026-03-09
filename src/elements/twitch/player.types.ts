/**
 * Twitch embed postMessage types — strict shapes from observed messages only.
 * Namespace "twitch-embed-player-proxy": UPDATE_STATE.
 * Namespace "twitch-embed": seek, video.play, play, playing, ready, video.ready, offline, error.
 */

/** Params for eventName "UPDATE_STATE", namespace "twitch-embed-player-proxy". */
export interface ITwitchUpdateStateParams {
  channelID?: string;
  channelName?: string;
  collectionID?: string;
  currentTime: number;
  duration: number;
  ended: boolean;
  muted?: boolean;
  playback: string;
  qualitiesAvailable: string[];
  quality: string;
  stats: { videoStats?: unknown };
  videoID?: string;
  volume?: number;
}

/** Params for eventName "seek", namespace "twitch-embed". */
export interface ITwitchSeekParams {
  position: number;
}

/** Params for eventName "play" and "video.play", namespace "twitch-embed". */
export interface ITwitchPlayParams {
  sessionId: string;
}

/** Params for eventName "playing", "ready", "video.ready", "offline" — empty object. */
export type TTwitchEmptyParams = Record<string, never>;

/** Params for eventName "error", namespace "twitch-embed". */
export interface ITwitchErrorParams {
  message?: string;
}

/** Discriminated union of all observed Twitch embed postMessage payloads. */
export type TTwitchMessage =
  | {
      namespace: "twitch-embed-player-proxy";
      eventName: "UPDATE_STATE";
      params: ITwitchUpdateStateParams;
    }
  | { namespace: "twitch-embed"; eventName: "seek"; params: ITwitchSeekParams }
  | { namespace: "twitch-embed"; eventName: "video.play"; params: ITwitchPlayParams }
  | { namespace: "twitch-embed"; eventName: "play"; params: ITwitchPlayParams }
  | { namespace: "twitch-embed"; eventName: "playing"; params: TTwitchEmptyParams }
  | { namespace: "twitch-embed"; eventName: "ready"; params: TTwitchEmptyParams }
  | { namespace: "twitch-embed"; eventName: "video.ready"; params: TTwitchEmptyParams }
  | { namespace: "twitch-embed"; eventName: "offline"; params: TTwitchEmptyParams }
  | { namespace: "twitch-embed"; eventName: "error"; params?: ITwitchErrorParams };
