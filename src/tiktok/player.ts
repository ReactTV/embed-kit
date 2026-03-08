import { createEmbedIframeElement, type IEmbedPlayer, type IErrorData, type IProgressData, type TCreatePlayer } from "../_base/index.js";

const EMBED_ORIGIN = "https://www.tiktok.com";
const EMBED_BASE = "https://www.tiktok.com/player/v1/";

/** TikTok onStateChange values: -1 init, 0 ended, 1 playing, 2 paused, 3 buffering */
const STATE_ENDED = 0;
const STATE_PAUSED = 2;

function post(iframe: HTMLIFrameElement, type: string, value?: unknown): void {
  if (!iframe.contentWindow) return;
  const message: { "x-tiktok-player": boolean; type: string; value?: unknown } = {
    "x-tiktok-player": true,
    type,
    ...(value !== undefined ? { value } : {}),
  };
  iframe.contentWindow.postMessage(message, "*");
}

/**
 * Create a controllable TikTok player in the given container.
 * Uses postMessage: play, pause, seekTo; listens for onStateChange and onCurrentTime.
 */
export const createPlayer: TCreatePlayer = (container, id, options = {}) => {
  const { width = 325, height = 575, autoplay = false, onReady, onPlay, onPause, onBuffering, onEnded, onProgress, onSeek, onMute, onError } = options;

  // Vertical video: width is the narrow dimension, height the tall one (e.g. 325×575).
  const iframe = createEmbedIframeElement({
    src: `${EMBED_BASE}${id}${autoplay ? "?autoplay=1" : ""}`,
    width,
    height,
    allow: "autoplay; fullscreen",
    allowFullScreen: true,
  });
  iframe.style.display = "block";
  iframe.style.maxWidth = "100%";
  iframe.style.maxHeight = "100%";
  container.appendChild(iframe);

  let lastState: number = STATE_PAUSED;
  let lastCurrentTime = 0;
  let lastDuration = 0;
  let lastError: IErrorData | null = null;
  let resolveReady: () => void;
  const readyPromise = new Promise<void>((resolve) => {
    resolveReady = resolve;
  });
  let resolvePlayer: (p: IEmbedPlayer) => void;
  const playerPromise = new Promise<IEmbedPlayer>((resolve) => {
    resolvePlayer = resolve;
  });

  const handleMessage = (event: MessageEvent): void => {
    if (event.origin !== EMBED_ORIGIN || event.source !== iframe.contentWindow) return;
    const data = event.data;
    if (!data || typeof data !== "object" || !("type" in data)) return;

    switch (data.type) {
      case "onPlayerReady":
        resolveReady();
        onReady?.();
        resolvePlayer(player);
        break;
      case "onStateChange":
        if (typeof data.value === "number") {
          lastState = data.value;
          if (data.value === 1) onPlay?.(); // 1 = playing
          if (data.value === STATE_PAUSED) onPause?.();
          if (data.value === 3) onBuffering?.(); // 3 = buffering
          if (data.value === STATE_ENDED) onEnded?.();
        }
        break;
      case "onCurrentTime":
        const t = data.value as Partial<IProgressData> | undefined;
        if (t) {
          if (typeof t.currentTime === "number") lastCurrentTime = t.currentTime;
          if (typeof t.duration === "number") lastDuration = t.duration;
          onProgress?.({ currentTime: lastCurrentTime, duration: lastDuration });
        }
        break;
      case "onError":
      case "error": {
        const err = data.value as { message?: string; code?: number | string } | undefined;
        const errorData = {
          ...(err?.message != null ? { message: err.message } : {}),
          ...(err?.code != null ? { code: err.code } : {}),
        };
        lastError = Object.keys(errorData).length > 0 ? errorData : { message: "TikTok embed error" };
        onError?.(lastError);
        break;
      }
    }
  };

  window.addEventListener("message", handleMessage);

  let lastMuted = false;
  const player: IEmbedPlayer = {
    get ready() {
      return readyPromise;
    },
    async play() {
      post(iframe, "play");
    },
    async pause() {
      post(iframe, "pause");
    },
    get paused(): Promise<boolean> {
      return Promise.resolve(lastState === STATE_PAUSED);
    },
    get currentTime(): Promise<number> {
      return Promise.resolve(lastCurrentTime);
    },
    get duration(): Promise<number> {
      return Promise.resolve(lastDuration);
    },
    seek(seconds: number) {
      post(iframe, "seekTo", seconds);
      lastCurrentTime = seconds;
      onSeek?.({ currentTime: seconds });
    },
    mute() {
      lastMuted = true;
      post(iframe, "mute", true);
      onMute?.({ muted: true });
    },
    unmute() {
      lastMuted = false;
      post(iframe, "mute", false);
      onMute?.({ muted: false });
    },
    get muted(): Promise<boolean> {
      return Promise.resolve(lastMuted);
    },
    get lastError() {
      return lastError;
    },
    destroy() {
      window.removeEventListener("message", handleMessage);
      if (iframe.parentNode) container.removeChild(iframe);
    },
  };

  return playerPromise;
};
