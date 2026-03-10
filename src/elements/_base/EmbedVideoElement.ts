import type { IEmbedProgressEvent } from "./player.types.js";

export const DISPATCHED_EVENTS = {
  ready: "onReady",
  play: "onPlay",
  pause: "onPause",
  buffering: "onBuffering",
  ended: "onEnded",
  error: "onError",
  progress: "onProgress",
  durationchange: "onDurationChange",
  mute: "onMuteChange",
  volume: "onVolumeChange",
  playbackRateChange: "onPlaybackRateChange",
  playbackQualityChange: "onPlaybackQualityChange",
  cued: "onCued",
};

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
    "autoplay",
    "controls",
    "enableCaptions",
    "showAnnotations",
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
    console.log("load inner");
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

  attributeChangedCallback(name: string, oldValue: string, newValue: string): void {
    console.log("attributeChangedCallback", name, oldValue, newValue);

    if (name === "src") {
      this.load();
    }

    if (name === "muted") {
      this.muted = newValue === "true";
    }
  }

  protected getAttributes = () =>
    Array.from(this.attributes).reduce<Record<string, string>>((acc, attr) => {
      acc[attr.name] = attr.value;
      return acc;
    }, {});

  /**
   * Emit progress: update state, dispatch "progress" event, and call onProgress with { target, detail }.
   * Use this instead of dispatching CustomEvent("progress") so handlers receive event.target (this element).
   */
  protected emitProgress(currentTime: number): void {
    if (Number.isFinite(currentTime)) this.playerState.currentTime = currentTime;
    this.dispatchEvent(new CustomEvent("progress", { detail: this.playerState.currentTime }));
    const optsRef = (
      this as unknown as {
        optionsRef?: { current: { onProgress?: (e: IEmbedProgressEvent) => void } };
      }
    ).optionsRef;
    optsRef?.current?.onProgress?.({ target: this, detail: this.playerState.currentTime });
  }
}
