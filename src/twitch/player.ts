import type { CreatePlayerOptions, EmbedPlayer } from "../_base/index.js";

const TWITCH_SCRIPT = "https://embed.twitch.tv/embed/v1.js";

declare global {
  interface Window {
    Twitch?: {
      Embed: new (divId: string, opts: TwitchEmbedOptions) => TwitchEmbedInstance;
    };
  }
}

interface TwitchEmbedOptions {
  video?: string;
  width?: number | string;
  height?: number | string;
  autoplay?: boolean;
}

interface TwitchEmbedInstance {
  getPlayer: () => TwitchPlayer;
  addEventListener: (event: string, cb: () => void) => void;
}

interface TwitchPlayer {
  play: () => void;
  pause: () => void;
  setMuted?: (muted: boolean) => void;
  getCurrentTime?: () => number; // seconds; not documented on all embed types
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
 * Create a controllable Twitch player in the given container (video by id).
 * Returns a normalized EmbedPlayer. paused is not supported by Twitch API and resolves to false.
 * Twitch.Embed only accepts an element id (document.getElementById), so we create the embed in
 * document.body then move the div (and injected iframe) into the container (e.g. shadow root).
 */
export function createPlayer(
  container: HTMLElement,
  videoId: string,
  options: CreatePlayerOptions = {}
): Promise<EmbedPlayer> {
  const width = options.width ?? 560;
  const height = options.height ?? 315;

  const div = document.createElement("div");
  div.id = `twitch-player-${Math.random().toString(36).slice(2, 11)}`;
  document.body.appendChild(div);

  return loadTwitchScript().then(
    () =>
      new Promise((resolve, reject) => {
        try {
          const embed = new window.Twitch!.Embed(div.id, {
            video: videoId,
            width: typeof width === "number" ? width : parseInt(String(width), 10) || 560,
            height: typeof height === "number" ? height : parseInt(String(height), 10) || 315,
            autoplay: false,
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
                    return Promise.resolve(false); // Twitch embed does not expose paused state
                  },
                  get currentTime() {
                    return Promise.resolve(
                      typeof player.getCurrentTime === "function" ? player.getCurrentTime()! : 0
                    );
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
