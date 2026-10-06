import { EmbedVideoElement } from "../_base/index.js";
import {
  applyStartTimeToFacebookHref,
  getFacebookStartSeconds,
  isFacebookReelUrl,
  isFacebookTruthyConfig,
  normalizeFacebookVideoHref,
  REEL_FRAME_HEIGHT,
  REEL_FRAME_WIDTH,
} from "./constants.js";
import {
  configureFacebookSdk,
  loadFacebookSdk,
  parseFacebookEmbed,
  registerFacebookVideoReady,
  unregisterFacebookVideoReady,
} from "./loadFacebookSdk.js";
import type { FacebookVideoEvent, IFacebookVideoPlayer } from "./player.types.js";

const MIN_EMBED_WIDTH = 220;
const DEFAULT_EMBED_WIDTH = 560;

const FB_REEL_DOCUMENT_STYLE_ID = "embed-kit-fb-reel-responsive";

/**
 * Centers Meta’s reel frame inside the host box (letterboxed, like other providers).
 * The iframe keeps Meta’s own px size — its document is laid out at `data-width`, so resizing
 * the iframe via CSS only crops/pads it. Instead `--fb-reel-scale` (kept in sync with the host
 * size by a ResizeObserver) scales the whole frame to fit. Must live in the document since the
 * XFBML node is light DOM.
 */
const FB_REEL_DOCUMENT_CSS = `
facebook-video[data-reel] .fb-video {
  display: flex !important;
  align-items: center;
  justify-content: center;
  width: 100% !important;
  height: 100% !important;
  overflow: hidden;
}
facebook-video[data-reel] .fb-video > span {
  flex-shrink: 0;
  transform: scale(var(--fb-reel-scale, 1));
  transform-origin: center;
}
`;

function ensureFacebookReelDocumentStyles(): void {
  if (document.getElementById(FB_REEL_DOCUMENT_STYLE_ID)) return;
  const style = document.createElement("style");
  style.id = FB_REEL_DOCUMENT_STYLE_ID;
  style.textContent = FB_REEL_DOCUMENT_CSS;
  document.head.appendChild(style);
}

/** Meta `data-width` (min 220 on desktop per their docs). */
function getDataWidth(el: HTMLElement): number {
  const attr = el.getAttribute("width");
  const parsed = attr ? parseInt(attr, 10) : NaN;
  if (Number.isFinite(parsed) && parsed >= MIN_EMBED_WIDTH) return parsed;

  const rect = el.getBoundingClientRect();
  if (rect.width >= MIN_EMBED_WIDTH) return Math.floor(rect.width);

  return DEFAULT_EMBED_WIDTH;
}

/** Width of the largest Meta reel frame (560:690) that fits the host box, or null if unsized. */
function getReelFitWidth(el: HTMLElement): number | null {
  const rect = el.getBoundingClientRect();
  if (rect.width <= 0 || rect.height <= 0) return null;
  return Math.min(rect.width, (rect.height * REEL_FRAME_WIDTH) / REEL_FRAME_HEIGHT);
}

/**
 * Facebook embedded video player (XFBML + Embedded Video Player API).
 * Reel URLs are sized so Meta’s frame fits the host box and centered via document CSS.
 * Other Facebook URLs use Meta’s default embed layout.
 *
 * The `fb-video` node must live in the light DOM — Meta’s SDK does not render XFBML
 * inside shadow roots (same constraint as Dailymotion’s mount element).
 *
 * @see https://developers.facebook.com/docs/plugins/embedded-video-player/
 */
class FacebookEmbedPlayer extends EmbedVideoElement {
  protected player: IFacebookVideoPlayer | null = null;
  protected fbPlayerState: { destroyed: boolean } = { destroyed: false };
  private fbVideoEl: HTMLDivElement | null = null;

