import type { IEmbedPlayer, IErrorData, TPlayerState } from "./player.js";
/**
 * Default player state. Subclasses mutate this.playerState as the embed updates.
 */
export declare function createDefaultPlayerState(overrides?: Partial<TPlayerState>): TPlayerState;
/**
 * Subset of HTMLVideoElement that EmbedPlayerVideoElement implements.
 * Type against this when you only need play, pause, currentTime, duration,
 * paused, muted, volume, src.
 */
export type HTMLVideoElementSubset = Pick<HTMLVideoElement, "play" | "pause" | "currentTime" | "duration" | "paused" | "muted" | "volume" | "src">;
/**
 * Class-based mimic of HTMLVideoElement. Providers can either (1) extend this
 * class and override play(), pause(), seek(), getters, etc., or (2) construct
 * it and call setPlayer(inner) when the inner IEmbedPlayer is ready.
 */
export declare class EmbedPlayerVideoElement implements IEmbedPlayer, HTMLVideoElementSubset {
    #private;
    readonly src: string;
    /** Shared state shape; subclasses read/write this instead of defining their own. */
    protected playerState: TPlayerState;
    constructor(url: string, stateOverrides?: Partial<TPlayerState>);
    /** Set the underlying player when ready. Omit if the subclass overrides play(), pause(), etc. */
    setPlayer(player: IEmbedPlayer): void;
    /** Resolve when the player is ready. Subclasses should call markReady() when ready. */
    ready(): Promise<EmbedPlayerVideoElement>;
    /** Call when the player is ready (e.g. after first frame or API ready). Used by subclasses. */
    protected markReady(): void;
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
//# sourceMappingURL=videoElementMimic.d.ts.map