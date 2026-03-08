import type { IErrorData, TCreatePlayer } from "../_base/index.js";

const DAILYMOTION_LIB = "https://geo.dailymotion.com/libs/player.js";

declare global {
  interface Window {
    dailymotion?: {
      createPlayer: (
        containerId: string,
        options: { video: string; params?: Record<string, unknown> }
      ) => Promise<DailymotionPlayer>;
    };
  }
}

interface DailymotionPlayerState {
  playerIsPlaying?: boolean;
  videoTime?: number; // current playback position in seconds (from getState / VIDEO_TIMECHANGE)
  videoDuration?: number; // total duration in seconds
}

interface DailymotionPlayer {
  play: () => void;
  pause: () => void;
  getState: () => Promise<DailymotionPlayerState>;
  getDuration?: () => Promise<number>; // seconds; optional in SDK
  getPosition?: () => Promise<number>; // seconds; optional in SDK
  seek?: (seconds: number) => void | Promise<void>;
  /** Web SDK: set mute mode (true = muted, false = unmuted). */
  setMute?: (muted: boolean) => void;
  /** Preferred: SDK uses .on(eventName, callback) for events (e.g. "video_end"). */
  on?: (event: string, callback: () => void) => void;
  addEventListener?: (event: string, callback: () => void) => void;
  destroy: () => void;
}

function loadDailymotionScript(): Promise<void> {
  if (window.dailymotion?.createPlayer) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = DAILYMOTION_LIB;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load Dailymotion player script"));
    document.head.appendChild(script);
  });
}

/**
 * Create a controllable Dailymotion player. The SDK finds the mount element by id via
 * document.getElementById. The container must be in the light DOM (e.g. a direct child
 * of the host element) so the SDK can find it; the base controllable element mounts there.
 */