  constructor() {
    super();
    const root = this.shadowRoot!;
    root.innerHTML = "";
    const style = document.createElement("style");
    style.textContent = `
      :host { display: block; width: 100%; height: 100%; }
      :host([data-reel]) { overflow: hidden; background: #000; }
      slot { display: block; width: 100%; height: 100%; }
    `;
    const slot = document.createElement("slot");
    root.append(style, slot);
  }
  private eventReleases: Array<{
    event: FacebookVideoEvent;
    release: (event: FacebookVideoEvent) => void;
  }> = [];
  private progressIntervalId: ReturnType<typeof setInterval> | undefined;
  private activePlayerId: string | null = null;
  private pendingPlay = false;
  private pendingPause = false;
  private pendingSeek: number | null = null;
  private pendingMuted: boolean | null = null;
  private pendingVolume: number | null = null;
  private reelDataWidth = 0;
  private reelResizeObserver: ResizeObserver | null = null;

  /** Scales the reel frame (rendered at `reelDataWidth`) to fit the current host size. */
  private updateReelScale(): void {
    const fitWidth = getReelFitWidth(this);
    if (!this.fbVideoEl || !this.reelDataWidth || fitWidth == null) return;
    this.fbVideoEl.style.setProperty("--fb-reel-scale", String(fitWidth / this.reelDataWidth));
  }

  private clearProgressInterval(): void {
    if (this.progressIntervalId != null) {
      clearInterval(this.progressIntervalId);
      this.progressIntervalId = undefined;
    }
  }

  private releasePlayerSubscriptions(): void {
    this.eventReleases.forEach(({ event, release }) => {
      try {
        release(event);
      } catch {
        // ignore
      }
    });
    this.eventReleases = [];
  }

  private clearPendingCommands(): void {
    this.pendingPlay = false;
    this.pendingPause = false;
    this.pendingSeek = null;
    this.pendingMuted = null;
    this.pendingVolume = null;
  }

  private flushPendingCommands(): void {
    if (!this.player) return;

    if (this.pendingSeek != null) {
      this.player.seek(this.pendingSeek);
      this.playerState.currentTime = this.pendingSeek;
      this.pendingSeek = null;
    }
    if (this.pendingMuted !== null) {
      if (this.pendingMuted) this.player.mute();
      else this.player.unmute();
      this.playerState.muted = this.pendingMuted;
      this.pendingMuted = null;
    }
    if (this.pendingVolume !== null) {
      this.player.setVolume(this.pendingVolume);
      this.playerState.volume = this.pendingVolume;
      this.pendingVolume = null;
    }
    if (this.pendingPause) {
      this.player.pause();
      this.pendingPause = false;
      this.pendingPlay = false;
    } else if (this.pendingPlay) {
      this.player.play();
      this.pendingPlay = false;
    }
  }

  private teardownEmbed(): void {
    this.clearProgressInterval();
    this.releasePlayerSubscriptions();
    this.player = null;

    if (this.activePlayerId) {
      unregisterFacebookVideoReady(this.activePlayerId);
      this.activePlayerId = null;
    }

    this.clearPendingCommands();

    this.reelResizeObserver?.disconnect();
    this.reelResizeObserver = null;
    this.reelDataWidth = 0;

    if (this.fbVideoEl?.parentNode) {
      this.fbVideoEl.remove();
      this.fbVideoEl = null;
    }
    this.removeAttribute("data-reel");
  }

  private syncStateFromPlayer(): void {
    if (!this.player) return;
    try {
      const current = this.player.getCurrentPosition();
      if (typeof current === "number" && !Number.isNaN(current)) {
        this.playerState.currentTime = current;
      }
      const duration = this.player.getDuration();
      if (typeof duration === "number" && duration > 0) {
        this.playerState.duration = duration;
      }
      const muted = this.player.isMuted();
      if (muted !== this.playerState.muted) {
        this.playerState.muted = muted;
        this.dispatchMuteChangeEvent(muted);
      }
      const vol = this.player.getVolume();
      if (typeof vol === "number" && !Number.isNaN(vol) && vol !== this.playerState.volume) {
        this.playerState.volume = vol;
        this.dispatchVolumeChangeEvent(vol * 100);
      }
    } catch {
      // ignore
    }
  }

  private startProgressInterval(): void {
    this.clearProgressInterval();
    const interval = this.options.progressInterval;
    if (!Number.isFinite(interval) || interval <= 0 || !this.player) return;

    this.progressIntervalId = setInterval(() => {
      if (this.fbPlayerState.destroyed || !this.player) return;
      try {
        const prevDuration = this.playerState.duration;
        this.syncStateFromPlayer();
        if (!this.playerState.isPaused) {
          this.dispatchVisibleFrameOnce();
        }
        this.dispatchProgressEvent(this.playerState.currentTime);
        if (this.playerState.duration !== prevDuration && this.playerState.duration > 0) {
          this.dispatchDurationChangeEvent(this.playerState.duration);
        }
      } catch {
        // ignore polling errors
      }
    }, interval);
  }

