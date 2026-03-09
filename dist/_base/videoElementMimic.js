/**
 * Class-based mimic of HTMLVideoElement that delegates to an IEmbedPlayer.
 * Use as the return value of createPlayer so refs typed as HTMLVideoElement
 * (e.g. React Player) work with embed players. Supports addEventListener,
 * dispatchEvent, and the full HTMLMediaElement-like surface (play, pause,
 * currentTime, duration, paused, muted, volume, src, error).
 */
export class EmbedPlayerVideoElement {
    src;
    #player = null;
    #listeners = new Map();
    constructor(url) {
        this.src = url;
    }
    /** Set the underlying player after it is ready. Called by each provider. */
    setPlayer(player) {
        this.#player = player;
    }
    // ——— IEmbedPlayer (delegate to #player) ———
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
    // ——— EventTarget ———
    addEventListener(type, callback) {
        let set = this.#listeners.get(type);
        if (!set) {
            set = new Set();
            this.#listeners.set(type, set);
        }
        set.add(callback);
    }
    removeEventListener(type, callback) {
        this.#listeners.get(type)?.delete(callback);
    }
    dispatchEvent(event) {
        const set = this.#listeners.get(event.type);
        if (set) {
            for (const cb of set) {
                if (typeof cb === "function")
                    cb.call(null, event);
                else
                    cb.handleEvent(event);
            }
        }
        return true;
    }
}
/**
 * Wraps createPlayer options so that when callbacks run, the element also dispatches
 * the corresponding DOM events (play, pause, timeupdate, etc.). Use so ref.addEventListener works.
 */
export function wrapOptionsForEventTarget(element, options) {
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
        onProgress: (t) => {
            element.dispatchEvent(new Event("timeupdate"));
            options.onProgress?.(t);
        },
        onDurationChange: (d) => {
            element.dispatchEvent(new Event("durationchange"));
            options.onDurationChange?.(d);
        },
        onSeeking: () => {
            element.dispatchEvent(new Event("seeking"));
            options.onSeeking?.();
        },
        onSeek: (t) => {
            element.dispatchEvent(new Event("seeked"));
            options.onSeek?.(t);
        },
        onMute: (data) => {
            element.dispatchEvent(new Event("volumechange"));
            options.onMute?.(data);
        },
        onPlaybackRateChange: (rate) => {
            element.dispatchEvent(new Event("ratechange"));
            options.onPlaybackRateChange?.(rate);
        },
        onError: (data) => {
            element.dispatchEvent(new Event("error"));
            options.onError?.(data);
        },
    };
}
//# sourceMappingURL=videoElementMimic.js.map