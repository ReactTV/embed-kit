import { createEmbedIframeElement, type IErrorData, type TCreatePlayer } from "../_base/index.js";

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
  getMuted: () => Promise<boolean>;
  setMuted: (muted: boolean) => Promise<void>;
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
 * Returns a normalized IEmbedPlayer (play, pause, paused, currentTime).
 */
export const createPlayer: TCreatePlayer = (container, id, options = {}) => {
  const { width = 560, height = 315, autoplay = false, onReady, onPlay, onPause, onEnded, onProgress, onMute, onError, vimeoHash } = options as typeof options & { vimeoHash?: string };
  const query = new URLSearchParams({ api: "1" });
  if (vimeoHash) query.set("h", vimeoHash);
  if (autoplay) query.set("autoplay", "1");

  const iframe = createEmbedIframeElement({
    src: `${EMBED_BASE}${id}?${query.toString()}`,
    width,
    height,
    allow: "autoplay; fullscreen; picture-in-picture",
    allowFullScreen: true,
  });
  container.appendChild(iframe);

  let lastError: IErrorData | null = null;
  return loadVimeoScript().then(() => {
    const vimeoPlayer = new window.Vimeo!.Player(iframe);
    if (onError && typeof vimeoPlayer.on === "function") {
      vimeoPlayer.on("error", (err?: unknown) => {
        const e = err as { message?: string; code?: number } | undefined;
        lastError = {
          ...(e?.message != null ? { message: e.message } : {}),
          ...(e?.code != null ? { code: e.code } : {}),
        };
        onError?.(lastError);
      });
    }
    if (onPlay && typeof vimeoPlayer.on === "function") {
      vimeoPlayer.on("play", onPlay);
    }
    if (onPause && typeof vimeoPlayer.on === "function") {
      vimeoPlayer.on("pause", onPause);
    }
    if (onEnded && typeof vimeoPlayer.on === "function") {
      vimeoPlayer.on("finish", onEnded);
      vimeoPlayer.on("ended", onEnded);
      let endedFired = false;
      vimeoPlayer.on("timeupdate", (data?: VimeoTimeupdateData) => {
        if (onProgress && data != null) {
          const sec = data.seconds ?? 0;
          const dur = data.duration;
          onProgress({
            currentTime: typeof sec === "number" ? sec : 0,
            ...(typeof dur === "number" ? { duration: dur } : {}),
          });
        }
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
    } else if (onProgress && typeof vimeoPlayer.on === "function") {
      vimeoPlayer.on("timeupdate", (data?: VimeoTimeupdateData) => {
        if (data != null) {
          const sec = data.seconds ?? 0;
          const dur = data.duration;
          onProgress({
            currentTime: typeof sec === "number" ? sec : 0,
            ...(typeof dur === "number" ? { duration: dur } : {}),
          });
        }
      });
    }
    const readyPromise =
      typeof vimeoPlayer.ready === "function"
        ? vimeoPlayer.ready()
        : vimeoPlayer.getPaused().then(() => undefined);
    readyPromise.then(() => onReady?.());
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
      mute() {
        return vimeoPlayer.setMuted(true).then(() => {
          onMute?.({ muted: true });
        });
      },
      unmute() {
        return vimeoPlayer.setMuted(false).then(() => {
          onMute?.({ muted: false });
        });
      },
      get muted() {
        return vimeoPlayer.getMuted();
      },
      get lastError() {
        return lastError;
      },
      destroy() {
        vimeoPlayer.destroy();
        if (iframe.parentNode) container.removeChild(iframe);
      },
    };
  });
};
