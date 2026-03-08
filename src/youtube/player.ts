import type { IEmbedPlayer, IErrorData, TCreatePlayer } from "../_base/index.js";
import { createPlayerContainer, loadScript } from "../_base/index.js";

const YT_SCRIPT = "https://www.youtube.com/iframe_api";

declare global {
  interface Window {
    YT?: { Player: new (el: string | HTMLElement, opts: YTOptions) => YTPlayer };
    onYouTubeIframeAPIReady?: () => void;
  }
}

/** YouTube player state: 0 = ended, 1 = playing, 2 = paused, 3 = buffering, 5 = cued */
const YT_STATE_ENDED = 0;

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

  const needsProgressOrMute =
    options.onProgress !== undefined || options.onMute !== undefined;

  let currentTime = 0;
  let error: IErrorData | null = null;

  return loadYTScript().then(() => {
    const { element: div } = createPlayerContainer(container, "yt-player");

    const promise = new Promise<IEmbedPlayer>((resolve) => {
      new window.YT!.Player(div, {
        videoId: id,
        width,
        height,
        playerVars: { autoplay: autoplay ? 1 : 0 },
        events: {
          onError(ev: { data: number }) {
            error = { code: ev.data };
            onError(error);
          },
          onReady(ev: { target: YTPlayer }) {
            const player = ev.target;
            onReady();

            let progressIntervalId: ReturnType<typeof setInterval> | undefined;
            let destroyed = false;
            let muted: boolean | null = null;
            // YouTube IFrame API has no timeupdate/progress event and no volume/mute event; polling required.
            if (needsProgressOrMute) {
              progressIntervalId = setInterval(() => {
                if (destroyed) return;

                currentTime = player.getCurrentTime();
                if (typeof currentTime === "number" && !Number.isNaN(currentTime)) {
                  onProgress(currentTime);
                }

                const isMuted = player.isMuted();
                if (muted !== isMuted) {
                  muted = isMuted;
                  onMute(muted);
                }
              }, progressInterval);
            }
            resolve({
              get ready() {
                return Promise.resolve();
              },
              play: () => player.playVideo(),
              pause: () => player.pauseVideo(),
              get paused() {
                return Promise.resolve(player.getPlayerState() === 2); // 2 = paused
              },
              get currentTime() {
                return Promise.resolve(player.getCurrentTime());
              },
              get duration() {
                return Promise.resolve(player.getDuration());
              },
              seek(seconds: number) {
                player.seekTo(seconds, true);
                onSeek(seconds);
              },
              mute: () => {
                player.mute();
                onMute(true);
              },
              unmute: () => {
                player.unMute();
                onMute(false);
              },
              get muted() {
                return Promise.resolve(player.isMuted());
              },
              get error() {
                return error;
              },
              destroy() {
                destroyed = true;
                if (progressIntervalId) clearInterval(progressIntervalId);
                if (div.parentNode) div.remove();
              },
            });
          },
          onStateChange(ev: { data: number }) {
            if (ev.data === 1) onPlay(); // 1 = playing
            if (ev.data === 2) onPause(); // 2 = paused
            if (ev.data === 3) onBuffering(); // 3 = buffering
            if (ev.data === YT_STATE_ENDED) onEnded();
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
    });

    return promise.catch((err) => {
      div.remove();
      throw err;
    });
  });
};
