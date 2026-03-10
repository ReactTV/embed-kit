import { createEmbedIframeElement, EmbedPlayerVideoElement } from "../_base/index.js";
import { REGEX_PLAYER, REGEX_VM, REGEX_VIDEO, REGEX_EMBED } from "./constants.js";

const EMBED_ORIGIN = "https://www.tiktok.com";
const EMBED_BASE = "https://www.tiktok.com/player/v1/";

/** TikTok onStateChange values: -1 init, 0 ended, 1 playing, 2 paused, 3 buffering */
const STATE_ENDED = 0;
const STATE_PLAYING = 1;
const STATE_PAUSED = 2;
const STATE_BUFFERING = 3;

function post(iframe: HTMLIFrameElement, type: string, value?: unknown): void {
  if (!iframe.contentWindow) return;
  const message: { "x-tiktok-player": boolean; type: string; value?: unknown } = {
    "x-tiktok-player": true,
    type,
    ...(value !== undefined ? { value } : {}),
  };
  iframe.contentWindow.postMessage(message, "*");
}

function parseTiktokId(src: string): string | undefined {
  return (
    src.match(REGEX_PLAYER)?.[1] ??
    src.match(REGEX_VIDEO)?.[1] ??
    src.match(REGEX_EMBED)?.[1] ??
    src.match(REGEX_VM)?.[1]
  );
}

/**
 * TikTok embed player as a subclass of EmbedPlayerVideoElement.
 * Implements the subset directly via postMessage to the TikTok iframe.
 */
class TikTokEmbedPlayer extends EmbedPlayerVideoElement {
  connectedCallback(): void {
    const src = this.getAttribute("src");

    if (!src) return;

    const videoId = parseTiktokId(src);
    if (!videoId) return;

    const width = Number(this.getAttribute("width")) || (this.options.width ?? 325);
    const height = Number(this.getAttribute("height")) || (this.options.height ?? 575);
    const autoplay =
      this.getAttribute("autoplay") != null
        ? this.getAttribute("autoplay") !== "false"
        : (this.options.autoplay ?? false);
    const optionsMuted = this.options.muted;
    const controls =
      this.getAttribute("controls") != null
        ? this.getAttribute("controls") !== "false"
        : (this.options.controls ?? true);

    const params = new URLSearchParams({ controls: controls ? "1" : "0" });
    if (autoplay) params.set("autoplay", "1");

    const iframe = createEmbedIframeElement({
      src: `${EMBED_BASE}${videoId}?${params.toString()}`,
      width,
      height,
      allow: "autoplay; fullscreen",
      allowFullScreen: true,
    });
    iframe.style.display = "block";
    iframe.style.maxWidth = "100%";
    iframe.style.maxHeight = "100%";
    this.appendChild(iframe);
    this.iframe = iframe;

    const handleMessage = (event: MessageEvent): void => {
      if (event.origin !== EMBED_ORIGIN || event.source !== iframe.contentWindow) return;
      const data = event.data;
      if (!data || typeof data !== "object" || !("type" in data)) return;

      switch (data.type) {
        case "onPlayerReady":
          if (optionsMuted === true) {
            post(iframe, "mute", true);
            this.playerState.muted = true;
          }
          this.dispatchEvent(new Event("ready"));
          break;
        case "onStateChange":
          if (typeof data.value === "number") {
            this.playerState.isPlaying = data.value === STATE_PLAYING;
            this.playerState.isPaused = data.value === STATE_PAUSED;
            if (data.value === STATE_PLAYING) this.dispatchEvent(new Event("play"));
            if (data.value === STATE_PAUSED) this.dispatchEvent(new Event("pause"));
            if (data.value === STATE_BUFFERING) this.dispatchEvent(new Event("buffering"));
            if (data.value === STATE_ENDED) this.dispatchEvent(new Event("ended"));
          }
          break;
        case "onCurrentTime": {
          const t = data.value as { currentTime?: number; duration?: number } | undefined;
          if (t) {
            if (typeof t.currentTime === "number")
              this.playerState.currentTime = t.currentTime;
            if (typeof t.duration === "number") {
              if (t.duration !== this.playerState.duration) {
                this.playerState.duration = t.duration;
                this.dispatchEvent(
                  new CustomEvent("durationchange", { detail: t.duration })
                );
              }
            }
            this.emitProgress(this.playerState.currentTime);
          }
          break;
        }
        case "onError":
        case "error": {
          const customError = { code: 0, message: "TikTok embed error" } as MediaError;
          this.playerState.error = customError;
          this.dispatchEvent(new CustomEvent("error", { detail: customError }));
          break;
        }
      }
    };

    this.handleMessage = handleMessage;
    window.addEventListener("message", handleMessage);
  }

  override play(): Promise<void> {
    if (this.iframe) post(this.iframe, "play");
    return Promise.resolve();
  }
  override pause(): Promise<void> {
    if (this.iframe) post(this.iframe, "pause");
    return Promise.resolve();
  }
  override seek(seconds: number): void {
    if (this.iframe) post(this.iframe, "seekTo", seconds);
    this.playerState.currentTime = seconds;
    this.dispatchEvent(new CustomEvent("seek", { detail: seconds }));
  }
  override mute(): void {
    this.playerState.muted = true;
    if (this.iframe) post(this.iframe, "mute", true);
    this.dispatchEvent(new CustomEvent("mute", { detail: true }));
  }
  override unmute(): void {
    this.playerState.muted = false;
    if (this.iframe) post(this.iframe, "mute", false);
    this.dispatchEvent(new CustomEvent("unmute", { detail: false }));
  }
  override destroy(): void {
    window.removeEventListener("message", this.handleMessage);
    if (this.iframe?.parentNode) this.iframe.remove();
    this.iframe = null;
    if (this.parentNode) this.remove();
  }
  override get paused(): boolean {
    return this.playerState.isPaused;
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
  override get muted(): boolean {
    return this.playerState.muted;
  }
  override get volume(): number {
    return this.playerState.volume ?? 1;
  }
  override set volume(vol: number) {
    this.playerState.volume = Math.max(0, Math.min(1, vol));
  }
  override get error() {
    return this.playerState.error;
  }
}

if (globalThis.customElements && !globalThis.customElements.get("tiktok-video")) {
  globalThis.customElements.define("tiktok-video", TikTokEmbedPlayer);
}
