import type { CreatePlayerOptions, EmbedPlayer } from "../_base/index.js";

const YT_SCRIPT = "https://www.youtube.com/iframe_api";

declare global {
  interface Window {
    YT?: { Player: new (el: string | HTMLElement, opts: YTOptions) => YTPlayer };
    onYouTubeIframeAPIReady?: () => void;
  }
}

interface YTOptions {
  videoId: string;
  width?: number | string;
  height?: number | string;
  playerVars?: { autoplay?: 0 | 1 };
  events?: { onReady?: (ev: { target: YTPlayer }) => void };
}

interface YTPlayer {
  playVideo: () => void;
  pauseVideo: () => void;
  getPlayerState: () => number; // 1=playing, 2=paused, etc.
  getCurrentTime: () => number; // seconds
  seekTo: (seconds: number, allowSeekAhead: boolean) => void;
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
 * Returns a normalized EmbedPlayer (play, pause, getPaused).
 */
export function createPlayer(
  container: HTMLElement,
  videoId: string,
  options: CreatePlayerOptions = {}
): Promise<EmbedPlayer> {
  const width = options.width ?? 560;
  const height = options.height ?? 315;
  const autoplay = Boolean((options as { autoplay?: boolean }).autoplay);

  return loadYTScript().then(
    () =>
      new Promise((resolve, reject) => {
        const div = document.createElement("div");
        div.id = `yt-player-${Math.random().toString(36).slice(2, 11)}`;
        container.appendChild(div);

        try {
          new window.YT!.Player(div, {
            videoId,
            width: typeof width === "number" ? width : parseInt(String(width), 10) || 560,
            height: typeof height === "number" ? height : parseInt(String(height), 10) || 315,
            playerVars: { autoplay: autoplay ? 1 : 0 },
            events: {
              onReady(ev: { target: YTPlayer }) {
                const player = ev.target;
                resolve({
                  play: () => player.playVideo(),
                  pause: () => player.pauseVideo(),
                  get paused() {
                    return Promise.resolve(player.getPlayerState() === 2); // 2 = paused
                  },
                  get currentTime() {
                    return Promise.resolve(player.getCurrentTime());
                  },
                  seek(seconds: number) {
                    player.seekTo(seconds, true);
                  },
                  get autoplay() {
                    return Promise.resolve(autoplay);
                  },
                  destroy() {
                    if (div.parentNode) container.removeChild(div);
                  },
                });
              },
            },
          });
        } catch (err) {
          container.removeChild(div);
          reject(err);
        }
      })
  );
}
