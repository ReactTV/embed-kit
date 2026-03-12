import { DISPATCHED_EVENTS, TDispatchedEventPayloads } from "./player.types.js";

export type TEmbedVideoElementOptions = {
  autoplay: boolean;
  progressInterval: number;
  controls: boolean;
  captions: boolean;
  annotations: boolean;
  relatedVideos: boolean;
  config: {
    youtube: Record<string, number | string | undefined>;
    vimeo: Record<string, number | string | undefined>;
  };
};

const generateDefaultOptions = (): TEmbedVideoElementOptions => ({
  autoplay: false,
  progressInterval: 50,
  controls: true,
  captions: false,
  annotations: false,
  relatedVideos: false,
  config: {
    youtube: {},
    vimeo: {},
  },
});

/**
 * Class-based mimic of HTMLVideoElement. Providers can either (1) extend this
 * class and override play(), pause(), seek(), getters, etc., or (2) construct
 * it and call setPlayer(inner) when the inner player is ready.
 */
export class EmbedVideoElement extends HTMLElement {
  readonly src: string = "";
  iframe: HTMLIFrameElement | null = null;
  handleMessage: (event: MessageEvent) => void = () => {};

  protected embedContainer: HTMLDivElement | null = null;

  constructor() {
    super();
    const root = this.attachShadow({ mode: "open" });
    const container = document.createElement("div");
    container.style.cssText = "width:100%;height:100%;display:block;position:relative;";
    root.appendChild(container);
    this.embedContainer = container;
  }

  protected getEmbedContainer(): HTMLDivElement {
    if (!this.embedContainer) throw new Error("EmbedVideoElement: embedContainer not initialized");
    return this.embedContainer;
  }

  static observedAttributes: string[] = [
    "src",
    "muted",
    "playing",
    "autoplay",
    "controls",
    "captions",
    "annotations",
    "relatedVideos",
    "volume",
  ];

  protected options: TEmbedVideoElementOptions = generateDefaultOptions();

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

  loadInitialOptions(): void {
    const attributes = this.getAttributes();

    this.options = {
      autoplay: attributes.autoplay === "" || attributes.autoplay === "true",
      progressInterval: attributes.progressInterval
        ? parseInt(attributes.progressInterval, 10)
        : 50,
      controls: attributes.controls === "true",
      captions: attributes.captions === "true",
      annotations: attributes.annotations === "true",
      relatedVideos: attributes.relatedVideos === "true",
      config: {
        youtube: attributes.youtube ? JSON.parse(attributes.youtube) : {},
        vimeo: attributes.vimeo ? JSON.parse(attributes.vimeo) : {},
      },
    };
  }

  load(): void {}

  destroy(): void | Promise<void> {
    return Promise.resolve();
  }

  mute(): void | Promise<void> {
    return Promise.resolve();
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

  unmute(): void | Promise<void> {
    return Promise.resolve();
  }

  get annotations(): boolean {
    return this.options.annotations;
  }

  set annotations(_value: boolean) {
    this.options.annotations = _value;
  }

  get autoplay(): boolean {
    return this.options.autoplay;
  }

  set autoplay(_value: boolean) {
    this.options.autoplay = _value;
  }

  get captions(): boolean {
    return this.options.captions;
  }

  set captions(_value: boolean) {
    this.options.captions = _value;
  }

  get controls(): boolean {
    return this.options.controls;
  }

  set controls(_value: boolean) {
    this.options.controls = _value;
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

  get error() {
    return this.playerState.error;
  }

  set error(_value: MediaError | null) {
    //
  }

  get muted(): boolean {
    return this.playerState.muted;
  }

  set muted(_value: boolean) {
    //
  }

  get paused(): boolean {
    return this.playerState.isPaused;
  }

  get playing(): boolean {
    return !this.playerState.isPaused;
  }

  set playing(_value: boolean) {
    //
  }

  get relatedVideos(): boolean {
    return this.options.relatedVideos;
  }

  set relatedVideos(_value: boolean) {
    this.options.relatedVideos = _value;
  }

  get volume(): number {
    return this.playerState.volume;
  }

  set volume(_value: number) {
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

    if (name === "autoplay") {
      this.autoplay = newValue === "true";
    }

    if (name === "controls") {
      this.controls = newValue === "true";
    }

    if (name === "captions") {
      this.captions = newValue === "true";
    }

    if (name === "annotations") {
      this.annotations = newValue === "true";
    }

    if (name === "relatedVideos") {
      this.relatedVideos = newValue === "true";
    }
  }

  protected getAttributes = () =>
    Array.from(this.attributes).reduce<Record<string, string>>((acc, attr) => {
      acc[attr.name] = attr.value;
      return acc;
    }, {});
}
