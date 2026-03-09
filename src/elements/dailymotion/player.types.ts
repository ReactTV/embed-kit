// https://developers.dailymotion.com/docs/listen-to-player-events-web
// https://developers.dailymotion.com/reference/web-sdk-player-events

/** Event name constants from dailymotion.events (Web SDK). */
export interface DailymotionEvents {
  AD_CLICK: "ad_click";
  AD_COMPANIONSREADY: "ad_companions";
  AD_DURATIONCHANGE: "ad_durationchange";
  AD_END: "ad_end";
  AD_ERROR: "ad_error";
  AD_IMPRESSION: "ad_impression";
  AD_LOADED: "ad_loaded";
  AD_PAUSE: "ad_pause";
  AD_PLAY: "ad_play";
  AD_READYTOFETCH: "ad_readytofetch";
  AD_START: "ad_start";
  AD_TIMECHANGE: "ad_timeupdate";
  PLAYER_ASPECTRATIOCHANGE: "pes_aspectratiochange";
  PLAYER_CRITICALPATHREADY: "playback_ready";
  PLAYER_END: "end";
  PLAYER_ERROR: "error";
  PLAYER_HEAVYADSINTERVENTION: "player_heavyadsintervention";
  PLAYER_PIPEXPANDEDCHANGE: "pes_pipexpandedchange";
  PLAYER_PLAYBACKPERMISSION: "playback_resolution";
  PLAYER_PLAYBACKSPEEDCHANGE: "playbackspeedchange";
  PLAYER_POSTERDISPLAY: "posterdisplay";
  PLAYER_PRESENTATIONMODECHANGE: "pes_presentationmodechange";
  PLAYER_RECODISPLAY: "recodisplay";
  PLAYER_SCALEMODECHANGE: "pes_scalemodechange";
  PLAYER_START: "start";
  PLAYER_VIDEOCHANGE: "videochange";
  PLAYER_VIDEOLISTCHANGE: "videolistchange";
  PLAYER_VIEWABILITYCHANGE: "pes_viewabilitychange";
  PLAYER_VOLUMECHANGE: "volumechange";
  VIDEO_BUFFERING: "waiting";
  VIDEO_DURATIONCHANGE: "video_durationchange";
  VIDEO_END: "video_end";
  VIDEO_PAUSE: "pause";
  VIDEO_PLAY: "play";
  VIDEO_PLAYING: "playing";
  VIDEO_PROGRESS: "progress";
  VIDEO_QUALITIESREADY: "qualitiesavailable";
  VIDEO_QUALITYCHANGE: "qualitychange";
  VIDEO_SEEKEND: "seeked";
  VIDEO_SEEKSTART: "seeking";
  VIDEO_START: "video_start";
  VIDEO_SUBTITLESCHANGE: "subtitlechange";
  VIDEO_SUBTITLESREADY: "subtitlesavailable";
  VIDEO_TIMECHANGE: "timeupdate";
  /** Optional; not present in all SDK versions. */
  VIDEO_ERROR?: string;
}

/**
 * Player state object from getState() and event callbacks (e.g. VIDEO_TIMECHANGE, PLAYER_VOLUMECHANGE).
 * Payload shape when event is "playerstate" or from state-change events.
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
  videoIsCreatedForKids?: boolean;
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
  setVolume?: (volume: number) => void; // 0-1
  getVolume?: () => number; // 0-1
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
