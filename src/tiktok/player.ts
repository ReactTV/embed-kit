import type { CreatePlayerOptions, EmbedPlayer } from "../_base/index.js";

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

/**
 * Create a controllable TikTok player in the given container.
 * Uses postMessage to the embed iframe for play/pause; tracks state from onStateChange for getPaused().
 */
export function createPlayer(
  container: HTMLElement,
  postId: string,
  options: CreatePlayerOptions = {}
): Promise<EmbedPlayer> {
  const width = options.width ?? 325;
  const height = options.height ?? 575;

  const iframe = document.createElement("iframe");
  iframe.src = `${EMBED_BASE}${postId}`;
  iframe.width = String(width);
  iframe.height = String(height);
  iframe.setAttribute("frameborder", "0");
  iframe.allow = "autoplay; fullscreen";
  iframe.allowFullscreen = true;
  container.appendChild(iframe);

  let lastState: number = STATE_PAUSED;
  const handleMessage = (event: MessageEvent): void => {
    if (event.origin !== EMBED_ORIGIN || event.source !== iframe.contentWindow) return;
    const data = event.data;
    if (!data || typeof data !== "object" || !("type" in data)) return;

    switch (data.type) {
      case "onPlayerReady":
        break;
      case "onStateChange":
        if (typeof data.value === "number") lastState = data.value;
        break;
    }
  };

  window.addEventListener("message", handleMessage);

  const player: EmbedPlayer = {
    async play() {
      post(iframe, "play");
    },
    async pause() {
      post(iframe, "pause");
    },
    getPaused(): Promise<boolean> {
      return Promise.resolve(lastState === STATE_PAUSED);
    },
    destroy() {
      window.removeEventListener("message", handleMessage);
      if (iframe.parentNode) container.removeChild(iframe);
    },
  };

  return Promise.resolve(player);
}
