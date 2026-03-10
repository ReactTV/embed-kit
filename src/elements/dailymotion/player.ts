import { createPlayerContainer, loadScript, EmbedPlayerVideoElement } from "../_base/index.js";
import { REGEX_VIDEO, REGEX_SHORT, REGEX_EMBED } from "./constants.js";
import type { DailymotionPlayer, DailymotionPlayerState } from "./player.types.js";

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
 * Dailymotion embed player as a subclass of EmbedPlayerVideoElement.
 */
class DailymotionEmbedPlayer extends EmbedPlayerVideoElement {
  protected player: DailymotionPlayer | null = null;
  protected wrapper: HTMLDivElement | null = null;
  protected dmPlayerState: { destroyed: boolean } = { destroyed: false };

  connectedCallback(): void {
    const src = this.getAttribute("src");

    if (!src) return;

    const videoId = parseDailymotionId(src);
    if (!videoId) return;

    const width = Number(this.getAttribute("width")) || this.options.width;
    const height = Number(this.getAttribute("height")) || this.options.height;
    const autoplay =
      this.getAttribute("autoplay") != null
        ? this.getAttribute("autoplay") !== "false"
        : (this.options.autoplay ?? false);
    const optionsMuted = this.options.muted;
    const controls =
      this.getAttribute("controls") != null
        ? this.getAttribute("controls") !== "false"
        : (this.options.controls ?? true);

    const params: Record<string, unknown> = {};
    if (autoplay) params.autoplay = true;
    if (!controls) params.controls = false;

    const { element: wrapper, id: containerId } = createPlayerContainer(
      this,
      "dailymotion-player",
      { width, height }
    );
    this.wrapper = wrapper;
    this.dmPlayerState = { destroyed: false };

    void loadDailymotionScript()
      .then(() => {
        if (this.dmPlayerState.destroyed) return undefined;
        if (!window.dailymotion?.createPlayer) {
          return Promise.reject(new Error("Dailymotion player API not available"));
        }
        return window.dailymotion.createPlayer(containerId, {
          video: videoId,
          ...(Object.keys(params).length > 0 ? { params } : {}),
        });
      })
      .then((dmPlayer) => {
        if (!dmPlayer || this.dmPlayerState.destroyed) return;

        this.player = dmPlayer;
        const { events } = window.dailymotion!;

        const handleError = (): void => {
          this.playerState.error = {
            code: 0,
            message: "Dailymotion playback error",
          } as MediaError;
          this.dispatchEvent(new CustomEvent("error", { detail: this.playerState.error }));
        };

        dmPlayer.on(events.VIDEO_PLAY, () => {
          this.playerState.isPlaying = true;
          this.playerState.isPaused = false;
          this.dispatchEvent(new Event("play"));
        });
        dmPlayer.on(events.VIDEO_PAUSE, () => {
          this.playerState.isPlaying = false;
          this.playerState.isPaused = true;
          this.dispatchEvent(new Event("pause"));
        });
        dmPlayer.on(events.VIDEO_SEEKSTART, () => this.dispatchEvent(new Event("seeking")));
        dmPlayer.on(events.VIDEO_SEEKEND, (data: DailymotionPlayerState) => {
          this.playerState.currentTime = data.videoTime ?? 0;
          this.dispatchEvent(new CustomEvent("seek", { detail: this.playerState.currentTime }));
        });
        dmPlayer.on(events.VIDEO_BUFFERING, () => this.dispatchEvent(new Event("buffering")));
        dmPlayer.on(events.VIDEO_END, () => this.dispatchEvent(new Event("ended")));
        dmPlayer.on(events.PLAYER_VOLUMECHANGE, (data: DailymotionPlayerState) => {
          this.playerState.muted = data.playerIsMuted ?? false;
          if (typeof data.playerVolume === "number" && !Number.isNaN(data.playerVolume)) {
            this.playerState.volume = data.playerVolume;
          }
          this.dispatchEvent(new CustomEvent("mute", { detail: this.playerState.muted }));
        });
        dmPlayer.on(events.VIDEO_DURATIONCHANGE, (data: DailymotionPlayerState) => {
          const nextDuration = data.videoDuration ?? 0;
          if (nextDuration !== this.playerState.duration) {
            this.playerState.duration = nextDuration;
            this.dispatchEvent(
              new CustomEvent("durationchange", { detail: this.playerState.duration })
            );
          }
        });
        dmPlayer.on(events.PLAYER_ERROR, handleError);
        if (events.VIDEO_ERROR) dmPlayer.on(events.VIDEO_ERROR, handleError);
        dmPlayer.on(events.VIDEO_TIMECHANGE, (state?: DailymotionPlayerState) => {
          this.emitProgress(state?.videoTime ?? this.playerState.currentTime);
        });

        if (optionsMuted === true) {
          dmPlayer.setMute(true);
          this.playerState.muted = true;
        }
        this.dispatchEvent(new Event("ready"));
      })
      .catch((err) => {
        if (this.wrapper?.parentNode) this.wrapper.remove();
        this.wrapper = null;
        throw err;
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
    this.player?.seek(seconds);
    this.playerState.currentTime = seconds;
    this.dispatchEvent(new CustomEvent("seek", { detail: seconds }));
  }
  override mute(): void {
    this.player?.setMute(true);
    this.playerState.muted = true;
    this.dispatchEvent(new CustomEvent("mute", { detail: true }));
  }
  override unmute(): void {
    this.player?.setMute(false);
    this.playerState.muted = false;
    this.dispatchEvent(new CustomEvent("unmute", { detail: false }));
  }
  override destroy(): void {
    this.dmPlayerState.destroyed = true;
    this.player?.destroy();
    this.player = null;
    if (this.wrapper?.parentNode) this.wrapper.remove();
    this.wrapper = null;
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
  override set muted(value: boolean) {
    if (value) {
      this.mute();
    } else {
      this.unmute();
    }
  }
  override get volume(): number {
    return this.playerState.volume ?? this.player?.getVolume?.() ?? 1;
  }
  override set volume(vol: number) {
    const v = Math.max(0, Math.min(1, vol));
    this.player?.setVolume?.(v);
    this.playerState.volume = v;
  }
  override get error() {
    return this.playerState.error;
  }
}

if (globalThis.customElements && !globalThis.customElements.get("dailymotion-video")) {
  globalThis.customElements.define("dailymotion-video", DailymotionEmbedPlayer);
}
