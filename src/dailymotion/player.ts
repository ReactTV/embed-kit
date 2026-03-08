import type { CreatePlayerOptions, EmbedPlayer } from "../_base/index.js";

const DAILYMOTION_LIB = "https://geo.dailymotion.com/libs/player.js";

declare global {
  interface Window {
    dailymotion?: {
      createPlayer: (
        containerId: string,
        options: { video: string; params?: Record<string, unknown> }
      ) => Promise<DailymotionPlayer>;
      onScriptLoaded?: (callback: () => void) => void;
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
    script.onload = () => {
      if (window.dailymotion?.onScriptLoaded) {
        window.dailymotion.onScriptLoaded(() => resolve());
      } else {
        const waitForApi = (attempts = 0): void => {
          if (window.dailymotion?.createPlayer) return resolve();
          if (attempts > 50) return resolve();
          setTimeout(() => waitForApi(attempts + 1), 100);
        };
        waitForApi();
      }
    };
    script.onerror = () => reject(new Error("Failed to load Dailymotion player script"));
    document.head.appendChild(script);
  });
}

/**
 * Position the SDK root over the container. Keep 16:9 aspect ratio and clip overflow.
 */
function positionOverContainerWithCleanup(
  sdkRoot: HTMLElement,
  container: HTMLElement
): () => void {
  const update = (): void => {
    const rect = container.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    sdkRoot.style.position = "fixed";
    sdkRoot.style.left = `${rect.left}px`;
    sdkRoot.style.top = `${rect.top}px`;
    sdkRoot.style.width = `${width}px`;
    sdkRoot.style.height = `${height}px`;
    sdkRoot.style.overflow = "hidden";
    sdkRoot.style.zIndex = "1";
    const inner = sdkRoot.querySelector(".dailymotion-player-wrapper") as HTMLElement | null;
    if (inner) {
      inner.style.position = "absolute";
      inner.style.inset = "0";
      inner.style.width = "100%";
      inner.style.height = "100%";
    }
  };
  update();
  const ro = new ResizeObserver(update);
  ro.observe(container);
  window.addEventListener("scroll", update, { passive: true });
  window.addEventListener("resize", update);
  return () => {
    ro.disconnect();
    window.removeEventListener("scroll", update);
    window.removeEventListener("resize", update);
  };
}

/**
 * Create a controllable Dailymotion player. The SDK looks up the container by id via
 * document.getElementById, so the wrapper must be in the document (not in a shadow root).
 * When container is in the light DOM we append the wrapper there so the player stays
 * inside the component. When container is in a shadow root we append to body and overlay.
 */
export function createPlayer(
  container: HTMLElement,
  videoId: string,
  options: CreatePlayerOptions = {}
): Promise<EmbedPlayer> {
  const width = options.width ?? 560;
  const height = options.height ?? 315;
  const widthStyle = typeof width === "number" ? `${width}px` : String(width);
  const heightStyle = typeof height === "number" ? `${height}px` : String(height);

  const inLightDOM = container.getRootNode() === document;

  const containerId = `dailymotion-player-${Math.random().toString(36).slice(2, 11)}`;
  const wrapper = document.createElement("div");
  wrapper.id = containerId;
  wrapper.style.width = widthStyle;
  wrapper.style.height = heightStyle;
  wrapper.style.overflow = "hidden";

  if (inLightDOM) {
    container.appendChild(wrapper);
  } else {
    const placeholder = document.createElement("div");
    placeholder.style.width = widthStyle;
    placeholder.style.height = heightStyle;
    placeholder.style.minWidth = widthStyle;
    placeholder.style.minHeight = heightStyle;
    placeholder.style.aspectRatio = "16 / 9";
    container.appendChild(placeholder);
    document.body.appendChild(wrapper);
  }

  return loadDailymotionScript()
    .then(() => {
      if (!window.dailymotion?.createPlayer) {
        wrapper.remove();
        if (!inLightDOM && container.firstElementChild) container.firstElementChild?.remove();
        return Promise.reject(new Error("Dailymotion player API not available"));
      }
      return window.dailymotion.createPlayer(containerId, { video: videoId });
    })
    .then((dmPlayer) => {
      let positionCleanup: (() => void) | null = null;
      if (!inLightDOM) {
        const sdkRoot = document.getElementById(containerId) ?? wrapper;
        if (sdkRoot) {
          sdkRoot.style.overflow = "hidden";
          positionCleanup = positionOverContainerWithCleanup(sdkRoot, container);
        }
      }
      return {
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
        destroy() {
          positionCleanup?.();
          dmPlayer.destroy();
          wrapper.remove();
          if (!inLightDOM && container.firstElementChild) container.firstElementChild.remove();
        },
      };
    })
    .catch((err) => {
      wrapper.remove();
      if (!inLightDOM && container.firstElementChild) container.firstElementChild.remove();
      throw err;
    });
}
