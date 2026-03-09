import {
  createEmbedIframeElement,
  loadScript,
  EmbedPlayerVideoElement,
  type ICreatePlayerOptions,
} from "../_base/index.js";
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

/**
 * Vimeo embed player as a subclass of EmbedPlayerVideoElement.
 */
class VimeoEmbedPlayer extends EmbedPlayerVideoElement {
  #iframe: HTMLIFrameElement;
  #vimeoPlayer: IVimeoPlayer | null = null;
  #options: ICreatePlayerOptions;

  constructor(container: HTMLElement, id: string, options: ICreatePlayerOptions = {}) {
    const opts = options as typeof options & { vimeoHash?: string };
    const initialVolume = options.volume;
    super(opts.url ?? `https://player.vimeo.com/video/${id}`);
    this.#options = options;
    const {
      width = 560,
      height = 315,
      autoplay = false,
      controls = true,
      config,
      onError = () => {},
    } = { ...opts, ...this.#options } as ICreatePlayerOptions & { vimeoHash?: string };
    const { vimeoHash } = opts;

    const query = new URLSearchParams({ api: "1" });
    if (vimeoHash) query.set("h", vimeoHash);
    if (autoplay) query.set("autoplay", "1");
    if (!controls) query.set("controls", "0");
    const vimeoConfig = config?.vimeo ?? {};
    for (const [key, value] of Object.entries(vimeoConfig)) {
      if (value !== undefined && value !== "") query.set(key, String(value));
    }

    const iframe = createEmbedIframeElement({
      src: `${EMBED_BASE}${id}?${query.toString()}`,
      width,
      height,
      allow: "autoplay; fullscreen; picture-in-picture",
      allowFullScreen: true,
    });
    container.appendChild(iframe);
    this.#iframe = iframe;

    void loadScript(VIMEO_SCRIPT, {
      isLoaded: () => !!window.Vimeo?.Player,
      errorMessage: "Failed to load Vimeo player script",
    }).then(() => {
      const vimeoPlayer = new window.Vimeo!.Player(iframe);
      this.#vimeoPlayer = vimeoPlayer;
      const {
        onReady = () => {},
        onPlay = () => {},
        onPause = () => {},
        onBuffering = () => {},
        onEnded = () => {},
        onProgress = () => {},
        onDurationChange = () => {},
        onMute = () => {},
      } = this.#options;

      vimeoPlayer.on("error", (data: TVimeoEventData) => {
        const err = data as IVimeoErrorData;
        const customError = {
          code: 0,
          message: err.message ?? "Vimeo playback error",
        } as MediaError;
        this.playerState.error = customError;
        onError(this.playerState.error);
      });
      vimeoPlayer.on("play", () => {
        this.playerState.isPlaying = true;
        this.playerState.isPaused = false;
        onPlay();
      });
      vimeoPlayer.on("pause", () => {
        this.playerState.isPlaying = false;
        this.playerState.isPaused = true;
        onPause();
      });
      vimeoPlayer.on("bufferstart", onBuffering);
      vimeoPlayer.on("finish", onEnded);
      vimeoPlayer.on("ended", onEnded);
      vimeoPlayer.on("timeupdate", (data: TVimeoEventData) => {
        const { seconds, duration } = data as IVimeoTimeupdateData;
        this.playerState.currentTime = seconds;
        if (typeof duration === "number" && duration !== this.playerState.duration) {
          this.playerState.duration = duration;
          onDurationChange(duration);
        }
        onProgress(this.playerState.currentTime);
      });
      vimeoPlayer.on("volumechange", (data: TVimeoEventData) => {
        const { volume, muted } = data as IVimeoVolumechangeData;
        this.playerState.volume = volume;
        this.playerState.muted = muted;
        onMute({ muted });
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
      onReady();
      this.markReady();
    });
  }

  override play(): Promise<void> {
    return this.#vimeoPlayer?.play() ?? Promise.resolve();
  }
  override pause(): Promise<void> {
    return this.#vimeoPlayer?.pause() ?? Promise.resolve();
  }
  override seek(seconds: number): Promise<void> | void {
    return this.#vimeoPlayer?.setCurrentTime(seconds).then(() => {
      this.#options.onSeek?.(seconds);
    });
  }
  override mute(): Promise<void> | void {
    return this.#vimeoPlayer?.setMuted(true).then(() => {
      this.#options.onMute?.({ muted: true });
    });
  }
  override unmute(): Promise<void> | void {
    return this.#vimeoPlayer?.setMuted(false).then(() => {
      this.#options.onMute?.({ muted: false });
    });
  }
  override destroy(): void {
    this.#vimeoPlayer?.destroy();
    if (this.#iframe.parentNode) this.#iframe.remove();
  }
  override get paused(): boolean {
    return this.playerState.isPaused;
  }
  override get currentTime(): number {
    return this.playerState.currentTime;
  }
  override set currentTime(seconds: number) {
    void this.seek(seconds);
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
    void this.#vimeoPlayer?.setVolume(v).then(() => {
      this.playerState.volume = v;
    });
  }
  override get error() {
    return this.playerState.error;
  }
}

if (globalThis.customElements && !globalThis.customElements.get("vimeo-video")) {
  globalThis.customElements.define("vimeo-video", VimeoEmbedPlayer, {
    extends: "video",
  });
}
