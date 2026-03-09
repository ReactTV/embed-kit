import type { IEmbedPlayer, IErrorData, TPlayerState } from "./player.js";

/**
 * Default player state. Subclasses mutate this.playerState as the embed updates.
 */
export function createDefaultPlayerState(overrides?: Partial<TPlayerState>): TPlayerState {
  return {
    currentTime: 0,
    duration: 0,
    isPlaying: false,
    isPaused: true,
    muted: false,
    error: null,
    ...overrides,
  };
}

/**
 * Subset of HTMLVideoElement that EmbedPlayerVideoElement implements.
 * Type against this when you only need play, pause, currentTime, duration,
 * paused, muted, volume, src.
 */
export type HTMLVideoElementSubset = Pick<
  HTMLVideoElement,
  "play" | "pause" | "currentTime" | "duration" | "paused" | "muted" | "volume" | "src"
>;

/**
 * Class-based mimic of HTMLVideoElement. Providers can either (1) extend this
 * class and override play(), pause(), seek(), getters, etc., or (2) construct
 * it and call setPlayer(inner) when the inner IEmbedPlayer is ready.
 */
export class EmbedPlayerVideoElement implements IEmbedPlayer, HTMLVideoElementSubset {
  readonly src: string;
  #player: IEmbedPlayer | null = null;
  /** Shared state shape; subclasses read/write this instead of defining their own. */
  protected playerState: TPlayerState;
  #readyPromise: Promise<EmbedPlayerVideoElement>;
  #resolveReady!: (value: EmbedPlayerVideoElement) => void;

  constructor(url: string, stateOverrides?: Partial<TPlayerState>) {
    this.src = url;
    this.playerState = createDefaultPlayerState(stateOverrides);
    this.#readyPromise = new Promise((resolve) => {
      this.#resolveReady = resolve;
    });
  }

  /** Set the underlying player when ready. Omit if the subclass overrides play(), pause(), etc. */
  setPlayer(player: IEmbedPlayer): void {
    this.#player = player;
  }

  /** Resolve when the player is ready. Subclasses should call markReady() when ready. */
  ready(): Promise<EmbedPlayerVideoElement> {
    return this.#readyPromise;
  }

  /** Call when the player is ready (e.g. after first frame or API ready). Used by subclasses. */
  protected markReady(): void {
    this.#resolveReady(this as EmbedPlayerVideoElement);
  }

  // ——— IEmbedPlayer / HTMLVideoElementSubset (override in subclasses or use setPlayer) ———
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
  get error(): IErrorData | null {
    return this.#player?.error ?? null;
  }
  setVolume(volume: number): void | Promise<void> {
    return this.#player?.setVolume?.(volume);
  }
  requestPictureInPicture(): Promise<void> {
    return this.#player?.requestPictureInPicture?.() ?? Promise.resolve();
  }
}

/** Subset of HTMLVideoElement we implement for ref compatibility. */
export interface IVideoElementMimic {
  play(): void | Promise<void>;
  pause(): void | Promise<void>;
  currentTime: number;
  readonly duration: number;
  readonly paused: boolean;
  muted: boolean;
  volume: number;
  readonly src: string;
  readonly error: IErrorData | null;
}
