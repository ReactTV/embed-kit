import type { ICreatePlayerOptions, IEmbedProgressEvent, TPlayerState } from "./player.js";

/**
 * Class-based mimic of HTMLVideoElement. Providers can either (1) extend this
 * class and override play(), pause(), seek(), getters, etc., or (2) construct
 * it and call setPlayer(inner) when the inner player is ready.
 */
export class EmbedPlayerVideoElement extends HTMLElement {
  readonly src: string = "";
  iframe: HTMLIFrameElement | null = null;
  handleMessage: (event: MessageEvent) => void = () => {};
  /** Shared state shape; subclasses read/write this instead of defining their own. */
  protected options: ICreatePlayerOptions = {};

  protected playerState: TPlayerState = {
    currentTime: 0,
    duration: 0,
    isPlaying: false,
    isPaused: true,
    muted: false,
    error: null,
  };

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
    return false;
  }
  get currentTime(): number {
    return 0;
  }
  set currentTime(_seconds: number) {
    //
  }
  get duration(): number {
    return 0;
  }
  get muted(): boolean {
    return false;
  }
  set muted(_value: boolean) {
    //
  }

  get volume(): number {
    return 1;
  }
  set volume(_value: number) {
    //
  }
  get error() {
    return this.playerState.error;
  }

  /**
   * Emit progress: update state, dispatch "progress" event, and call onProgress with { target, detail }.
   * Use this instead of dispatching CustomEvent("progress") so handlers receive event.target (this element).
   */
  protected emitProgress(currentTime: number): void {
    if (Number.isFinite(currentTime)) this.playerState.currentTime = currentTime;
    this.dispatchEvent(
      new CustomEvent("progress", { detail: this.playerState.currentTime })
    );
    const optsRef = (this as unknown as { optionsRef?: { current: { onProgress?: (e: IEmbedProgressEvent) => void } } })
      .optionsRef;
    optsRef?.current?.onProgress?.({ target: this, detail: this.playerState.currentTime });
  }
}