  private bindPlayer(instance: IFacebookVideoPlayer): void {
    this.player = instance;
    this.releasePlayerSubscriptions();
    this.playerState.error = null;

    const sub = (event: FacebookVideoEvent, handler: () => void) => {
      const token = instance.subscribe(event, handler);
      this.eventReleases.push({ event, release: token.release });
    };

    sub("startedPlaying", () => {
      this.playerState.isPaused = false;
      this.syncStateFromPlayer();
      this.dispatchPlayEvent();
      this.dispatchPlayingEvent();
      this.dispatchVisibleFrameOnce();
    });

    sub("paused", () => {
      this.playerState.isPaused = true;
      this.syncStateFromPlayer();
      this.dispatchPauseEvent();
    });

    sub("finishedPlaying", () => {
      this.playerState.isPaused = true;
      this.dispatchEndedEvent();
    });

    sub("startedBuffering", () => {
      this.playerState.isBuffering = true;
      this.dispatchBufferingEvent();
    });

    sub("finishedBuffering", () => {
      this.playerState.isBuffering = false;
    });

    sub("error", () => {
      this.playerState.error = {
        code: 0,
        message: "Facebook video playback error",
      } as MediaError;
      this.dispatchErrorEvent(this.playerState.error);
    });

    this.syncStateFromPlayer();
    if (this.playerState.duration > 0) {
      this.dispatchDurationChangeEvent(this.playerState.duration);
    }

    const startSeconds = getFacebookStartSeconds(this.options.config.facebook);
    if (startSeconds != null) {
      instance.seek(startSeconds);
      this.playerState.currentTime = startSeconds;
      this.dispatchProgressEvent(startSeconds);
    }

    this.setInitialPlayerState();
    this.flushPendingCommands();
    this.startProgressInterval();
    this.dispatchCuedEvent();
    this.dispatchReadyEvent();
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

    if (this.hasAttribute("playing")) {
      const wantPlay = this.getAttribute("playing") === "true";
      if (!(wantPlay === false && this.options.autoplay)) {
        this.playing = wantPlay;
      }
    } else if (this.options.autoplay) {
      void this.play();
    }
  }

  override load(): void {
    this.loadInitialOptions();
    this.teardownEmbed();
    this.playerState.isPaused = true;
    this.playerState.isBuffering = false;
    this.playerState.currentTime = 0;
    this.playerState.duration = 0;
    this.playerState.error = null;

    const attributes = this.getAttributes();
    let href = normalizeFacebookVideoHref(attributes.src ?? "");
    if (!href) return;

    const fbConfig = this.options.config.facebook;
    const startSeconds = getFacebookStartSeconds(fbConfig);
    if (startSeconds != null) {
      href = applyStartTimeToFacebookHref(href, startSeconds);
    }

    const appId = fbConfig.appId != null ? String(fbConfig.appId).trim() : "";
    if (appId) {
      configureFacebookSdk({ appId });
    }

    const playerId = `fb-embed-${Math.random().toString(36).slice(2, 11)}`;
    this.activePlayerId = playerId;

    const isReel = isFacebookReelUrl(href);

    const fbVideo = document.createElement("div");
    fbVideo.className = "fb-video";
    fbVideo.id = playerId;
    fbVideo.setAttribute("data-href", href);
    if (isReel) {
      // Render at the current fit size; later resizes are handled by scaling (see updateReelScale)
      // since changing data-width would require re-rendering the embed and lose playback.
      const fitWidth = getReelFitWidth(this) ?? DEFAULT_EMBED_WIDTH;
      this.reelDataWidth = Math.max(MIN_EMBED_WIDTH, Math.floor(fitWidth));
      fbVideo.setAttribute("data-width", String(this.reelDataWidth));
    } else {
      fbVideo.setAttribute("data-width", String(getDataWidth(this)));
    }
    fbVideo.setAttribute("data-allowfullscreen", "true");
    fbVideo.setAttribute("data-show-text", this.options.annotations ? "true" : "false");
    if (this.options.autoplay) {
      fbVideo.setAttribute("data-autoplay", "true");
    }
    if (this.options.captions) {
      fbVideo.setAttribute("data-show-captions", "true");
    }
    if (isFacebookTruthyConfig(fbConfig.lazy)) {
      fbVideo.setAttribute("data-lazy", "true");
    }

    if (isReel) {
      ensureFacebookReelDocumentStyles();
      this.setAttribute("data-reel", "");
    } else {
      this.removeAttribute("data-reel");
    }
    this.appendChild(fbVideo);
    this.fbVideoEl = fbVideo;

    if (isReel) {
      this.updateReelScale();
      if (typeof ResizeObserver !== "undefined") {
        this.reelResizeObserver = new ResizeObserver(() => this.updateReelScale());
        this.reelResizeObserver.observe(this);
      }
    }

    registerFacebookVideoReady(playerId, (instance) => {
      if (this.fbPlayerState.destroyed || this.activePlayerId !== playerId) return;
      this.bindPlayer(instance);
    });

    void loadFacebookSdk().then(() => {
      if (this.fbPlayerState.destroyed || this.activePlayerId !== playerId) return;
      parseFacebookEmbed(this);
    });
  }

