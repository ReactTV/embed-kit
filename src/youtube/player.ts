import type { IEmbedPlayer, TCreatePlayer, TPlayerState } from "../_base/index.js";
import { createPlayerContainer, loadScript } from "../_base/index.js";

const YT_SCRIPT = "https://www.youtube.com/iframe_api";

declare global {
  interface Window {
    YT?: {
      Player: new (el: string | HTMLElement, opts: YTOptions) => YTPlayer;
      PlayerState: { ENDED: 0; PLAYING: 1; PAUSED: 2; BUFFERING: 3; CUED: 5 };
    };
    onYouTubeIframeAPIReady?: () => void;
  }
}

interface YTOptions {
  videoId: string;
  width?: number;
  height?: number;
  playerVars?: { autoplay?: 0 | 1 };
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

interface YTPlayer {
  playVideo: () => void;
  pauseVideo: () => void;
  getPlayerState: () => number; // 1=playing, 2=paused, etc.
  getCurrentTime: () => number; // seconds
  getDuration: () => number; // seconds (0 until metadata loaded)
  seekTo: (seconds: number, allowSeekAhead: boolean) => void;
  mute: () => void;
  unMute: () => void;
  isMuted: () => boolean;
}

function loadYTScript(): Promise<void> {
  return loadScript(YT_SCRIPT, {
    isLoaded: () => !!window.YT?.Player,
    ready: () =>
      new Promise((resolve) => {
        const prev = window.onYouTubeIframeAPIReady;
        window.onYouTubeIframeAPIReady = () => {
          prev?.();
          resolve();
        };
      }),
    errorMessage: "Failed to load YouTube iframe API",
  });
}

/**
 * Create a controllable YouTube player in the given container.
 * Returns a normalized IEmbedPlayer (play, pause, getPaused).
 */
export const createPlayer: TCreatePlayer = (container, id, options = {}) => {
  const {
    width = 560,
    height = 315,
    autoplay = false,
    onReady = () => {},
    onPlay = () => {},
    onPause = () => {},
    onBuffering = () => {},
    onEnded = () => {},
    onProgress = () => {},
    onSeek = () => {},
    onMute = () => {},
    onError = () => {},
    onPlaybackQualityChange = () => {},
    onPlaybackRateChange = () => {},
    onAutoplayBlocked = () => {},
    onApiChange = () => {},
    progressInterval = 50,
  } = options;

  const playerState: TPlayerState = {
    currentTime: 0,
    duration: 0,
    isPlaying: false,
    isPaused: true,
    muted: false,
    error: null,
  };

  return loadYTScript().then(() => {
    const { element: div } = createPlayerContainer(container, "yt-player");
    const YT = window.YT!;
    const { PlayerState } = YT;

    let player: YTPlayer | null = null;
    let resolveWhenReady!: () => void;
    const whenReady = new Promise<void>((r) => {
      resolveWhenReady = r;
    });

    const readyState = {
      progressIntervalId: undefined as ReturnType<typeof setInterval> | undefined,
      destroyed: false,
      muted: null as boolean | null,
    };

    const api: IEmbedPlayer = {
      play: () => whenReady.then(() => player!.playVideo()),
      pause: () => whenReady.then(() => player!.pauseVideo()),
      get paused() {
        return whenReady.then(() => player!.getPlayerState() === PlayerState.PAUSED);
      },
      get currentTime() {
        return whenReady.then(() => player!.getCurrentTime());
      },
      get duration() {
        return whenReady.then(() => player!.getDuration());
      },
      seek(seconds: number) {
        whenReady.then(() => {
          player!.seekTo(seconds, true);
          onSeek(seconds);
        });
      },
      mute: () =>
        whenReady.then(() => {
          player!.mute();
          onMute(true);
        }),
      unmute: () =>
        whenReady.then(() => {
          player!.unMute();
          onMute(false);
        }),
      get muted() {
        return readyState.muted ?? false;
      },
      get error() {
        return playerState.error;
      },
      destroy() {
        readyState.destroyed = true;
        if (readyState.progressIntervalId) clearInterval(readyState.progressIntervalId);
        if (div.parentNode) div.remove();
      },
    };

    new YT.Player(div, {
      videoId: id,
      width,
      height,
      playerVars: { autoplay: autoplay ? 1 : 0 },
      events: {
        onError(ev: { data: number }) {
          playerState.error = { code: ev.data };
          onError(playerState.error);
        },
        onReady(ev: { target: YTPlayer }) {
          player = ev.target;
          onReady();
          resolveWhenReady();

          // YouTube IFrame API has no timeupdate/progress event and no volume/mute event; polling required.
          readyState.progressIntervalId = setInterval(() => {
            if (readyState.destroyed || !player) return;

            playerState.currentTime = player.getCurrentTime();
            if (
              typeof playerState.currentTime === "number" &&
              !Number.isNaN(playerState.currentTime)
            ) {
              onProgress(playerState.currentTime);
            }

            const isMuted = player.isMuted();
            if (readyState.muted !== isMuted) {
              readyState.muted = isMuted;
              onMute(readyState.muted);
            }
          }, progressInterval);
        },
        onStateChange(ev: { data: number }) {
          if (ev.data === PlayerState.PLAYING) onPlay();
          if (ev.data === PlayerState.PAUSED) onPause();
          if (ev.data === PlayerState.BUFFERING) onBuffering();
          if (ev.data === PlayerState.ENDED) onEnded();
        },
        onPlaybackQualityChange(ev: { data: string }) {
          onPlaybackQualityChange(ev.data);
        },
        onPlaybackRateChange(ev: { data: number }) {
          onPlaybackRateChange(ev.data);
        },
        onAutoplayBlocked() {
          onAutoplayBlocked();
        },
        onApiChange() {
          onApiChange();
        },
      },
    });

    return Promise.resolve(api).catch((err: unknown) => {
      div.remove();
      throw err;
    });
  });
};
