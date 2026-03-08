import { createEmbedIframeElement, type CreatePlayerOptions, type EmbedPlayer } from "../_base/index.js";

const VIMEO_SCRIPT = "https://player.vimeo.com/api/player.js";
const EMBED_BASE = "https://player.vimeo.com/video/";

declare global {
  interface Window {
    Vimeo?: { Player: new (iframe: HTMLIFrameElement) => VimeoPlayer };
  }
}

interface VimeoTimeupdateData {
  percent?: number;
  seconds?: number;
  duration?: number;
}

interface VimeoPlayer {
  ready?: () => Promise<void>;
  play: () => Promise<void>;
  pause: () => Promise<void>;
  getPaused: () => Promise<boolean>;
  getCurrentTime: () => Promise<number>;
  getDuration: () => Promise<number>;
  setCurrentTime: (seconds: number) => Promise<number>;
  on: (event: string, callback: (data?: VimeoTimeupdateData) => void) => void;
  destroy: () => void;
}

function loadVimeoScript(): Promise<void> {
  if (window.Vimeo?.Player) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = VIMEO_SCRIPT;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load Vimeo player script"));
    document.head.appendChild(script);
  });
}

/**
 * Create a controllable Vimeo player in the given container.
 * Returns a normalized EmbedPlayer (play, pause, paused, currentTime).
 */
export function createPlayer(
  container: HTMLElement,
  videoId: string,
  options: CreatePlayerOptions = {}
): Promise<EmbedPlayer> {
  const width = options.width ?? 560;
  const height = options.height ?? 315;
  const autoplay = Boolean((options as { autoplay?: boolean }).autoplay);
  const onEnded = (options as { onEnded?: () => void }).onEnded;

  const vimeoHash = (options as { vimeoHash?: string }).vimeoHash;
  const query = new URLSearchParams({ api: "1" });
  if (vimeoHash) query.set("h", vimeoHash);
  if (autoplay) query.set("autoplay", "1");

  const iframe = createEmbedIframeElement({
    src: `${EMBED_BASE}${videoId}?${query.toString()}`,
    width,
    height,
    allow: "autoplay; fullscreen; picture-in-picture",
    allowFullScreen: true,
  });
  container.appendChild(iframe);

  return loadVimeoScript().then(() => {
    const vimeoPlayer = new window.Vimeo!.Player(iframe);
    if (onEnded && typeof vimeoPlayer.on === "function") {
      vimeoPlayer.on("finish", onEnded);
      vimeoPlayer.on("ended", onEnded);
      let endedFired = false;
      vimeoPlayer.on("timeupdate", (data?: VimeoTimeupdateData) => {
        if (endedFired) return;
        const p = data?.percent;
        const sec = data?.seconds;
        const dur = data?.duration;
        const atEnd =
          (typeof p === "number" && p >= 0.99) ||
          (typeof sec === "number" && typeof dur === "number" && dur > 0 && sec >= dur - 0.5);
        if (atEnd) {
          endedFired = true;
          onEnded();
        }
      });
    }
    const readyPromise =
      typeof vimeoPlayer.ready === "function"
        ? vimeoPlayer.ready()
        : vimeoPlayer.getPaused().then(() => undefined);
    return {
      get ready() {
        return readyPromise;
      },
      play: () => vimeoPlayer.play(),
      pause: () => vimeoPlayer.pause(),
      get paused() {
        return vimeoPlayer.getPaused();
      },
      get currentTime() {
        return vimeoPlayer.getCurrentTime();
      },
      get duration() {
        return typeof vimeoPlayer.getDuration === "function"
          ? vimeoPlayer.getDuration()
          : Promise.resolve(0);
      },
      seek(seconds: number) {
        return vimeoPlayer.setCurrentTime(seconds).then(() => {});
      },
      get autoplay() {
        return Promise.resolve(autoplay);
      },
      destroy() {
        vimeoPlayer.destroy();
        if (iframe.parentNode) container.removeChild(iframe);
      },
    };
  });
}
