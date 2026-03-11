import { createIframe, loadScript, EmbedVideoElement } from "../_base/index.js";
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
 * Vimeo embed player as a subclass of EmbedVideoElement.
 */
class VimeoEmbedPlayer extends EmbedVideoElement {
  protected player: IVimeoPlayer | null = null;
  protected vimeoPlayerState: { destroyed: boolean } = { destroyed: false };

  override load(): void {
    if (this.iframe?.parentNode) {
      this.iframe.remove();
      this.iframe = null;
    }
    this.player?.destroy();
    this.player = null;

    const attributes = this.getAttributes();
    const { videoId, vimeoHash } = parseVimeoId(attributes.src ?? "");

    if (!videoId) return;

    const query = new URLSearchParams({ api: "1" });
    const h =
      vimeoHash ??
      (this.options.config?.vimeo?.h != null ? String(this.options.config.vimeo.h) : undefined);
    if (h) query.set("h", h);
    if (this.options.autoplay) query.set("autoplay", "1");
    if (!this.options.controls) query.set("controls", "0");
    const vimeoConfig = this.options.config?.vimeo ?? {};
    for (const [key, value] of Object.entries(vimeoConfig)) {
      if (value !== undefined && value !== "" && key !== "h") query.set(key, String(value));
    }

    const iframe = createIframe(`${EMBED_BASE}${videoId}?${query.toString()}`);
    this.getEmbedContainer().appendChild(iframe);
    this.iframe = iframe;

    void loadVimeoScript().then(() => {
      if (this.vimeoPlayerState.destroyed) return;
      // Don't attach to a stale iframe if load() was called again (e.g. URL change)
      if (this.iframe !== iframe) return;

      const vimeoPlayer = new window.Vimeo!.Player(iframe);
      this.player = vimeoPlayer;

      this.createListeners(vimeoPlayer);
      this.setInitialPlayerState();
      this.dispatchReadyEvent();
    });
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

  createListeners(vimeoPlayer: IVimeoPlayer): void {
    vimeoPlayer.on("error", (data: TVimeoEventData) => {
      const err = data as IVimeoErrorData;
      this.playerState.error = {
        code: 0,
        message: err.message ?? "Vimeo playback error",
      } as MediaError;
      this.dispatchErrorEvent(this.playerState.error);
    });

    vimeoPlayer.on("play", () => {
      this.playerState.isPaused = false;
      this.dispatchPlayEvent();
    });

    vimeoPlayer.on("pause", () => {
      this.playerState.isPaused = true;
      this.dispatchPauseEvent();
    });

    vimeoPlayer.on("bufferstart", () => {
      this.dispatchBufferingEvent();
    });

    vimeoPlayer.on("finish", () => {
      this.dispatchEndedEvent();
    });
    vimeoPlayer.on("ended", () => {
      this.dispatchEndedEvent();
    });

    vimeoPlayer.on("timeupdate", (data: TVimeoEventData) => {
      const { seconds, duration } = data as IVimeoTimeupdateData;
      this.playerState.currentTime = seconds;
      if (typeof duration === "number" && duration !== this.playerState.duration) {
        this.playerState.duration = duration;
        this.dispatchDurationChangeEvent(duration);
      }
      this.dispatchProgressEvent(seconds);
    });

    vimeoPlayer.on("volumechange", (data: TVimeoEventData) => {
      const { volume, muted } = data as IVimeoVolumechangeData;
      if (volume !== this.playerState.volume) {
        this.playerState.volume = volume;
        this.dispatchVolumeChangeEvent(volume * 100);
      }
      if (muted !== this.playerState.muted) {
        this.playerState.muted = muted;
        this.dispatchMuteChangeEvent(muted);
      }
    });
  }

  connectedCallback(): void {
    this.loadInitialOptions();

    const src = this.getAttribute("src");
    if (!src) return;

    const { videoId } = parseVimeoId(src);
    if (!videoId) return;

    this.load();
  }

  override play(): Promise<void> {
    this.player?.play();
    return Promise.resolve();
  }

  override pause(): Promise<void> {
    this.player?.pause();
    return Promise.resolve();
  }

  override destroy(): void {
    this.vimeoPlayerState.destroyed = true;
    this.player?.destroy();
    this.player = null;
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
    this.player?.setCurrentTime(seconds);
    this.playerState.currentTime = seconds;
  }

  override mute(): void {
    this.playerState.muted = true;
    this.player?.setMuted(true);
  }

  override unmute(): void {
    this.playerState.muted = false;
    this.player?.setMuted(false);
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
    return (this.playerState.volume ?? 1) * 100;
  }

  override set volume(vol: number) {
    const v = vol <= 1 ? Math.max(0, Math.min(1, vol)) : Math.max(0, Math.min(1, vol / 100));
    this.playerState.volume = v;
    this.player?.setVolume(v);
  }

  override get error() {
    return this.playerState.error;
  }
}

if (globalThis.customElements && !globalThis.customElements.get("vimeo-video")) {
  globalThis.customElements.define("vimeo-video", VimeoEmbedPlayer);
}
