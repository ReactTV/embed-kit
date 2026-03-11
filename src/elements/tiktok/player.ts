import { createIframe, EmbedVideoElement } from "../_base/index.js";
import { REGEX_PLAYER, REGEX_VM, REGEX_VIDEO, REGEX_EMBED, REGEX_SHARE } from "./constants.js";

const EMBED_ORIGIN = "https://www.tiktok.com";
const EMBED_BASE = "https://www.tiktok.com/player/v1/";

/** TikTok onStateChange values: -1 init, 0 ended, 1 playing, 2 paused, 3 buffering */
const STATE_ENDED = 0;
const STATE_PLAYING = 1;
const STATE_PAUSED = 2;
const STATE_BUFFERING = 3;

function post(iframe: HTMLIFrameElement, type: string, value?: unknown): void {
  if (!iframe.contentWindow) return;
  const message: { "x-tiktok-player": boolean; type: string; value?: unknown } =
    {
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
    src.match(REGEX_SHARE)?.[1] ??
    src.match(REGEX_VM)?.[1]
  );
}

/**
 * TikTok embed player as a subclass of EmbedVideoElement.
 * Implements the subset directly via postMessage to the TikTok iframe.
 */
class TikTokEmbedPlayer extends EmbedVideoElement {
  protected tiktokPlayerState: { destroyed: boolean } = { destroyed: false };

  override load(): void {
    if (this.iframe?.parentNode) {
      this.iframe.remove();
      this.iframe = null;
    }
    window.removeEventListener("message", this.handleMessage);
    this.handleMessage = () => {};

    const attributes = this.getAttributes();
    const videoId = parseTiktokId(attributes.src ?? "");

    if (!videoId) return;

    const params = new URLSearchParams({
      controls: this.options.controls ? "1" : "0",
    });
    if (this.options.autoplay) params.set("autoplay", "1");

    const iframe = createIframe(`${EMBED_BASE}${videoId}?${params.toString()}`);
    this.getEmbedContainer().appendChild(iframe);
    this.iframe = iframe;

    const handleMessage = (event: MessageEvent): void => {
      if (this.tiktokPlayerState.destroyed) return;
      if (
        event.origin !== EMBED_ORIGIN ||
        event.source !== iframe.contentWindow
      )
        return;
      const data = event.data;
      if (!data || typeof data !== "object" || !("type" in data)) return;

      switch (data.type) {
        case "onPlayerReady":
          this.setInitialPlayerState();
          this.dispatchReadyEvent();
          break;
        case "onStateChange":
          if (typeof data.value === "number") {
            if (data.value === STATE_PAUSED) {
              this.playerState.isPaused = true;
              this.dispatchPauseEvent();
            } else if (data.value === STATE_PLAYING) {
              this.playerState.isPaused = false;
              this.dispatchPlayEvent();
            } else if (data.value === STATE_BUFFERING) {
              this.dispatchBufferingEvent();
            } else if (data.value === STATE_ENDED) {
              this.dispatchEndedEvent();
            }
          }
          break;
        case "onCurrentTime": {
          const t = data.value as
            | { currentTime?: number; duration?: number }
            | undefined;
          if (t) {
            if (typeof t.currentTime === "number")
              this.playerState.currentTime = t.currentTime;
            if (typeof t.duration === "number") {
              if (t.duration !== this.playerState.duration) {
                this.playerState.duration = t.duration;
                this.dispatchDurationChangeEvent(t.duration);
              }
            }
            this.dispatchProgressEvent(this.playerState.currentTime);
          }
          break;
        }
        case "onError":
        case "error": {
          this.playerState.error = {
            code: 0,
            message: "TikTok embed error",
          } as MediaError;
          this.dispatchErrorEvent(this.playerState.error);
          break;
        }
      }
    };

    this.handleMessage = handleMessage;
    window.addEventListener("message", handleMessage);
  }

  setInitialPlayerState(): void {
    const attributes = this.getAttributes();

    if (attributes.volume) {
      const vol = parseFloat(attributes.volume);
      this.volume = vol;
    }

    if (attributes.muted) {
      this.muted = attributes.muted === "true";
    }

    if (attributes.playing) {
      this.playing = attributes.playing === "true";
    }
  }

  connectedCallback(): void {
    this.loadInitialOptions();

    const src = this.getAttribute("src");
    if (!src) return;

    if (!parseTiktokId(src)) return;

    this.load();
  }

  override play(): Promise<void> {
    if (this.iframe) post(this.iframe, "play");
    return Promise.resolve();
  }

  override pause(): Promise<void> {
    if (this.iframe) post(this.iframe, "pause");
    return Promise.resolve();
  }

  override destroy(): void {
    this.tiktokPlayerState.destroyed = true;
    window.removeEventListener("message", this.handleMessage);
    if (this.iframe?.parentNode) this.iframe.remove();
    this.iframe = null;
  }

  override get playing(): boolean {
    return !this.paused;
  }

  override set playing(value: boolean) {
    if (value) {
      this.play();
    } else {
      this.pause();
    }
  }

  override set controls(value: boolean) {
    this.options.controls = value;
    this.load();
  }

  override seek(seconds: number): void {
    if (this.iframe) post(this.iframe, "seekTo", seconds);
    this.playerState.currentTime = seconds;
  }

  override mute(): void {
    this.playerState.muted = true;
    if (this.iframe) post(this.iframe, "mute");
    this.dispatchMuteChangeEvent(true);
  }

  override unmute(): void {
    this.playerState.muted = false;
    if (this.iframe) post(this.iframe, "unMute");
    this.dispatchMuteChangeEvent(false);
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

  override set muted(value: boolean) {
    if (value) {
      this.mute();
    } else {
      this.unmute();
    }
  }

  override get volume(): number {
    return ((this.playerState.volume ?? 1) * 100);
  }

  override set volume(vol: number) {
    const v =
      vol <= 1
        ? Math.max(0, Math.min(1, vol))
        : Math.max(0, Math.min(1, vol / 100));
    this.playerState.volume = v;
  }

  override get error() {
    return this.playerState.error;
  }
}

if (
  globalThis.customElements &&
  !globalThis.customElements.get("tiktok-video")
) {
  globalThis.customElements.define("tiktok-video", TikTokEmbedPlayer);
}
