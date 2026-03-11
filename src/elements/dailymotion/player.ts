import { loadScript, EmbedVideoElement } from "../_base/index.js";
import { REGEX_VIDEO, REGEX_SHORT, REGEX_EMBED } from "./constants.js";
import type {
  DailymotionEvents,
  DailymotionPlayer,
  DailymotionPlayerState,
} from "./player.types.js";

const DAILYMOTION_LIB = "https://geo.dailymotion.com/libs/player.js";

function loadDailymotionScript(): Promise<void> {
  return loadScript(DAILYMOTION_LIB, {
    isLoaded: () => !!window.dailymotion?.createPlayer,
    errorMessage: "Failed to load Dailymotion player script",
  });
}

function parseDailymotionId(src: string): string | undefined {
  return src.match(REGEX_VIDEO)?.[1] ?? src.match(REGEX_SHORT)?.[1] ?? src.match(REGEX_EMBED)?.[1];
}

/**
 * Dailymotion embed player as a subclass of EmbedVideoElement.
 * Uses a slot in the shadow root so the mount div (light DOM) is visible; the SDK finds it by ID.
 */
class DailymotionEmbedPlayer extends EmbedVideoElement {
  protected player: DailymotionPlayer | null = null;
  protected dmPlayerState: { destroyed: boolean } = { destroyed: false };
  /** Mount element lives in light DOM so Dailymotion SDK (document.querySelector) can find it. */
  private dmMountEl: HTMLDivElement | null = null;
  /** Scoped style so .dailymotion-player-root has correct dimensions before first paint (avoids flash). */
  private dmRootStyleEl: HTMLStyleElement | null = null;

  constructor() {
    super();
    const root = this.shadowRoot!;
    const container = this.embedContainer!;
    root.removeChild(container);
    const style = document.createElement("style");
    style.textContent = "slot { pointer-events: none; } slot::slotted(*) { pointer-events: auto; }";
    root.appendChild(style);
    const wrapper = document.createElement("div");
    wrapper.style.cssText = "width:100%;height:100%;display:block;position:relative;";
    container.style.cssText = "width:100%;height:100%;display:block;position:absolute;inset:0;";
    wrapper.appendChild(container);
    const slot = document.createElement("slot");
    slot.style.cssText = "position:absolute;inset:0;display:block;";
    wrapper.appendChild(slot);
    root.appendChild(wrapper);
  }

