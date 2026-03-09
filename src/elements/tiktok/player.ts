import {
  createEmbedIframeElement,
  EmbedPlayerVideoElement,
  type ICreatePlayerOptions,
  type IProgressData,
} from "../_base/index.js";

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
 * TikTok embed player as a subclass of EmbedPlayerVideoElement.
 * Implements the subset directly via postMessage to the TikTok iframe.
 */
class TikTokEmbedPlayer extends EmbedPlayerVideoElement {
  #iframe: HTMLIFrameElement;
  #handleMessage: (event: MessageEvent) => void;
  #options: ICreatePlayerOptions;

  constructor(container: HTMLElement, id: string, options: ICreatePlayerOptions = {}) {
    // super(options.url ?? `https://www.tiktok.com/@/video/${id}`);
    super();
    this.#options = options;
    const {
      width = 325,
      height = 575,
      autoplay = false,
      controls = true,
      onReady = () => {},
      onPlay = () => {},
      onPause = () => {},
      onBuffering = () => {},
      onEnded = () => {},
      onProgress = () => {},
      onDurationChange = () => {},
      onError = () => {},
    } = this.#options;

    const params = new URLSearchParams({ controls: controls ? "1" : "0" });
    if (autoplay) params.set("autoplay", "1");

    const iframe = createEmbedIframeElement({
      src: `${EMBED_BASE}${id}?${params.toString()}`,
      width,
      height,
      allow: "autoplay; fullscreen",
      allowFullScreen: true,
    });
    iframe.style.display = "block";
    iframe.style.maxWidth = "100%";
    iframe.style.maxHeight = "100%";
    container.appendChild(iframe);
    this.#iframe = iframe;

    const handleMessage = (event: MessageEvent): void => {
      if (event.origin !== EMBED_ORIGIN || event.source !== iframe.contentWindow) return;
      const data = event.data;
      if (!data || typeof data !== "object" || !("type" in data)) return;

      switch (data.type) {
        case "onPlayerReady":
          onReady();
          break;
        case "onStateChange":
          if (typeof data.value === "number") {
            this.playerState.isPaused = data.value === STATE_PAUSED;
            if (data.value === 1) onPlay();
            if (data.value === STATE_PAUSED) onPause();
            if (data.value === 3) onBuffering();
            if (data.value === STATE_ENDED) onEnded();
          }
          break;
        case "onCurrentTime": {
          const t = data.value as Partial<IProgressData> | undefined;
          if (t) {
            if (typeof t.currentTime === "number") this.playerState.currentTime = t.currentTime;
            if (typeof t.duration === "number") {
              if (t.duration !== this.playerState.duration) {
                this.playerState.duration = t.duration;
                onDurationChange(t.duration);
              }
            }
            onProgress(this.playerState.currentTime);
          }
          break;
        }
        case "onError":
        case "error": {
          const customError = { code: 0, message: "TikTok embed error" } as MediaError;
          this.playerState.error = customError;
          onError(customError);
          break;
        }
      }
    };
    this.#handleMessage = handleMessage;
    window.addEventListener("message", handleMessage);
  }

  override play(): Promise<void> {
    post(this.#iframe, "play");
    return Promise.resolve();
  }
  override pause(): Promise<void> {
    post(this.#iframe, "pause");
    return Promise.resolve();
  }
  override seek(seconds: number): void {
    post(this.#iframe, "seekTo", seconds);
    this.playerState.currentTime = seconds;
    this.#options.onSeek?.(seconds);
  }
  override mute(): void {
    this.playerState.muted = true;
    post(this.#iframe, "mute", true);
    this.#options.onMute?.({ muted: true });
  }
  override unmute(): void {
    this.playerState.muted = false;
    post(this.#iframe, "mute", false);
    this.#options.onMute?.({ muted: false });
  }
  override destroy(): void {
    window.removeEventListener("message", this.#handleMessage);
    if (this.#iframe.parentNode) this.#iframe.remove();
  }
  override get currentTime(): number {
    return this.playerState.currentTime;
  }
  override set currentTime(seconds: number) {
    this.seek(seconds);
  }
  override get duration(): number {
    return this.playerState.duration;
  }
  override get paused(): boolean {
    return this.playerState.isPaused;
  }
  override get muted(): boolean {
    return this.playerState.muted;
  }
  override get volume(): number {
    return this.playerState.volume ?? 1;
  }
  override set volume(vol: number) {
    this.playerState.volume = vol;
  }
  override get error() {
    return this.playerState.error;
  }
}

if (globalThis.customElements && !globalThis.customElements.get("tiktok-video")) {
  globalThis.customElements.define("tiktok-video", TikTokEmbedPlayer);
}
