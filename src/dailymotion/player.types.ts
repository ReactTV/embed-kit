// https://developers.dailymotion.com/docs/listen-to-player-events-web
// https://developers.dailymotion.com/reference/web-sdk-player-events

/** Event name constants from dailymotion.events (Web SDK). */
export interface DailymotionEvents {
  VIDEO_PLAY: string;
  VIDEO_PAUSE: string;
  VIDEO_BUFFERING: string;
  VIDEO_END: string;
  VIDEO_TIMECHANGE: string;
  PLAYER_ERROR: string;
  VIDEO_ERROR?: string;
}

/**
 * Player state object from getState() and event callbacks (e.g. VIDEO_TIMECHANGE).
 * @see https://developers.dailymotion.com/reference/web-sdk-player-events
 */
export interface DailymotionPlayerState {
  event?: string;
  id?: string;

  // Ad
  adAdvertiserName?: string | null;
  adBreakId?: string | null;
  adCompanion?: unknown;
  adCreativeAdId?: string | null;
  adCreativeId?: string | null;
  adDescription?: string | null;
  adDuration?: number;
  adEndedReason?: string | null;
  adError?: unknown;
  adId?: string | null;
  adIsPlaying?: boolean;
  adIsSkippable?: boolean;
  adPosition?: number | null;
  adSkipOffset?: number;
  adTime?: number;
  adTitle?: string | null;
  adWidth?: number;

  // Player
  playerAspectRatio?: string;
  playerError?: unknown;
  playerInstanceId?: string;
  playerIsAlertDialogDisplayed?: boolean;
  playerIsBuffering?: boolean;
  playerIsCriticalPathReady?: boolean;
  playerIsMuted?: boolean;
  playerIsNavigationEnabled?: boolean;
  playerIsPlaybackAllowed?: boolean;
  playerIsPlaying?: boolean;
  playerIsReplayScreen?: boolean;
  playerIsStartScreen?: boolean;
  playerIsViewable?: boolean;
  playerNextVideo?: string;
  playerPip?: unknown;
  playerPipDisplay?: string;
  playerPipIsExpanded?: boolean;
  playerPipStatus?: string;
  playerPlaybackPermissionReason?: string;
  playerPlaybackSpeed?: number;
  playerPresentationMode?: string;
  playerRecommendedVideosDisplayed?: unknown[];
  playerScaleMode?: string;
  playerVolume?: number;

  // Video
  videoAspectRatio?: number;
  videoCreatedTime?: number;
  videoDuration?: number;
  videoId?: string;
  videoIsPasswordRequired?: boolean;
  videoLoadedFrom?: string | null;
  videoOwnerAvatars?: Record<number, string>;
  videoOwnerId?: string;
  videoOwnerScreenname?: string;
  videoOwnerUsername?: string;
  videoQualitiesList?: string[];
  videoQuality?: string;
  videoSubtitles?: unknown;
  videoSubtitlesList?: unknown[];
  videoThumbnails?: Record<number, string>;
  videoTime?: number;
  videoTitle?: string;
  videoViewId?: string;
}

export interface DailymotionPlayer {
  play: () => void;
  pause: () => void;
  getState: () => Promise<DailymotionPlayerState>;
  getDuration?: () => Promise<number>;
  getPosition?: () => Promise<number>;
  seek: (seconds: number) => void | Promise<void>;
  setMute: (muted: boolean) => void;
  on(event: string, callback?: (state: DailymotionPlayerState) => void): void;
  destroy: () => void;
}

declare global {
  interface Window {
    dailymotion?: {
      createPlayer: (
        containerId: string,
        options: { video: string; params?: Record<string, unknown> }
      ) => Promise<DailymotionPlayer>;
      /** Event name constants; static and always available once the SDK is loaded. */
      events: DailymotionEvents;
    };
  }
}
