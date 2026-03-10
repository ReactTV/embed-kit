import { DISPATCHED_EVENTS, TDispatchedEventPayloads } from "./player.types.js";

/**
 * Class-based mimic of HTMLVideoElement. Providers can either (1) extend this
 * class and override play(), pause(), seek(), getters, etc., or (2) construct
 * it and call setPlayer(inner) when the inner player is ready.
 */
export class EmbedVideoElement extends HTMLElement {
  readonly src: string = "";
  iframe: HTMLIFrameElement | null = null;
  handleMessage: (event: MessageEvent) => void = () => {};
  static observedAttributes: string[] = [
    "src",
    "muted",
    "playing",
    "autoplay",
    "controls",
    "enableCaptions",
    "showAnnotations",
    "volume",
  ];

  protected options = {
    autoplay: false,
    progressInterval: 50,
    controls: true,
    enableCaptions: false,
    showAnnotations: false,
    config: {
      youtube: {},
      vimeo: {
        h: "0",
      },
    },
  };

  protected playerState = {
    currentTime: 0,
    duration: 0,
    isPaused: true,
    muted: false,
    error: null as MediaError | null,
    volume: 0.2,
    playbackRate: 1,
    playbackQuality: "small",
  };

  load(): void {
    //
  }

  play(): Promise<void> {
    return Promise.resolve();
  }
  pause(): Promise<void> {
    return Promise.resolve();
  }
  seek(_seconds: number): void | Promise<void> {
    return Promise.resolve();
  }
  mute(): void | Promise<void> {
    return Promise.resolve();
  }
  unmute(): void | Promise<void> {
    return Promise.resolve();
  }
  destroy(): void | Promise<void> {
    return Promise.resolve();
  }
  get playing(): boolean {
    return !this.playerState.isPaused;
  }
  set playing(_value: boolean) {
    //
  }
  get paused(): boolean {
    return this.playerState.isPaused;
  }
  get currentTime(): number {
    return this.playerState.currentTime;
  }
  set currentTime(_seconds: number) {
    //
  }
  get duration(): number {
    return this.playerState.duration;
  }
  get muted(): boolean {
    return this.playerState.muted;
  }
  set muted(_value: boolean) {
    //
  }

  get volume(): number {
    return this.playerState.volume;
  }
  set volume(_value: number) {
    //
  }
  get error() {
    return this.playerState.error;
  }

  set error(_value: MediaError | null) {
    //
  }

  dispatchReadyEvent() {
    this.dispatchEvent(
      new CustomEvent<TDispatchedEventPayloads["onReady"]>(DISPATCHED_EVENTS.ready)
    );
  }

  dispatchErrorEvent(error: MediaError) {
    this.dispatchEvent(
      new CustomEvent<TDispatchedEventPayloads["onError"]>(DISPATCHED_EVENTS.error, {
        detail: error,
      })
    );
  }

  dispatchPlayEvent() {
    this.dispatchEvent(new CustomEvent<TDispatchedEventPayloads["onPlay"]>(DISPATCHED_EVENTS.play));
  }

  dispatchPauseEvent() {
    this.dispatchEvent(
      new CustomEvent<TDispatchedEventPayloads["onPause"]>(DISPATCHED_EVENTS.pause)
    );
  }

  dispatchBufferingEvent() {
    this.dispatchEvent(
      new CustomEvent<TDispatchedEventPayloads["onBuffering"]>(DISPATCHED_EVENTS.buffering)
    );
  }

  dispatchEndedEvent() {
    this.dispatchEvent(
      new CustomEvent<TDispatchedEventPayloads["onEnded"]>(DISPATCHED_EVENTS.ended)
    );
  }

  dispatchCuedEvent() {
    this.dispatchEvent(new CustomEvent<TDispatchedEventPayloads["onCued"]>(DISPATCHED_EVENTS.cued));
  }

  dispatchVolumeChangeEvent(volume: TDispatchedEventPayloads["onVolumeChange"]) {
    this.dispatchEvent(
      new CustomEvent<TDispatchedEventPayloads["onVolumeChange"]>(DISPATCHED_EVENTS.volume, {
        detail: volume,
      })
    );
  }

  dispatchMuteChangeEvent(muted: TDispatchedEventPayloads["onMuteChange"]) {
    this.dispatchEvent(
      new CustomEvent<TDispatchedEventPayloads["onMuteChange"]>(DISPATCHED_EVENTS.mute, {
        detail: muted,
      })
    );
  }

  dispatchPlaybackRateChangeEvent(playbackRate: TDispatchedEventPayloads["onPlaybackRateChange"]) {
    this.dispatchEvent(
      new CustomEvent<TDispatchedEventPayloads["onPlaybackRateChange"]>(
        DISPATCHED_EVENTS.playbackRateChange,
        { detail: playbackRate }
      )
    );
  }

  dispatchPlaybackQualityChangeEvent(
    playbackQuality: TDispatchedEventPayloads["onPlaybackQualityChange"]
  ) {
    this.dispatchEvent(
      new CustomEvent<TDispatchedEventPayloads["onPlaybackQualityChange"]>(
        DISPATCHED_EVENTS.playbackQualityChange,
        { detail: playbackQuality }
      )
    );
  }

  dispatchDurationChangeEvent(duration: TDispatchedEventPayloads["onDurationChange"]) {
    this.dispatchEvent(
      new CustomEvent<TDispatchedEventPayloads["onDurationChange"]>(
        DISPATCHED_EVENTS.durationchange,
        {
          detail: duration,
        }
      )
    );
  }

  dispatchProgressEvent(progress: TDispatchedEventPayloads["onProgress"]) {
    this.dispatchEvent(
      new CustomEvent<TDispatchedEventPayloads["onProgress"]>(DISPATCHED_EVENTS.progress, {
        detail: progress,
      })
    );
  }

  attributeChangedCallback(name: string, oldValue: string, newValue: string): void {
    if (oldValue === newValue) return;

    if (name === "src") {
      this.load();
    }

    if (name === "muted") {
      this.muted = newValue === "true";
    }

    if (name === "playing") {
      this.playing = newValue === "true";
    }

    if (name === "volume") {
      this.volume = parseFloat(newValue);
    }
  }

  protected getAttributes = () =>
    Array.from(this.attributes).reduce<Record<string, string>>((acc, attr) => {
      acc[attr.name] = attr.value;
      return acc;
    }, {});
}
