import type { ICreatePlayerOptions, IEmbedPlayer, IErrorData } from "./player.js";
type EventListener = (ev: Event) => void;
type EventListenerObject = {
    handleEvent(ev: Event): void;
};
/**
 * Subset of HTMLVideoElement that EmbedPlayerVideoElement implements.
 * Type against this when you only need play, pause, currentTime, duration,
 * paused, muted, volume, src, and EventTarget. Lets refs be typed so the
 * mimic is assignable: RefObject<HTMLVideoElementSubset | null>.
 */
export type HTMLVideoElementSubset = Pick<HTMLVideoElement, "play" | "pause" | "currentTime" | "duration" | "paused" | "muted" | "volume" | "src" | "addEventListener" | "removeEventListener" | "dispatchEvent">;
/**
 * Class-based mimic of HTMLVideoElement that delegates to an IEmbedPlayer.
 * Use as the return value of createPlayer so refs typed as HTMLVideoElement
 * (e.g. React Player) work with embed players. Supports addEventListener,
 * dispatchEvent, and the full HTMLMediaElement-like surface (play, pause,
 * currentTime, duration, paused, muted, volume, src, error).
 */
export declare class EmbedPlayerVideoElement implements IEmbedPlayer, HTMLVideoElementSubset {
    #private;
    readonly src: string;
    constructor(url: string);
    /** Set the underlying player after it is ready. Called by each provider. */
    setPlayer(player: IEmbedPlayer): void;
    play(): Promise<void>;
    pause(): Promise<void>;
    seek(seconds: number): void | Promise<void>;
    mute(): void | Promise<void>;
    unmute(): void | Promise<void>;
    destroy(): void | Promise<void>;
    get paused(): boolean;
    get currentTime(): number;
    set currentTime(seconds: number);
    get duration(): number;
    get muted(): boolean;
    set muted(value: boolean);
    get volume(): number;
    set volume(value: number);
    get error(): IErrorData | null;
    setVolume(volume: number): void | Promise<void>;
    requestPictureInPicture(): Promise<void>;
    addEventListener(type: string, callback: EventListener | EventListenerObject): void;
    removeEventListener(type: string, callback: EventListener | EventListenerObject): void;
    dispatchEvent(event: Event): boolean;
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
export declare function wrapOptionsForEventTarget(element: EmbedPlayerVideoElement, options: ICreatePlayerOptions): ICreatePlayerOptions;
export {};
//# sourceMappingURL=videoElementMimic.d.ts.map