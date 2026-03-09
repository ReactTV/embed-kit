/**
 * Vimeo Player SDK event data types.
 * @see https://developer.vimeo.com/player/sdk/reference
 */

/** Event data for timeupdate (see https://developer.vimeo.com/player/sdk/reference#timeupdate) */
export interface IVimeoTimeupdateData {
  percent: number;
  seconds: number;
  duration: number;
}

/** Event data for volumechange (see https://developer.vimeo.com/player/sdk/reference#volumechange) */
export interface IVimeoVolumechangeData {
  volume: number;
  muted: boolean;
}

/** Event data for error (see https://developer.vimeo.com/player/sdk/reference#error) */
export interface IVimeoErrorData {
  message?: string;
  method?: string;
  name?: string;
}

export type TVimeoEventData = IVimeoTimeupdateData | IVimeoVolumechangeData | IVimeoErrorData;

export interface IVimeoPlayer {
  ready?: () => Promise<void>;
  play: () => Promise<void>;
  pause: () => Promise<void>;
  getPaused: () => Promise<boolean>;
  getCurrentTime: () => Promise<number>;
  getDuration: () => Promise<number>;
  setCurrentTime: (seconds: number) => Promise<number>;
  getMuted: () => Promise<boolean>;
  setMuted: (muted: boolean) => Promise<void>;
  getVolume: () => Promise<number>; // 0-1
  setVolume: (volume: number) => Promise<number>; // 0-1
  on: (event: string, callback: (data: TVimeoEventData) => void) => void;
  destroy: () => void;
}
