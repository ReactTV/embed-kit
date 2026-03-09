import { createEmbedIframeElement, loadScript, EmbedPlayerVideoElement } from "../_base/index.js";
import {
  REGEX_PLAYER,
  REGEX_DIRECT,
  REGEX_CHANNELS,
  REGEX_GROUPS,
  REGEX_HASH,
} from "./constants.js";
import type {
  IVimeoErrorData,
  IVimeoPlayer,
  IVimeoTimeupdateData,
  IVimeoVolumechangeData,
  TVimeoEventData,
} from "./player.types.js";

const VIMEO_SCRIPT = "https://player.vimeo.com/api/player.js";
const EMBED_BASE = "https://player.vimeo.com/video/";

declare global {
  interface Window {
    Vimeo?: { Player: new (iframe: HTMLIFrameElement) => IVimeoPlayer };
  }
}

function loadVimeoScript(): Promise<void> {
  return loadScript(VIMEO_SCRIPT, {
    isLoaded: () => !!window.Vimeo?.Player,
    errorMessage: "Failed to load Vimeo player script",
  });
}

function parseVimeoId(src: string): { videoId: string | undefined; vimeoHash: string | undefined } {
  const videoId =
    src.match(REGEX_PLAYER)?.[1] ??
    src.match(REGEX_DIRECT)?.[1] ??
    src.match(REGEX_CHANNELS)?.[1] ??
    src.match(REGEX_GROUPS)?.[1];
  const vimeoHash = src.match(REGEX_HASH)?.[1] ?? undefined;
  return { videoId, vimeoHash };
}

/**
 * Vimeo embed player as a subclass of EmbedPlayerVideoElement.
 */
class VimeoEmbedPlayer extends EmbedPlayerVideoElement {
  protected player: IVimeoPlayer | null = null;
  protected vimeoPlayerState: { destroyed: boolean } = { destroyed: false };

  connectedCallback(): void {
    const src = this.getAttribute("src");

    if (!src) return;

    const { videoId, vimeoHash } = parseVimeoId(src);
    if (!videoId) return;

    const width = Number(this.getAttribute("width")) || (this.options.width ?? 560);
    const height = Number(this.getAttribute("height")) || (this.options.height ?? 315);
    const autoplay =
      this.getAttribute("autoplay") != null
        ? this.getAttribute("autoplay") !== "false"
        : (this.options.autoplay ?? false);
    const controls =
      this.getAttribute("controls") != null
        ? this.getAttribute("controls") !== "false"
        : (this.options.controls ?? true);
    const { config } = this.options;

    const initialVolume = this.getAttribute("volume") ?? this.options.volume;

    const query = new URLSearchParams({ api: "1" });
    const h = vimeoHash ?? (config?.vimeo?.h != null ? String(config.vimeo.h) : undefined);
    if (h) query.set("h", h);
    if (autoplay) query.set("autoplay", "1");
    if (!controls) query.set("controls", "0");
    const vimeoConfig = config?.vimeo ?? {};
    for (const [key, value] of Object.entries(vimeoConfig)) {
      if (value !== undefined && value !== "" && key !== "h") query.set(key, String(value));
    }

    const iframe = createEmbedIframeElement({
      src: `${EMBED_BASE}${videoId}?${query.toString()}`,
      width,
      height,
      allow: "autoplay; fullscreen; picture-in-picture",
      allowFullScreen: true,
    });
    this.appendChild(iframe);
    this.iframe = iframe;
    this.vimeoPlayerState = { destroyed: false };

    void loadVimeoScript().then(() => {
      if (this.vimeoPlayerState.destroyed) return;

      const vimeoPlayer = new window.Vimeo!.Player(iframe);
      this.player = vimeoPlayer;

      vimeoPlayer.on("error", (data: TVimeoEventData) => {
        const err = data as IVimeoErrorData;
        const customError = {
          code: 0,
          message: err.message ?? "Vimeo playback error",
        } as MediaError;
        this.playerState.error = customError;
        this.dispatchEvent(new CustomEvent("error", { detail: customError }));
      });
      vimeoPlayer.on("play", () => {
        this.playerState.isPlaying = true;
        this.playerState.isPaused = false;
        this.dispatchEvent(new Event("play"));
      });
      vimeoPlayer.on("pause", () => {
        this.playerState.isPlaying = false;
        this.playerState.isPaused = true;
        this.dispatchEvent(new Event("pause"));
      });
      vimeoPlayer.on("bufferstart", () => this.dispatchEvent(new Event("buffering")));
      vimeoPlayer.on("finish", () => this.dispatchEvent(new Event("ended")));
      vimeoPlayer.on("ended", () => this.dispatchEvent(new Event("ended")));
      vimeoPlayer.on("timeupdate", (data: TVimeoEventData) => {
        const { seconds, duration } = data as IVimeoTimeupdateData;
        this.playerState.currentTime = seconds;
        if (typeof duration === "number" && duration !== this.playerState.duration) {
          this.playerState.duration = duration;
          this.dispatchEvent(new CustomEvent("durationchange", { detail: duration }));
        }
        this.dispatchEvent(new CustomEvent("progress", { detail: seconds }));
      });
      vimeoPlayer.on("volumechange", (data: TVimeoEventData) => {
        const { volume, muted } = data as IVimeoVolumechangeData;
        this.playerState.volume = volume;
        this.playerState.muted = muted;
        this.dispatchEvent(new CustomEvent("mute", { detail: muted }));
      });

      if (typeof initialVolume === "number" && initialVolume >= 0 && initialVolume <= 1) {
        vimeoPlayer.setVolume(initialVolume).then(() => {
          this.playerState.volume = initialVolume;
        });
      } else {
        vimeoPlayer.getVolume().then((v) => {
          this.playerState.volume = v;
        });
      }

      this.dispatchEvent(new Event("ready"));
    });
  }

  override play(): Promise<void> {
    this.player?.play();
    return Promise.resolve();
  }
  override pause(): Promise<void> {
    this.player?.pause();
    return Promise.resolve();
  }
  override seek(seconds: number): void {
    this.player?.setCurrentTime(seconds).then(() => {
      this.playerState.currentTime = seconds;
      this.dispatchEvent(new CustomEvent("seek", { detail: seconds }));
    });
  }
  override mute(): void {
    this.player?.setMuted(true).then(() => {
      this.playerState.muted = true;
      this.dispatchEvent(new CustomEvent("mute", { detail: true }));
    });
  }
  override unmute(): void {
    this.player?.setMuted(false).then(() => {
      this.playerState.muted = false;
      this.dispatchEvent(new CustomEvent("unmute", { detail: false }));
    });
  }
  override destroy(): void {
    this.vimeoPlayerState.destroyed = true;
    this.player?.destroy();
    this.player = null;
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
    const v = Math.max(0, Math.min(1, vol));
    this.player?.setVolume(v).then(() => {
      this.playerState.volume = v;
    });
  }
  override get error() {
    return this.playerState.error;
  }
}

if (globalThis.customElements && !globalThis.customElements.get("vimeo-video")) {
  globalThis.customElements.define("vimeo-video", VimeoEmbedPlayer);
}
