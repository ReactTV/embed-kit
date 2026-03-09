import type { ICreatePlayerOptions, IEmbedPlayer, IErrorData } from "./player.js";

type EventListener = (ev: Event) => void;
type EventListenerObject = { handleEvent(ev: Event): void };

/**
 * Subset of HTMLVideoElement that EmbedPlayerVideoElement implements.
 * Type against this when you only need play, pause, currentTime, duration,
 * paused, muted, volume, src, and EventTarget. Lets refs be typed so the
 * mimic is assignable: RefObject<HTMLVideoElementSubset | null>.
 */
export type HTMLVideoElementSubset = Pick<
  HTMLVideoElement,
  | "play"
  | "pause"
  | "currentTime"
  | "duration"
  | "paused"
  | "muted"
  | "volume"
  | "src"
  | "addEventListener"
  | "removeEventListener"
  | "dispatchEvent"
>;

/**
 * Class-based mimic of HTMLVideoElement that delegates to an IEmbedPlayer.
 * Use as the return value of createPlayer so refs typed as HTMLVideoElement
 * (e.g. React Player) work with embed players. Supports addEventListener,
 * dispatchEvent, and the full HTMLMediaElement-like surface (play, pause,
 * currentTime, duration, paused, muted, volume, src, error).
 */
export class EmbedPlayerVideoElement implements IEmbedPlayer, HTMLVideoElementSubset {
  readonly src: string;
  #player: IEmbedPlayer | null = null;
  #listeners = new Map<string, Set<EventListener | EventListenerObject>>();

  constructor(url: string) {
    this.src = url;
  }

  /** Set the underlying player after it is ready. Called by each provider. */
  setPlayer(player: IEmbedPlayer): void {
    this.#player = player;
  }

  // ——— IEmbedPlayer (delegate to #player) ———
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

  // ——— EventTarget ———
  addEventListener(type: string, callback: EventListener | EventListenerObject): void {
    let set = this.#listeners.get(type);
    if (!set) {
      set = new Set();
      this.#listeners.set(type, set);
    }
    set.add(callback);
  }

  removeEventListener(type: string, callback: EventListener | EventListenerObject): void {
    this.#listeners.get(type)?.delete(callback);
  }

  dispatchEvent(event: Event): boolean {
    const set = this.#listeners.get(event.type);
    if (set) {
      for (const cb of set) {
        if (typeof cb === "function") cb.call(null, event);
        else (cb as EventListenerObject).handleEvent(event);
      }
    }
    return true;
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
  addEventListener(type: string, callback: EventListener | EventListenerObject): void;
  removeEventListener(type: string, callback: EventListener | EventListenerObject): void;
  dispatchEvent(event: Event): boolean;
}

/**
 * Wraps createPlayer options so that when callbacks run, the element also dispatches
 * the corresponding DOM events (play, pause, timeupdate, etc.). Use so ref.addEventListener works.
 */
export function wrapOptionsForEventTarget(
  element: EmbedPlayerVideoElement,
  options: ICreatePlayerOptions,
): ICreatePlayerOptions {
  return {
    ...options,
    onReady: () => {
      element.dispatchEvent(new Event("loadedmetadata"));
      element.dispatchEvent(new Event("durationchange"));
      element.dispatchEvent(new Event("canplay"));
      options.onReady?.();
    },
    onPlay: () => {
      element.dispatchEvent(new Event("play"));
      options.onPlay?.();
    },
    onPause: () => {
      element.dispatchEvent(new Event("pause"));
      options.onPause?.();
    },
    onEnded: () => {
      element.dispatchEvent(new Event("ended"));
      options.onEnded?.();
    },
    onProgress: (t: number) => {
      element.dispatchEvent(new Event("timeupdate"));
      options.onProgress?.(t);
    },
    onDurationChange: (d: number) => {
      element.dispatchEvent(new Event("durationchange"));
      options.onDurationChange?.(d);
    },
    onSeeking: () => {
      element.dispatchEvent(new Event("seeking"));
      options.onSeeking?.();
    },
    onSeek: (t: number) => {
      element.dispatchEvent(new Event("seeked"));
      options.onSeek?.(t);
    },
    onMute: (data: { muted: boolean }) => {
      element.dispatchEvent(new Event("volumechange"));
      options.onMute?.(data);
    },
    onPlaybackRateChange: (rate: number) => {
      element.dispatchEvent(new Event("ratechange"));
      options.onPlaybackRateChange?.(rate);
    },
    onError: (data: IErrorData) => {
      element.dispatchEvent(new Event("error"));
      options.onError?.(data);
    },
  };
}
