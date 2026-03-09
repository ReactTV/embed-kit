import type { ICreatePlayerOptions } from "../_base/index.js";
import { createPlayerContainer, loadScript, EmbedPlayerVideoElement } from "../_base/index.js";

const YT_SCRIPT = "https://www.youtube.com/iframe_api";

declare global {
  interface Window {
    YT?: {
      Player: new (el: string | HTMLElement, opts: YTOptions) => YTPlayer;
      PlayerState: { ENDED: 0; PLAYING: 1; PAUSED: 2; BUFFERING: 3; CUED: 5 };
    };
    onYouTubeIframeAPIReady?: () => void;
  }
}

interface YTOptions {
  videoId: string;
  width?: number;
  height?: number;
  playerVars?: Record<string, number | string>;
  events?: {
    onReady?: (ev: { target: YTPlayer }) => void;
    onStateChange?: (ev: { data: number }) => void;
    onError?: (ev: { data: number }) => void;
    onPlaybackQualityChange?: (ev: { data: string }) => void;
    onPlaybackRateChange?: (ev: { data: number }) => void;
    onAutoplayBlocked?: () => void;
    onApiChange?: () => void;
  };
}

interface YTPlayer {
  playVideo: () => void;
  pauseVideo: () => void;
  getPlayerState: () => number;
  getCurrentTime: () => number;
  getDuration: () => number;
  seekTo: (seconds: number, allowSeekAhead: boolean) => void;
  mute: () => void;
  unMute: () => void;
  isMuted: () => boolean;
  getVolume: () => number;
  setVolume: (volume: number) => void;
}

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
  #player: YTPlayer | null = null;
  #div: HTMLElement | null = null;
  #readyState: {
    progressIntervalId: ReturnType<typeof setInterval> | undefined;
    destroyed: boolean;
  };
  #options: ICreatePlayerOptions;
  #initialVolume: number | undefined;
  #progressInterval: number;

  constructor(container: HTMLElement, id: string, options: ICreatePlayerOptions = {}) {
    const initialVolume = options.volume;
    const stateOverrides =
      typeof initialVolume === "number" && initialVolume >= 0 && initialVolume <= 1
        ? { volume: initialVolume }
        : undefined;
    super(options.url ?? `https://www.youtube.com/watch?v=${id}`, stateOverrides);
    this.#options = options;
    const {
      width = 560,
      height = 315,
      autoplay = false,
      volume: vol,
      controls = true,
      enableCaptions,
      showAnnotations,
      config,
      progressInterval = 50,
    } = this.#options;
    this.#initialVolume = vol;
    this.#progressInterval = progressInterval;

    const youtubeConfig = config?.youtube ?? {};
    const playerVars: Record<string, number | string> = {
      autoplay: autoplay ? 1 : 0,
      ...youtubeConfig,
    };
    if (controls !== undefined) playerVars.controls = controls ? 1 : 0;
    if (enableCaptions !== undefined) playerVars.cc_load_policy = enableCaptions ? 1 : 0;
    if (showAnnotations !== undefined) playerVars.iv_load_policy = showAnnotations ? 1 : 3;

    this.#readyState = { progressIntervalId: undefined, destroyed: false };

    const {
      onReady = () => {},
      onPlay = () => {},
      onPause = () => {},
      onBuffering = () => {},
      onEnded = () => {},
      onProgress = () => {},
      onDurationChange = () => {},
      onMute = () => {},
      onError = () => {},
      onPlaybackQualityChange = () => {},
      onPlaybackRateChange = () => {},
      onAutoplayBlocked = () => {},
      onApiChange = () => {},
    } = this.#options;

    void loadYTScript().then(() => {
      if (this.#readyState.destroyed) return;
      const YT = window.YT!;
      const { PlayerState } = YT;
      const { element: div } = createPlayerContainer(container, "yt-player");
      this.#div = div;

      new YT.Player(div, {
        videoId: id,
        width,
        height,
        playerVars,
        events: {
          onError: (ev: { data: number }) => {
            const customError = { code: ev.data, message: "YouTube playback error" } as MediaError;
            this.playerState.error = customError;
            onError(this.playerState.error);
          },
          onReady: (ev: { target: YTPlayer }) => {
            if (this.#readyState.destroyed) return;
            this.#player = ev.target;
            const player = this.#player;
            if (
              typeof this.#initialVolume === "number" &&
              this.#initialVolume >= 0 &&
              this.#initialVolume <= 1
            ) {
              player.setVolume(Math.round(this.#initialVolume * 100));
              this.playerState.volume = this.#initialVolume;
            } else {
              this.playerState.volume = player.getVolume() / 100;
            }
            onReady();
            if (this.#readyState.destroyed) return;
            this.#readyState.progressIntervalId = setInterval(() => {
              if (this.#readyState.destroyed || !this.#player) return;
              this.playerState.currentTime = this.#player.getCurrentTime();
              onProgress(this.playerState.currentTime);
              const isMuted = this.#player.isMuted();
              if (this.playerState.muted !== isMuted) {
                this.playerState.muted = isMuted;
                onMute({ muted: isMuted });
              }
              this.playerState.volume = this.#player.getVolume() / 100;
              this.playerState.isPlaying = this.#player.getPlayerState() === PlayerState.PLAYING;
              this.playerState.isPaused = this.#player.getPlayerState() === PlayerState.PAUSED;
              const newDuration = this.#player.getDuration();
              if (newDuration !== this.playerState.duration) {
                this.playerState.duration = newDuration;
                onDurationChange(this.playerState.duration);
              }
              this.playerState.currentTime = this.#player.getCurrentTime();
              this.playerState.error = null;
            }, this.#progressInterval);
            this.markReady();
          },
          onStateChange: (ev: { data: number }) => {
            if (ev.data === PlayerState.PLAYING) onPlay();
            if (ev.data === PlayerState.PAUSED) onPause();
            if (ev.data === PlayerState.BUFFERING) onBuffering();
            if (ev.data === PlayerState.ENDED) onEnded();
          },
          onPlaybackQualityChange: (ev: { data: string }) => onPlaybackQualityChange(ev.data),
          onPlaybackRateChange: (ev: { data: number }) => onPlaybackRateChange(ev.data),
          onAutoplayBlocked: () => onAutoplayBlocked(),
          onApiChange: () => onApiChange(),
        },
      });
    });
  }

  override play(): Promise<void> {
    this.#player?.playVideo();
    return Promise.resolve();
  }
  override pause(): Promise<void> {
    this.#player?.pauseVideo();
    return Promise.resolve();
  }
  override seek(seconds: number): void {
    this.#player?.seekTo(seconds, true);
    this.#options.onSeek?.(seconds);
  }
  override mute(): void {
    this.#player?.mute();
    this.playerState.muted = true;
    this.#options.onMute?.({ muted: true });
  }
  override unmute(): void {
    this.#player?.unMute();
    this.playerState.muted = false;
    this.#options.onMute?.({ muted: false });
  }
  override destroy(): void {
    this.#readyState.destroyed = true;
    if (this.#readyState.progressIntervalId) clearInterval(this.#readyState.progressIntervalId);
    if (this.#div?.parentNode) this.#div.remove();
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
    this.#player?.setVolume(Math.round(v * 100));
    this.playerState.volume = v;
  }
  override get error() {
    return this.playerState.error;
  }
}

if (globalThis.customElements && !globalThis.customElements.get("youtube-video")) {
  globalThis.customElements.define("youtube-video", YouTubeEmbedPlayer, {
    extends: "video",
  });
}
