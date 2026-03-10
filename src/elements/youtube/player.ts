import { createPlayerContainer, loadScript, EmbedPlayerVideoElement } from "../_base/index.js";
import type { YTPlayer } from "./player.types.js";
import { REGEX_WATCH, REGEX_SHORT, REGEX_EMBED } from "./constants.js";

const YT_SCRIPT = "https://www.youtube.com/iframe_api";

function loadYTScript(): Promise<void> {
  return loadScript(YT_SCRIPT, {
    isLoaded: () => !!window.YT?.Player,
    ready: () =>
      new Promise((resolve) => {
        const prev = window.onYouTubeIframeAPIReady;
        window.onYouTubeIframeAPIReady = () => {
          prev?.();
          resolve();
        };
      }),
    errorMessage: "Failed to load YouTube iframe API",
  });
}

/**
 * YouTube embed player as a subclass of EmbedPlayerVideoElement.
 */
class YouTubeEmbedPlayer extends EmbedPlayerVideoElement {
  protected ytPlayerState: {
    progressIntervalId: ReturnType<typeof setInterval> | undefined;
    destroyed: boolean;
  } = { progressIntervalId: undefined, destroyed: false };

  protected player: YTPlayer | null = null;

  connectedCallback(): void {
    const src = this.getAttribute("src");

    if (!src) return;

    const videoId =
      src.match(REGEX_WATCH)?.[1] ?? src.match(REGEX_SHORT)?.[1] ?? src.match(REGEX_EMBED)?.[1];
    if (!videoId) return;

    const {
      width = 560,
      height = 315,
      autoplay = false,
      muted: optionsMuted,
      controls = true,
      enableCaptions,
      showAnnotations,
      config,
    } = this.options;

    const youtubeConfig = config?.youtube ?? {};
    const playerVars: Record<string, number | string> = {
      autoplay: autoplay ? 1 : 0,
      ...youtubeConfig,
    };
    if (controls !== undefined) playerVars.controls = controls ? 1 : 0;
    if (enableCaptions !== undefined) playerVars.cc_load_policy = enableCaptions ? 1 : 0;
    if (showAnnotations !== undefined) playerVars.iv_load_policy = showAnnotations ? 1 : 3;

    this.ytPlayerState = { progressIntervalId: undefined, destroyed: false };

    void loadYTScript().then(() => {
      if (this.ytPlayerState.destroyed) return;
      const YT = window.YT!;
      const { PlayerState } = YT;
      const { element: div } = createPlayerContainer(this, "yt-player");

      const initialVolume = this.getAttribute("volume") ?? 0.5;

      new YT.Player(div, {
        videoId,
        width,
        height,
        playerVars,
        events: {
          onError: (ev: { data: number }) => {
            const customError = { code: ev.data, message: "YouTube playback error" } as MediaError;
            this.playerState.error = customError;
            this.dispatchEvent(new CustomEvent("error", { detail: customError }));
          },
          onReady: (ev: { target: YTPlayer }) => {
            if (this.ytPlayerState.destroyed) return;

            this.player = ev.target;
            this.playerState.currentTime = 0;
            if (optionsMuted === true) {
              this.player.mute();
              this.playerState.muted = true;
            } else {
              this.playerState.muted = this.player.isMuted();
            }
            if (typeof initialVolume === "number" && initialVolume >= 0 && initialVolume <= 1) {
              this.player.setVolume(Math.round(initialVolume * 100));
              this.playerState.volume = initialVolume;
            } else {
              this.playerState.volume = this.player.getVolume() / 100;
            }
            this.dispatchEvent(new Event("ready"));

            if (this.ytPlayerState.destroyed) return;
            this.ytPlayerState.progressIntervalId = setInterval(() => {
              if (this.ytPlayerState.destroyed || !this.player) return;
              const t = Number(this.player.getCurrentTime());
              this.emitProgress(Number.isFinite(t) ? t : this.playerState.currentTime);
              const isMuted = this.player.isMuted();
              if (this.playerState.muted !== isMuted) {
                this.playerState.muted = isMuted;
                this.dispatchEvent(new CustomEvent("mute", { detail: isMuted }));
              }
              this.playerState.volume = this.player.getVolume() / 100;
              this.playerState.isPlaying = this.player.getPlayerState() === PlayerState.PLAYING;
              this.playerState.isPaused = this.player.getPlayerState() === PlayerState.PAUSED;
              const newDuration = this.player.getDuration();
              if (newDuration !== this.playerState.duration) {
                this.playerState.duration = newDuration;
                this.dispatchEvent(
                  new CustomEvent("durationchange", { detail: this.playerState.duration })
                );
              }
              const t2 = Number(this.player.getCurrentTime());
              if (Number.isFinite(t2)) this.playerState.currentTime = t2;
              this.playerState.error = null;
            }, this.options.progressInterval);
          },
          onStateChange: (ev: { data: number }) => {
            if (ev.data === PlayerState.PLAYING) this.dispatchEvent(new Event("play"));
            if (ev.data === PlayerState.PAUSED) this.dispatchEvent(new Event("pause"));
            if (ev.data === PlayerState.BUFFERING) this.dispatchEvent(new Event("buffering"));
            if (ev.data === PlayerState.ENDED) this.dispatchEvent(new Event("ended"));
          },
          onPlaybackQualityChange: (ev: { data: string }) =>
            this.dispatchEvent(new CustomEvent("playbackqualitychange", { detail: ev.data })),
          onPlaybackRateChange: (ev: { data: number }) =>
            this.dispatchEvent(new CustomEvent("playbackratechange", { detail: ev.data })),
          onAutoplayBlocked: () => this.dispatchEvent(new Event("autoplayblocked")),
          onApiChange: () => this.dispatchEvent(new Event("apichange")),
        },
      });
    });
  }

  override play(): Promise<void> {
    this.player?.playVideo();
    return Promise.resolve();
  }
  override pause(): Promise<void> {
    this.player?.pauseVideo();
    return Promise.resolve();
  }
  override seek(seconds: number): void {
    this.player?.seekTo(seconds, true);
    this.dispatchEvent(new CustomEvent("seek", { detail: seconds }));
  }
  override mute(): void {
    this.player?.mute();
    this.playerState.muted = true;
    this.dispatchEvent(new CustomEvent("mute", { detail: true }));
  }
  override unmute(): void {
    this.player?.unMute();
    this.playerState.muted = false;
    this.dispatchEvent(new CustomEvent("unmute", { detail: false }));
  }
  override destroy(): void {
    this.ytPlayerState.destroyed = true;
    if (this.ytPlayerState.progressIntervalId) clearInterval(this.ytPlayerState.progressIntervalId);
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
    return this.playerState.volume ?? 1;
  }
  override set volume(vol: number) {
    const v = Math.max(0, Math.min(1, vol));
    this.player?.setVolume(Math.round(v * 100));
    this.playerState.volume = v;
  }
  override get error() {
    return this.playerState.error;
  }
}

if (globalThis.customElements && !globalThis.customElements.get("youtube-video")) {
  globalThis.customElements.define("youtube-video", YouTubeEmbedPlayer);
}
