import { loadScript, EmbedVideoElement } from "../_base/index.js";
import type { IYTVolumeChangeEvent, YTPlayer } from "./player.types.js";
import { REGEX_WATCH, REGEX_SHORT, REGEX_EMBED } from "./constants.js";
import { parseYouTubeUrl } from "./helpers/parseYouTubeUrl.js";
import { YT_PLAYER_STATE, IVideoProgressEvent } from "./player.types.js";

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

  api: YTPlayer | null = null;
  player: YTPlayer | null = null;

  override load(): void {
    if (this.api) {
      this.player?.destroy();
      this.player = null;
    }

    void loadYTScript().then(() => {
      if (this.ytPlayerState.destroyed) return;
      const YT = window.YT!;

      const attributes = this.getAttributes();
      const { videoId } = parseYouTubeUrl(attributes.src!);

      if (!videoId) return;

      this.api = new YT.Player(this.getEmbedContainer(), {
        videoId,
        playerVars: {
          autoplay: this.options.autoplay ? 1 : 0,
          controls: this.options.controls ? 1 : 0,
          cc_load_policy: this.options.captions ? 1 : 0,
          iv_load_policy: this.options.annotations ? 1 : 3,
          rel: this.options.relatedVideos ? 1 : 0,
          mute: this.options.muted ? 1 : 0,
          origin: window.location.origin,
        },
        events: {
          onReady: ({ target }) => {
            this.player = target;
            this.setInitialPlayerState();
            this.dispatchReadyEvent();
          },
          onStateChange: (event) => {
            this.playerState.isBuffering = false;

            if (event.data === YT_PLAYER_STATE.UNSTARTED) {
              this.dispatchReadyEvent();
            } else if (event.data === YT_PLAYER_STATE.PAUSED) {
              this.playerState.isPaused = true;
              this.dispatchPauseEvent();
            } else if (event.data === YT_PLAYER_STATE.PLAYING) {
              this.playerState.isPaused = false;
              this.dispatchPlayEvent();
            } else if (event.data === YT_PLAYER_STATE.BUFFERING) {
              this.playerState.isBuffering = true;
              this.dispatchBufferingEvent();
            } else if (event.data === YT_PLAYER_STATE.ENDED) {
              this.dispatchEndedEvent();
            } else if (event.data === YT_PLAYER_STATE.CUED) {
              this.dispatchCuedEvent();
            }
          },
          onError: (error) => {
            this.playerState.error = {
              code: error.data,
              message: "YouTube playback error",
            } as MediaError;
            this.dispatchErrorEvent(this.playerState.error);
          },
          onApiChange: () => {
            // console.log("onApiChange");
          },
          onPlaybackRateChange: (event) => {
            if (event.data !== this.playerState.playbackRate) {
              this.playerState.playbackRate = event.data;
              this.dispatchPlaybackRateChangeEvent(event.data);
            }
          },
          onPlaybackQualityChange: (event) => {
            if (event.data !== this.playerState.playbackQuality) {
              this.playerState.playbackQuality = event.data;
              this.dispatchPlaybackQualityChangeEvent(event.data);
            }
          },
        },
      });

      this.createListeners();
    });
  }

  setInitialPlayerState(): void {
    const attributes = this.getAttributes();

    if (attributes.volume) {
      this.volume = parseFloat(attributes.volume);
    }

    if (attributes.muted) {
      this.muted = attributes.muted === "true";
    }

    if (this.hasAttribute("playing")) {
      const wantPlay = this.getAttribute("playing") === "true";
      // Autoplay in the iframe starts playback; do not call pause() on ready when the author
      // also left playing="false" (e.g. React default state). Same idea as honoring autoplay over
      // an initial paused controlled prop until playing is toggled.
      if (!(wantPlay === false && this.options.autoplay)) {
        this.playing = wantPlay;
      }
    }
  }

  createListeners(): void {
    this.api?.addEventListener(
      "onVolumeChange",
      ({ data: { volume, muted } }: IYTVolumeChangeEvent) => {
        if (volume !== this.playerState.volume) {
          this.playerState.volume = volume;
          this.dispatchVolumeChangeEvent(volume);
        }
        if (muted !== this.playerState.muted) {
          this.playerState.muted = muted;
          this.dispatchMuteChangeEvent(muted);
        }
      }
    );

    this.api?.addEventListener("onVideoProgress", (event: IVideoProgressEvent) => {
      this.dispatchProgressEvent(event.data);
    });
  }

  connectedCallback(): void {
    this.loadInitialOptions();

    const src = this.getAttribute("src");

    if (!src) return;

    const videoId =
      src.match(REGEX_WATCH)?.[1] ?? src.match(REGEX_SHORT)?.[1] ?? src.match(REGEX_EMBED)?.[1];
    if (!videoId) return;

    this.load();
  }

  /**
   * Ignore the first `playing="false"` attribute when autoplay is on so `EmbedVideoElement`'s
   * `this.playing = false` does not call `pauseVideo()` after the iframe has started autoplay.
   * (React often sets `playing="false"` alongside `autoplay` for initial state.)
   */
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

    super.attributeChangedCallback(name, oldValue, newValue);
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
    // this.player?.destroy();
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

  override set captions(value: boolean) {
    this.options.captions = value;

    if (value) {
      this.player?.loadModule("captions");
    } else {
      this.player?.unloadModule("captions");
    }
  }

  override set controls(value: boolean) {
    this.options.controls = value;
    this.load();
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
    const v = Math.max(0, Math.min(100, vol));
    this.player?.setVolume(v);
  }
}

if (globalThis.customElements && !globalThis.customElements.get("youtube-video")) {
  globalThis.customElements.define("youtube-video", YouTubeEmbedPlayer);
}
