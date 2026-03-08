import type { CreatePlayerOptions, EmbedPlayer } from "../_base/index.js";

const TWITCH_SCRIPT = "https://embed.twitch.tv/embed/v1.js";

declare global {
  interface Window {
    Twitch?: {
      Embed: new (divId: string, opts: TwitchEmbedOptions) => TwitchEmbedInstance;
      Player?: { PLAY?: string; PAUSE?: string };
    };
  }
}

interface TwitchEmbedOptions {
  video?: string;
  clip?: string;
  width?: number | string;
  height?: number | string;
  autoplay?: boolean;
  parent?: string[];
}

interface TwitchEmbedInstance {
  getPlayer: () => TwitchPlayer;
  addEventListener: (event: string, cb: () => void) => void;
}

interface TwitchPlayer {
  play: () => void;
  pause: () => void;
  setMuted?: (muted: boolean) => void;
  getCurrentTime?: () => number;
  setCurrentTime?: (seconds: number) => void;
  videoSeek?: (seconds: number) => void;
}

function loadTwitchScript(): Promise<void> {
  if (window.Twitch?.Embed) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = TWITCH_SCRIPT;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load Twitch embed script"));
    document.head.appendChild(script);
  });
}

/**
 * Create a controllable Twitch player in the given container (video by id, or clip by slug).
 * Clips use the clips.twitch.tv/embed iframe (no interactive API). Videos use Twitch.Embed.
 * The SDK requires getElementById, so we create the div in document.body, then move it into
 * the container once the embed is ready so the player sits in the document flow.
 */
export function createPlayer(
  container: HTMLElement,
  videoId: string,
  options: CreatePlayerOptions = {}
): Promise<EmbedPlayer> {
  const width = options.width ?? 560;
  const height = options.height ?? 315;
  const autoplay = Boolean((options as { autoplay?: boolean }).autoplay);
  const isClip = (options as { twitchType?: string }).twitchType === "clip";
  const parent =
    typeof window !== "undefined" && window.location?.hostname
      ? [window.location.hostname]
      : ["localhost"];

  if (isClip) {
    const host = parent[0] ?? "localhost";
    const parentParams =
      host === "localhost" || host === "127.0.0.1"
        ? "parent=localhost&parent=127.0.0.1"
        : `parent=${encodeURIComponent(host)}`;
    const clipUrl = `https://clips.twitch.tv/embed?clip=${encodeURIComponent(videoId)}&${parentParams}`;
    const iframe = document.createElement("iframe");
    iframe.src = clipUrl;
    iframe.width = String(typeof width === "number" ? width : parseInt(String(width), 10) || 560);
    iframe.height = String(typeof height === "number" ? height : parseInt(String(height), 10) || 315);
    iframe.setAttribute("frameborder", "0");
    iframe.allowFullscreen = true;
    container.appendChild(iframe);
    return Promise.resolve({
      play: () => {},
      pause: () => {},
      get paused() {
        return Promise.resolve(false);
      },
      get currentTime() {
        return Promise.resolve(0);
      },
      seek: () => {},
      get autoplay() {
        return Promise.resolve(autoplay);
      },
      destroy() {
        if (iframe.parentNode) iframe.remove();
      },
    });
  }

  const div = document.createElement("div");
  div.id = `twitch-player-${Math.random().toString(36).slice(2, 11)}`;
  const widthNum = typeof width === "number" ? width : parseInt(String(width), 10) || 560;
  const heightNum = typeof height === "number" ? height : parseInt(String(height), 10) || 315;
  document.body.appendChild(div);

  return loadTwitchScript().then(
    () =>
      new Promise((resolve, reject) => {
        try {
          const embed = new window.Twitch!.Embed(div.id, {
            video: videoId,
            width: widthNum,
            height: heightNum,
            autoplay,
            parent,
          });

          let isPaused = true;
          const playEvent = window.Twitch?.Player?.PLAY ?? "Play";
          const pauseEvent = window.Twitch?.Player?.PAUSE ?? "Pause";
          embed.addEventListener(playEvent, () => {
            isPaused = false;
          });
          embed.addEventListener(pauseEvent, () => {
            isPaused = true;
          });

          const tryGetPlayer = (attempts = 0): void => {
            if (attempts > 50) {
              div.remove();
              reject(new Error("Twitch player not ready"));
              return;
            }
            try {
              const player = embed.getPlayer();
              if (player) {
                div.remove();
                container.appendChild(div);
                resolve({
                  play: () => player.play(),
                  pause: () => player.pause(),
                  get paused() {
                    return Promise.resolve(isPaused);
                  },
                  get currentTime() {
                    return Promise.resolve(
                      typeof player.getCurrentTime === "function" ? player.getCurrentTime()! : 0
                    );
                  },
                  seek(seconds: number) {
                    if (typeof player.setCurrentTime === "function") {
                      player.setCurrentTime(seconds);
                    } else if (typeof player.videoSeek === "function") {
                      player.videoSeek(seconds);
                    }
                  },
                  get autoplay() {
                    return Promise.resolve(autoplay);
                  },
                  destroy() {
                    if (div.parentNode) div.remove();
                  },
                });
                return;
              }
            } catch {
              // not ready yet
            }
            setTimeout(() => tryGetPlayer(attempts + 1), 100);
          };
          tryGetPlayer();
        } catch (err) {
          div.remove();
          reject(err);
        }
      })
  );
}
