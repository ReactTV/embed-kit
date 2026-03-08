import { createEmbedIframeElement, type CreatePlayerOptions, type EmbedPlayer } from "../_base/index.js";

const EMBED_ORIGIN = "https://www.tiktok.com";
const EMBED_BASE = "https://www.tiktok.com/player/v1/";

/** TikTok onStateChange values: -1 init, 0 ended, 1 playing, 2 paused, 3 buffering */
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

interface OnCurrentTimeValue {
  currentTime?: number;
  duration?: number;
}

/**
 * Create a controllable TikTok player in the given container.
 * Uses postMessage: play, pause, seekTo; listens for onStateChange and onCurrentTime.
 */
export function createPlayer(
  container: HTMLElement,
  postId: string,
  options: CreatePlayerOptions = {}
): Promise<EmbedPlayer> {
  const width = options.width ?? 325;
  const height = options.height ?? 575;
  const autoplay = Boolean((options as { autoplay?: boolean }).autoplay);

  const iframe = createEmbedIframeElement({
    src: `${EMBED_BASE}${postId}${autoplay ? "?autoplay=1" : ""}`,
    width,
    height,
    allow: "autoplay; fullscreen",
    allowFullScreen: true,
  });
  container.appendChild(iframe);

  let lastState: number = STATE_PAUSED;
  let lastCurrentTime = 0;
  let resolveReady: () => void;
  const readyPromise = new Promise<void>((resolve) => {
    resolveReady = resolve;
  });

  const handleMessage = (event: MessageEvent): void => {
    if (event.origin !== EMBED_ORIGIN || event.source !== iframe.contentWindow) return;
    const data = event.data;
    if (!data || typeof data !== "object" || !("type" in data)) return;

    switch (data.type) {
      case "onPlayerReady":
        resolveReady();
        break;
      case "onStateChange":
        if (typeof data.value === "number") lastState = data.value;
        break;
      case "onCurrentTime":
        const t = data.value as OnCurrentTimeValue | undefined;
        if (t && typeof t.currentTime === "number") lastCurrentTime = t.currentTime;
        break;
    }
  };

  window.addEventListener("message", handleMessage);

  const player: EmbedPlayer = {
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
    seek(seconds: number) {
      post(iframe, "seekTo", seconds);
    },
    get autoplay(): Promise<boolean> {
      return Promise.resolve(autoplay);
    },
    destroy() {
      window.removeEventListener("message", handleMessage);
      if (iframe.parentNode) container.removeChild(iframe);
    },
  };

  return Promise.resolve(player);
}
