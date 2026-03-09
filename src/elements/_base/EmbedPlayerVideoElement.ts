import type { IEmbedPlayer, TPlayerState } from "./player.js";

/**
 * Class-based mimic of HTMLVideoElement. Providers can either (1) extend this
 * class and override play(), pause(), seek(), getters, etc., or (2) construct
 * it and call setPlayer(inner) when the inner IEmbedPlayer is ready.
 */
export class EmbedPlayerVideoElement extends HTMLVideoElement {
  readonly src: string;
  #player: IEmbedPlayer | null = null;
  /** Shared state shape; subclasses read/write this instead of defining their own. */
  protected playerState: TPlayerState;
  #readyPromise: Promise<EmbedPlayerVideoElement>;
  #resolveReady!: (value: EmbedPlayerVideoElement) => void;

  constructor(url: string) {
    super();
    this.src = url;

    this.playerState = {
      currentTime: 0,
      duration: 0,
      isPlaying: false,
      isPaused: true,
      muted: false,
      error: null,
    };

    this.#readyPromise = new Promise((resolve) => {
      this.#resolveReady = resolve;
    });
  }

  setPlayer(player: IEmbedPlayer): void {
    this.#player = player;
  }

  ready(): Promise<EmbedPlayerVideoElement> {
    return this.#readyPromise;
  }

  protected markReady(): void {
    this.#resolveReady(this as EmbedPlayerVideoElement);
  }

  play(): Promise<void> {
    return Promise.resolve(this.#player?.play()).then(() => undefined);
  }
  pause(): Promise<void> {
    return Promise.resolve(this.#player?.pause()).then(() => undefined);
  }
  seek(seconds: number): void | Promise<void> {
    return this.#player?.seek(seconds);
  }
  mute(): void | Promise<void> {
    return this.#player?.mute();
  }
  unmute(): void | Promise<void> {
    return this.#player?.unmute();
  }
  destroy(): void | Promise<void> {
    return this.#player?.destroy?.();
  }
  get paused(): boolean {
    return this.#player?.paused ?? true;
  }
  get currentTime(): number {
    return this.#player?.currentTime ?? 0;
  }
  set currentTime(seconds: number) {
    this.#player?.seek(seconds);
  }
  get duration(): number {
    return this.#player?.duration ?? 0;
  }
  get muted(): boolean {
    return this.#player?.muted ?? false;
  }
  set muted(value: boolean) {
    if (value) this.#player?.mute();
    else this.#player?.unmute();
  }
  get volume(): number {
    return this.#player?.volume ?? 1;
  }
  set volume(value: number) {
    this.#player?.setVolume?.(value);
  }
  get error() {
    return this.playerState.error;
  }
  setVolume(volume: number): void | Promise<void> {
    return this.#player?.setVolume?.(volume);
  }
}
