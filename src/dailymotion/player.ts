import type { CreatePlayerOptions, EmbedPlayer } from "../_base/index.js";

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

interface DailymotionPlayer {
  play: () => void;
  pause: () => void;
  getState: () => Promise<{ playerIsPlaying?: boolean }>;
  getPosition?: () => Promise<number>; // seconds; optional in SDK
  seek?: (seconds: number) => void | Promise<void>;
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
export function createPlayer(
  container: HTMLElement,
  videoId: string,
  options: CreatePlayerOptions = {}
): Promise<EmbedPlayer> {
  const width = options.width ?? 560;
  const height = options.height ?? 315;
  const autoplay = Boolean((options as { autoplay?: boolean }).autoplay);
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
        video: videoId,
        ...(autoplay ? { params: { autoplay: true } } : {}),
      });
    })
    .then((dmPlayer) => ({
      get ready() {
        return Promise.resolve();
      },
      play: () => dmPlayer.play(),
      pause: () => dmPlayer.pause(),
      get paused() {
        return dmPlayer.getState().then((state) => Boolean(state.playerIsPlaying === false));
      },
      get currentTime() {
        return typeof dmPlayer.getPosition === "function"
          ? dmPlayer.getPosition!()
          : Promise.resolve(0);
      },
      seek(seconds: number) {
        if (typeof dmPlayer.seek === "function") {
          return dmPlayer.seek(seconds);
        }
      },
      get autoplay() {
        return Promise.resolve(autoplay);
      },
      destroy() {
        dmPlayer.destroy();
        wrapper.remove();
      },
    }))
    .catch((err) => {
      wrapper.remove();
      throw err;
    });
}
