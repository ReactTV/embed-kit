import type { ICreatePlayerOptions, TCreatePlayer } from "../_base/index.js";
import type { DailymotionPlayer, DailymotionPlayerState } from "./player.types.js";
import {
  createPlayerContainer,
  loadScript,
  EmbedPlayerVideoElement,
} from "../_base/index.js";

const DAILYMOTION_LIB = "https://geo.dailymotion.com/libs/player.js";

/**
 * Dailymotion embed player as a subclass of EmbedPlayerVideoElement.
 */
class DailymotionEmbedPlayer extends EmbedPlayerVideoElement {
  #dmPlayer: DailymotionPlayer | null = null;
  #wrapper: HTMLElement;
  #options: ICreatePlayerOptions;

  constructor(
    container: HTMLElement,
    id: string,
    options: ICreatePlayerOptions = {},
  ) {
    super(options.url ?? `https://www.dailymotion.com/video/${id}`);
    this.#options = options;
    const { width = 560, height = 315, autoplay = false, controls = true } =
      this.#options;

    const params: Record<string, unknown> = {};
    if (autoplay) params.autoplay = true;
    if (!controls) params.controls = false;

    const { element: wrapper, id: containerId } = createPlayerContainer(
      container,
      "dailymotion-player",
      { width, height },
    );
    this.#wrapper = wrapper;

    void loadScript(DAILYMOTION_LIB, {
      isLoaded: () => !!window.dailymotion?.createPlayer,
      errorMessage: "Failed to load Dailymotion player script",
    })
      .then(() => {
        if (!window.dailymotion?.createPlayer) {
          wrapper.remove();
          return Promise.reject(new Error("Dailymotion player API not available"));
        }
        return window.dailymotion.createPlayer(containerId, {
          video: id,
          ...(Object.keys(params).length > 0 ? { params } : {}),
        });
      })
      .then((dmPlayer) => {
        this.#dmPlayer = dmPlayer;
        const { events } = window.dailymotion!;
        const {
          onReady = () => {},
          onPlay = () => {},
          onPause = () => {},
          onBuffering = () => {},
          onEnded = () => {},
          onProgress = () => {},
          onDurationChange = () => {},
          onSeek = () => {},
          onSeeking = () => {},
          onError = () => {},
        } = this.#options;
        dmPlayer.on(events.VIDEO_PLAY, () => {
          this.playerState.isPlaying = true;
          this.playerState.isPaused = false;
          onPlay();
        });
        dmPlayer.on(events.VIDEO_PAUSE, () => {
          this.playerState.isPlaying = false;
          this.playerState.isPaused = true;
          onPause();
        });
        dmPlayer.on(events.VIDEO_SEEKSTART, onSeeking);
        dmPlayer.on(events.VIDEO_SEEKEND, (data: DailymotionPlayerState) => {
          this.playerState.currentTime = data.videoTime ?? 0;
          onSeek(this.playerState.currentTime);
        });
        dmPlayer.on(events.VIDEO_BUFFERING, onBuffering);
        dmPlayer.on(events.VIDEO_END, onEnded);
        dmPlayer.on(events.PLAYER_VOLUMECHANGE, (data: DailymotionPlayerState) => {
          this.playerState.muted = data.playerIsMuted ?? false;
          if (typeof data.playerVolume === "number" && !Number.isNaN(data.playerVolume)) {
            this.playerState.volume = data.playerVolume;
          }
        });
        dmPlayer.on(events.VIDEO_DURATIONCHANGE, (data: DailymotionPlayerState) => {
          const nextDuration = data.videoDuration ?? 0;
          if (nextDuration !== this.playerState.duration) {
            this.playerState.duration = nextDuration;
            onDurationChange(this.playerState.duration);
          }
        });
        const handleError = (): void => {
          this.playerState.error = { message: "Dailymotion playback error" };
          onError(this.playerState.error);
        };
        dmPlayer.on(events.PLAYER_ERROR, handleError);
        if (events.VIDEO_ERROR) dmPlayer.on(events.VIDEO_ERROR, handleError);
        dmPlayer.on(events.VIDEO_TIMECHANGE, (state?: DailymotionPlayerState) => {
          this.playerState.currentTime = state?.videoTime ?? 0;
          onProgress(this.playerState.currentTime);
        });
        onReady();
        this.markReady();
      })
      .catch((err) => {
        wrapper.remove();
        throw err;
      });
  }

  override play(): Promise<void> {
    this.#dmPlayer?.play();
    return Promise.resolve();
  }
  override pause(): Promise<void> {
    this.#dmPlayer?.pause();
    return Promise.resolve();
  }
  override seek(seconds: number): void {
    this.#dmPlayer?.seek(seconds);
    this.#options.onSeek?.(seconds);
  }
  override mute(): void {
    this.#dmPlayer?.setMute(true);
    this.playerState.muted = true;
    this.#options.onMute?.({ muted: true });
  }
  override unmute(): void {
    this.#dmPlayer?.setMute(false);
    this.playerState.muted = false;
    this.#options.onMute?.({ muted: false });
  }
  override destroy(): void {
    this.#dmPlayer?.destroy();
    this.#wrapper.remove();
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
  override get paused(): boolean {
    return this.playerState.isPaused;
  }
  override get muted(): boolean {
    return this.playerState.muted;
  }
  override get volume(): number {
    return this.playerState.volume ?? this.#dmPlayer?.getVolume?.() ?? 1;
  }
  override set volume(vol: number) {
    const v = Math.max(0, Math.min(1, vol));
    this.#dmPlayer?.setVolume?.(v);
    this.playerState.volume = v;
  }
  override get error() {
    return this.playerState.error;
  }
}

/**
 * Create a controllable Dailymotion player in the given container.
 * Returns an EmbedPlayerVideoElement that mimics HTMLVideoElement.
 */
export const createPlayer: TCreatePlayer = (container, id, options = {}) => {
  const element = new DailymotionEmbedPlayer(container, id, options);
  return element.ready();
};