  connectedCallback(): void {
    super.connectedCallback();
    this.fbPlayerState.destroyed = false;

    const src = this.getAttribute("src");
    if (!src) return;
    if (!normalizeFacebookVideoHref(src)) return;

    this.load();
  }

  disconnectedCallback(): void {
    super.disconnectedCallback();
    this.destroy();
  }

  override attributeChangedCallback(name: string, oldValue: string, newValue: string): void {
    if (oldValue === newValue) return;

    const autoplayOn =
      this.hasAttribute("autoplay") &&
      (this.getAttribute("autoplay") === "" || this.getAttribute("autoplay") === "true");

    if (
      name === "playing" &&
      newValue === "false" &&
      autoplayOn &&
      (oldValue === null || oldValue === "")
    ) {
      return;
    }

    if (
      (name === "width" || name === "captions" || name === "annotations" || name === "autoplay") &&
      oldValue !== null &&
      this.hasAttribute("src")
    ) {
      this.load();
      return;
    }

    super.attributeChangedCallback(name, oldValue, newValue);

    if (name === "progressInterval" && this.player) {
      this.startProgressInterval();
    }
  }

  override play(): Promise<void> {
    if (this.player) {
      this.player.play();
    } else {
      this.pendingPlay = true;
      this.pendingPause = false;
    }
    return Promise.resolve();
  }

  override pause(): Promise<void> {
    if (this.player) {
      this.player.pause();
    } else {
      this.pendingPause = true;
      this.pendingPlay = false;
    }
    return Promise.resolve();
  }

  override destroy(): void {
    super.destroy();
    this.fbPlayerState.destroyed = true;
    this.teardownEmbed();
  }

  override get playing(): boolean {
    return !this.paused;
  }

  override set playing(value: boolean) {
    if (value) {
      void this.play();
    } else {
      void this.pause();
    }
  }

  override seek(seconds: number): void {
    if (this.player) {
      this.player.seek(seconds);
    } else {
      this.pendingSeek = seconds;
    }
    this.playerState.currentTime = seconds;
  }

  override mute(): void {
    this.playerState.muted = true;
    if (this.player) {
      this.player.mute();
    } else {
      this.pendingMuted = true;
    }
    this.dispatchMuteChangeEvent(true);
  }

  override unmute(): void {
    this.playerState.muted = false;
    if (this.player) {
      this.player.unmute();
    } else {
      this.pendingMuted = false;
    }
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
    if (this.player) {
      this.player.setVolume(v);
    } else {
      this.pendingVolume = v;
    }
    this.dispatchVolumeChangeEvent(v * 100);
  }

  setVolume(volume: number): void {
    this.volume = volume <= 1 ? volume * 100 : volume;
  }

  override get error() {
    return this.playerState.error;
  }
}

if (globalThis.customElements && !globalThis.customElements.get("facebook-video")) {
  globalThis.customElements.define("facebook-video", FacebookEmbedPlayer);
}
