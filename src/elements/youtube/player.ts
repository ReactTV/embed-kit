import { loadScript, EmbedVideoElement, DISPATCHED_EVENTS } from "../_base/index.js";
import type { IYTVolumeChangeEvent, YTPlayer } from "./player.types.js";
import { REGEX_WATCH, REGEX_SHORT, REGEX_EMBED } from "./constants.js";
import { parseYouTubeUrl } from "./helpers/parseYouTubeUrl.js";
import {
  IYTPlaybackQualityChangeEvent,
  IYTPlaybackRateChangeEvent,
  YT_PLAYER_STATE,
} from "./player.types.js";

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
 * YouTube embed player as a subclass of EmbedVideoElement.
 */
class YouTubeEmbedPlayer extends EmbedVideoElement {
  protected ytPlayerState: {
    progressIntervalId: ReturnType<typeof setInterval> | undefined;
    destroyed: boolean;
  } = { progressIntervalId: undefined, destroyed: false };

  player: YTPlayer | null = null;

  override load(): void {
    void loadYTScript().then(() => {
      if (this.ytPlayerState.destroyed) return;
      const YT = window.YT!;

      const attributes = this.getAttributes();
      const { videoId } = parseYouTubeUrl(attributes.src!);

      if (!videoId) return;

      this.player = new YT.Player(this, {
        videoId,
        playerVars: {
          autoplay: attributes.autoplay === "true" ? 1 : 0,
          controls: attributes.controls === "false" ? 0 : 1,
          enableCaptions: attributes.enableCaptions === "true" ? 1 : 0,
          showAnnotations: attributes.showAnnotations === "true" ? 1 : 0,
        },
        events: {
          onReady: () => {
            this.dispatchEvent(new Event(DISPATCHED_EVENTS.ready));
          },
          onError: (error) => {
            this.playerState.error = {
              code: error.data,
              message: "YouTube playback error",
            } as MediaError;
            this.dispatchEvent(
              new CustomEvent(DISPATCHED_EVENTS.error, { detail: this.playerState.error })
            );
          },
        },
      });

      this.createListeners();
    });
  }

  createListeners(): void {
    this.player?.addEventListener("onStateChange", ({ data }: { data: number }) => {
      if (data === YT_PLAYER_STATE.PAUSED) {
        this.playerState.isPaused = true;
        this.dispatchEvent(new Event(DISPATCHED_EVENTS.pause));
      } else if (data === YT_PLAYER_STATE.PLAYING) {
        this.playerState.isPaused = false;
        this.dispatchEvent(new Event(DISPATCHED_EVENTS.play));
      } else if (data === YT_PLAYER_STATE.BUFFERING) {
        this.dispatchEvent(new Event(DISPATCHED_EVENTS.buffering));
      } else if (data === YT_PLAYER_STATE.ENDED) {
        this.dispatchEvent(new Event(DISPATCHED_EVENTS.ended));
      } else if (data === YT_PLAYER_STATE.CUED) {
        this.dispatchEvent(new Event(DISPATCHED_EVENTS.cued));
      }
    });

    this.player?.addEventListener(
      "onVolumeChange",
      ({ data: { volume, muted } }: IYTVolumeChangeEvent) => {
        if (volume !== this.playerState.volume) {
          this.playerState.volume = volume;
          this.dispatchEvent(new CustomEvent(DISPATCHED_EVENTS.volume, { detail: volume }));
        }
        if (muted !== this.playerState.muted) {
          this.playerState.muted = muted;
          this.dispatchEvent(new CustomEvent(DISPATCHED_EVENTS.mute, { detail: muted }));
        }
      }
    );

    this.player?.addEventListener(
      "onPlaybackRateChange",
      ({ data }: IYTPlaybackRateChangeEvent) => {
        if (data !== this.playerState.playbackRate) {
          this.playerState.playbackRate = data;
          this.dispatchEvent(
            new CustomEvent(DISPATCHED_EVENTS.playbackRateChange, { detail: data })
          );
        }
      }
    );

    this.player?.addEventListener(
      "onPlaybackQualityChange",
      ({ data }: IYTPlaybackQualityChangeEvent) => {
        if (data !== this.playerState.playbackQuality) {
          this.playerState.playbackQuality = data;
          this.dispatchEvent(
            new CustomEvent(DISPATCHED_EVENTS.playbackQualityChange, { detail: data })
          );
        }
      }
    );
  }

  connectedCallback(): void {
    const src = this.getAttribute("src");

    if (!src) return;

    const videoId =
      src.match(REGEX_WATCH)?.[1] ?? src.match(REGEX_SHORT)?.[1] ?? src.match(REGEX_EMBED)?.[1];
    if (!videoId) return;

    this.load();
  }

  override play(): Promise<void> {
    this.player?.playVideo();
    return Promise.resolve();
  }

  override pause(): Promise<void> {
    this.player?.pauseVideo();
    return Promise.resolve();
  }

  override destroy(): void {
    this.ytPlayerState.destroyed = true;
    if (this.ytPlayerState.progressIntervalId) clearInterval(this.ytPlayerState.progressIntervalId);
    if (this.parentNode) this.remove();
  }

  override get currentTime(): number {
    return this.player?.getCurrentTime() ?? 0;
  }

  override set currentTime(seconds: number) {
    this.player?.seekTo(seconds, true);
  }

  override get duration(): number {
    return this.player?.getDuration() ?? 0;
  }

  override get error() {
    return this.playerState.error;
  }

  override get muted(): boolean {
    return this.player?.isMuted() ?? false;
  }

  override set muted(value: boolean) {
    if (value) {
      this.player?.mute?.();
    } else {
      this.player?.unMute?.();
    }
  }

  override get paused(): boolean {
    return this.player?.getPlayerState() === YT_PLAYER_STATE.PAUSED;
  }

  override get volume(): number {
    return this.player?.getVolume() ?? 0;
  }

  override set volume(vol: number) {
    const v = Math.max(0, Math.min(1, vol));
    this.player?.setVolume(v);
  }
}

if (globalThis.customElements && !globalThis.customElements.get("youtube-video")) {
  globalThis.customElements.define("youtube-video", YouTubeEmbedPlayer);
}
