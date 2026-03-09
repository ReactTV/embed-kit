/**
 * Default player state. Subclasses mutate this.playerState as the embed updates.
 */
export function createDefaultPlayerState(overrides) {
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
 * Class-based mimic of HTMLVideoElement. Providers can either (1) extend this
 * class and override play(), pause(), seek(), getters, etc., or (2) construct
 * it and call setPlayer(inner) when the inner IEmbedPlayer is ready.
 */
export class EmbedPlayerVideoElement {
    src;
    #player = null;
    /** Shared state shape; subclasses read/write this instead of defining their own. */
    playerState;
    #readyPromise;
    #resolveReady;
    constructor(url, stateOverrides) {
        this.src = url;
        this.playerState = createDefaultPlayerState(stateOverrides);
        this.#readyPromise = new Promise((resolve) => {
            this.#resolveReady = resolve;
        });
    }
    /** Set the underlying player when ready. Omit if the subclass overrides play(), pause(), etc. */
    setPlayer(player) {
        this.#player = player;
    }
    /** Resolve when the player is ready. Subclasses should call markReady() when ready. */
    ready() {
        return this.#readyPromise;
    }
    /** Call when the player is ready (e.g. after first frame or API ready). Used by subclasses. */
    markReady() {
        this.#resolveReady(this);
    }
    // ——— IEmbedPlayer / HTMLVideoElementSubset (override in subclasses or use setPlayer) ———
    play() {
        return Promise.resolve(this.#player?.play()).then(() => undefined);
    }
    pause() {
        return Promise.resolve(this.#player?.pause()).then(() => undefined);
    }
    seek(seconds) {
        return this.#player?.seek(seconds);
    }
    mute() {
        return this.#player?.mute();
    }
    unmute() {
        return this.#player?.unmute();
    }
    destroy() {
        return this.#player?.destroy?.();
    }
    get paused() {
        return this.#player?.paused ?? true;
    }
    get currentTime() {
        return this.#player?.currentTime ?? 0;
    }
    set currentTime(seconds) {
        this.#player?.seek(seconds);
    }
    get duration() {
        return this.#player?.duration ?? 0;
    }
    get muted() {
        return this.#player?.muted ?? false;
    }
    set muted(value) {
        if (value)
            this.#player?.mute();
        else
            this.#player?.unmute();
    }
    get volume() {
        return this.#player?.volume ?? 1;
    }
    set volume(value) {
        this.#player?.setVolume?.(value);
    }
    get error() {
        return this.#player?.error ?? null;
    }
    setVolume(volume) {
        return this.#player?.setVolume?.(volume);
    }
    requestPictureInPicture() {
        return this.#player?.requestPictureInPicture?.() ?? Promise.resolve();
    }
}
//# sourceMappingURL=videoElementMimic.js.map