  override load(): void {
    this.player?.destroy();
    this.player = null;

    if (this.dmRootStyleEl?.parentNode) {
      this.dmRootStyleEl.remove();
      this.dmRootStyleEl = null;
    }
    if (this.dmMountEl?.parentNode) {
      this.dmMountEl.remove();
      this.dmMountEl = null;
    }

    const attributes = this.getAttributes();
    const videoId = parseDailymotionId(attributes.src ?? "");

    if (!videoId) return;

    const mountId = `dm-${Math.random().toString(36).slice(2, 11)}`;
    const mountEl = document.createElement("div");
    mountEl.id = mountId;
    mountEl.style.cssText = "width:100%;height:100%;display:block;";
    this.dmMountEl = mountEl;
    this.appendChild(mountEl);

    const styleEl = document.createElement("style");
    const rootSelector = `#${mountId}.dailymotion-player-root`;
    styleEl.textContent = `${rootSelector}{padding-bottom:0!important;height:100%!important;width:100%!important}`;
    this.dmRootStyleEl = styleEl;
    this.appendChild(styleEl);

    const params: Record<string, unknown> = {};
    if (this.options.autoplay) params.autoplay = true;
    if (!this.options.controls) params.controls = false;

    void loadDailymotionScript()
      .then(() => {
        if (this.dmPlayerState.destroyed || !this.isConnected) return undefined;
        if (!window.dailymotion?.createPlayer) {
          return Promise.reject(new Error("Dailymotion player API not available"));
        }
        return window.dailymotion.createPlayer(mountId, {
          video: videoId,
          ...(Object.keys(params).length > 0 ? { params } : {}),
        });
      })
      .then((dmPlayer) => {
        if (!dmPlayer || this.dmPlayerState.destroyed || !this.isConnected) return;

        this.player = dmPlayer;

        const { events } = window.dailymotion!;
        this.createListeners(dmPlayer, events);
        this.setInitialPlayerState();
        this.dispatchReadyEvent();
      })
      .catch((err) => {
        throw err;
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

  createListeners(dmPlayer: DailymotionPlayer, events: DailymotionEvents): void {
    dmPlayer.on(events.PLAYER_ERROR, () => {
      this.playerState.error = {
        code: 0,
        message: "Dailymotion playback error",
      } as MediaError;
      this.dispatchErrorEvent(this.playerState.error);
    });
    if (events.VIDEO_ERROR) {
      dmPlayer.on(events.VIDEO_ERROR, () => {
        this.playerState.error = {
          code: 0,
          message: "Dailymotion playback error",
        } as MediaError;
        this.dispatchErrorEvent(this.playerState.error);
      });
    }

    dmPlayer.on(events.VIDEO_PLAY, () => {
      this.playerState.isPaused = false;
      this.dispatchPlayEvent();
    });

    dmPlayer.on(events.VIDEO_PAUSE, () => {
      this.playerState.isPaused = true;
      this.dispatchPauseEvent();
    });

    dmPlayer.on(events.VIDEO_BUFFERING, () => {
      this.dispatchBufferingEvent();
    });

    dmPlayer.on(events.VIDEO_END, () => {
      this.dispatchEndedEvent();
    });

    dmPlayer.on(events.VIDEO_SEEKEND, (data: DailymotionPlayerState) => {
      this.playerState.currentTime = data.videoTime ?? 0;
      this.dispatchProgressEvent(this.playerState.currentTime);
    });

    dmPlayer.on(events.VIDEO_DURATIONCHANGE, (data: DailymotionPlayerState) => {
      const nextDuration = data.videoDuration ?? 0;
      if (nextDuration !== this.playerState.duration) {
        this.playerState.duration = nextDuration;
        this.dispatchDurationChangeEvent(this.playerState.duration);
      }
    });

    dmPlayer.on(events.PLAYER_VOLUMECHANGE, (data: DailymotionPlayerState) => {
      const muted = data.playerIsMuted ?? false;
      if (muted !== this.playerState.muted) {
        this.playerState.muted = muted;
        this.dispatchMuteChangeEvent(muted);
      }
      if (typeof data.playerVolume === "number" && !Number.isNaN(data.playerVolume)) {
        if (data.playerVolume !== this.playerState.volume) {
          this.playerState.volume = data.playerVolume;
          this.dispatchVolumeChangeEvent(data.playerVolume * 100);
        }
      }
    });

    dmPlayer.on(events.VIDEO_TIMECHANGE, (state?: DailymotionPlayerState) => {
      const time = state?.videoTime ?? this.playerState.currentTime;
      this.playerState.currentTime = time;
      this.dispatchProgressEvent(time);
    });
  }

  connectedCallback(): void {
    this.loadInitialOptions();

    const src = this.getAttribute("src");
    if (!src) return;

    if (!parseDailymotionId(src)) return;

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
    this.dmPlayerState.destroyed = true;
    this.player?.destroy();
    this.player = null;
    if (this.dmRootStyleEl?.parentNode) {
      this.dmRootStyleEl.remove();
      this.dmRootStyleEl = null;
    }
    if (this.dmMountEl?.parentNode) {
      this.dmMountEl.remove();
      this.dmMountEl = null;
    }
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
    this.player?.seek(seconds);
    this.playerState.currentTime = seconds;
  }

  override mute(): void {
    this.playerState.muted = true;
    this.player?.setMute(true);
    this.dispatchMuteChangeEvent(true);
  }

  override unmute(): void {
    this.playerState.muted = false;
    this.player?.setMute(false);
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
    return (this.playerState.volume ?? 1) * 100;
  }

  override set volume(vol: number) {
    const v = vol <= 1 ? Math.max(0, Math.min(1, vol)) : Math.max(0, Math.min(1, vol / 100));
    this.playerState.volume = v;
    this.player?.setVolume?.(v);
  }

  override get error() {
    return this.playerState.error;
  }
}

if (globalThis.customElements && !globalThis.customElements.get("dailymotion-video")) {
  globalThis.customElements.define("dailymotion-video", DailymotionEmbedPlayer);
}