export const createPlayer: TCreatePlayer = (container, id, options = {}) => {
  const { width = 560, height = 315, autoplay = false, onReady, onPlay, onPause, onBuffering, onEnded, onProgress, onSeek, onMute, onError } = options;
  const widthStyle = typeof width === "number" ? `${width}px` : String(width);
  const heightStyle = typeof height === "number" ? `${height}px` : String(height);

  const containerId = `dailymotion-player-${Math.random().toString(36).slice(2, 11)}`;
  const wrapper = document.createElement("div");
  wrapper.id = containerId;
  wrapper.style.width = widthStyle;
  wrapper.style.height = heightStyle;
  wrapper.style.overflow = "hidden";
  container.appendChild(wrapper);

  return loadDailymotionScript()
    .then(() => {
      if (!window.dailymotion?.createPlayer) {
        wrapper.remove();
        return Promise.reject(new Error("Dailymotion player API not available"));
      }
      return window.dailymotion.createPlayer(containerId, {
        video: id,
        ...(autoplay ? { params: { autoplay: true } } : {}),
      });
    })
    .then((dmPlayer) => {
      onReady?.();
      let dmMuted = false;
      let cachedPaused = true;
      let lastPlayPauseTime = 0;
      let lastError: IErrorData | null = null;
      const OPTIMISTIC_MS = 2500;
      let progressInterval: ReturnType<typeof setInterval> | undefined;
      if (onPlay) {
        if (typeof dmPlayer.on === "function") {
          dmPlayer.on("play", onPlay);
        } else if (typeof dmPlayer.addEventListener === "function") {
          dmPlayer.addEventListener("play", onPlay);
        }
      }
      if (onPause) {
        if (typeof dmPlayer.on === "function") {
          dmPlayer.on("pause", onPause);
        } else if (typeof dmPlayer.addEventListener === "function") {
          dmPlayer.addEventListener("pause", onPause);
        }
      }
      if (onBuffering) {
        const fireBuffering = (): void => onBuffering();
        if (typeof dmPlayer.on === "function") {
          dmPlayer.on("waiting", fireBuffering);
          dmPlayer.on("bufferstart", fireBuffering);
        } else if (typeof dmPlayer.addEventListener === "function") {
          dmPlayer.addEventListener("waiting", fireBuffering);
          dmPlayer.addEventListener("bufferstart", fireBuffering);
        }
      }
      if (onEnded) {
        if (typeof dmPlayer.on === "function") {
          dmPlayer.on("video_end", onEnded);
        } else if (typeof dmPlayer.addEventListener === "function") {
          dmPlayer.addEventListener("video_end", onEnded);
        }
      }
      if (onError) {
        const handleError = (): void => {
          lastError = { message: "Dailymotion playback error" };
          onError(lastError);
        };
        if (typeof dmPlayer.on === "function") {
          dmPlayer.on("error", handleError);
          dmPlayer.on("video_error", handleError);
        } else if (typeof dmPlayer.addEventListener === "function") {
          dmPlayer.addEventListener("error", handleError);
          dmPlayer.addEventListener("video_error", handleError);
        }
      }
      if (onProgress) {
        progressInterval = setInterval(() => {
          dmPlayer.getState().then((state) => {
            const currentTime =
              typeof state.videoTime === "number" && !Number.isNaN(state.videoTime)
                ? state.videoTime
                : 0;
            const dur =
              typeof state.videoDuration === "number" && !Number.isNaN(state.videoDuration)
                ? state.videoDuration
                : undefined;
            if (Date.now() - lastPlayPauseTime > OPTIMISTIC_MS) {
              cachedPaused = state.playerIsPlaying === false;
            }
            onProgress({
              currentTime,
              ...(dur !== undefined ? { duration: dur } : {}),
            });
          }).catch(() => {});
        }, 500);
      }
      return {
      get ready() {
        return Promise.resolve();
      },
      play() {
        cachedPaused = false;
        lastPlayPauseTime = Date.now();
        dmPlayer.play();
      },
      pause() {
        cachedPaused = true;
        lastPlayPauseTime = Date.now();
        dmPlayer.pause();
      },
      get paused() {
        if (Date.now() - lastPlayPauseTime < OPTIMISTIC_MS) {
          return Promise.resolve(cachedPaused);
        }
        return dmPlayer.getState().then((state) => {
          cachedPaused = state.playerIsPlaying === false;
          return cachedPaused;
        });
      },
      get currentTime() {
        return dmPlayer.getState().then(async (state) => {
          if (typeof state.videoTime === "number" && !Number.isNaN(state.videoTime)) {
            return state.videoTime;
          }
          if (typeof dmPlayer.getPosition === "function") {
            return dmPlayer.getPosition!();
          }
          return 0;
        });
      },
      get duration() {
        if (typeof dmPlayer.getDuration === "function") {
          return dmPlayer.getDuration();
        }
        return dmPlayer.getState().then((state) =>
          typeof state.videoDuration === "number" && !Number.isNaN(state.videoDuration)
            ? state.videoDuration
            : 0
        );
      },
      seek(seconds: number) {
        if (typeof dmPlayer.seek === "function") {
          dmPlayer.seek(seconds);
          onSeek?.({ currentTime: seconds });
        }
      },
      get autoplay() {
        return Promise.resolve(autoplay);
      },
      mute() {
        if (typeof dmPlayer.setMute === "function") {
          dmPlayer.setMute(true);
          dmMuted = true;
          onMute?.({ muted: true });
        }
      },
      unmute() {
        if (typeof dmPlayer.setMute === "function") {
          dmPlayer.setMute(false);
          dmMuted = false;
          onMute?.({ muted: false });
        }
      },
      get muted() {
        return Promise.resolve(dmMuted);
      },
      get lastError() {
        return lastError;
      },
      destroy() {
        if (progressInterval) clearInterval(progressInterval);
        dmPlayer.destroy();
        wrapper.remove();
      },
    };
    })
    .catch((err) => {
      wrapper.remove();
      throw err;
    });
};
