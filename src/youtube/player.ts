import type { IEmbedPlayer, IErrorData, TCreatePlayer } from "../_base/index.js";

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
  width?: number | string;
  height?: number | string;
  playerVars?: { autoplay?: 0 | 1 };
  events?: {
    onReady?: (ev: { target: YTPlayer }) => void;
    onStateChange?: (ev: { data: number }) => void;
    onError?: (ev: { data: number }) => void;
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
  if (window.YT?.Player) return Promise.resolve();
  return new Promise((resolve) => {
    const prev = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      prev?.();
      resolve();
    };
    const script = document.createElement("script");
    script.src = YT_SCRIPT;
    script.async = true;
    document.head.appendChild(script);
  });
}

/**
 * Create a controllable YouTube player in the given container.
 * Returns a normalized IEmbedPlayer (play, pause, getPaused).
 */
export const createPlayer: TCreatePlayer = (container, id, options = {}) => {
  const { width = 560, height = 315, autoplay = false, onReady: onReadyCallback, onPlay, onPause, onBuffering, onEnded, onProgress, onMute, onError } = options;
  let lastError: IErrorData | null = null;

  return loadYTScript().then(
    () =>
      new Promise<IEmbedPlayer>((resolve, reject) => {
        const div = document.createElement("div");
        div.id = `yt-player-${Math.random().toString(36).slice(2, 11)}`;
        container.appendChild(div);

        try {
          new window.YT!.Player(div, {
            videoId: id,
            width: typeof width === "number" ? width : parseInt(String(width), 10) || 560,
            height: typeof height === "number" ? height : parseInt(String(height), 10) || 315,
            playerVars: { autoplay: autoplay ? 1 : 0 },
            events: {
              onError(ev: { data: number }) {
                lastError = { code: ev.data };
                onError?.(lastError);
              },
              onReady(ev: { target: YTPlayer }) {
                const player = ev.target;
                onReadyCallback?.();
                let progressInterval: ReturnType<typeof setInterval> | undefined;
                let lastMuted: boolean | null = null;
                const pollMute = (): void => {
                  try {
                    const muted = player.isMuted();
                    if (onMute && lastMuted !== null && lastMuted !== muted) {
                      onMute({ muted });
                    }
                    lastMuted = muted;
                  } catch {
                    // Player may be destroyed
                  }
                };
                if (onProgress || onMute) {
                  progressInterval = setInterval(() => {
                    try {
                      if (onProgress) {
                        const currentTime = player.getCurrentTime();
                        const duration = player.getDuration();
                        if (typeof currentTime === "number" && !Number.isNaN(currentTime)) {
                          const dur = typeof duration === "number" && !Number.isNaN(duration) && duration > 0 ? duration : undefined;
                          onProgress({
                            currentTime,
                            ...(dur !== undefined ? { duration: dur } : {}),
                          });
                        }
                      }
                      if (onMute) pollMute();
                    } catch {
                      // Player may be destroyed
                    }
                  }, 500);
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
                  },
                  get autoplay() {
                    return Promise.resolve(autoplay);
                  },
                  mute: () => {
                    player.mute();
                    onMute?.({ muted: true });
                  },
                  unmute: () => {
                    player.unMute();
                    onMute?.({ muted: false });
                  },
                  get muted() {
                    return Promise.resolve(player.isMuted());
                  },
                  get lastError() {
                    return lastError;
                  },
                  destroy() {
                    if (progressInterval) clearInterval(progressInterval);
                    if (div.parentNode) container.removeChild(div);
                  },
                });
              },
              onStateChange(ev: { data: number }) {
                if (ev.data === 1) onPlay?.(); // 1 = playing
                if (ev.data === 2) onPause?.(); // 2 = paused
                if (ev.data === 3) onBuffering?.(); // 3 = buffering
                if (ev.data === YT_STATE_ENDED) onEnded?.();
              },
            },
          });
        } catch (err) {
          container.removeChild(div);
          reject(err);
        }
      })
  );
};
