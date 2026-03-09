import { createEmbedIframeElement, loadScript, EmbedPlayerVideoElement, } from "../_base/index.js";
const VIMEO_SCRIPT = "https://player.vimeo.com/api/player.js";
const EMBED_BASE = "https://player.vimeo.com/video/";
/**
 * Vimeo embed player as a subclass of EmbedPlayerVideoElement.
 */
class VimeoEmbedPlayer extends EmbedPlayerVideoElement {
    #iframe;
    #vimeoPlayer = null;
    #options;
    constructor(container, id, options = {}) {
        const opts = options;
        const initialVolume = options.volume;
        const stateOverrides = typeof initialVolume === "number" &&
            initialVolume >= 0 &&
            initialVolume <= 1
            ? { volume: initialVolume }
            : undefined;
        super(opts.url ?? `https://player.vimeo.com/video/${id}`, stateOverrides);
        this.#options = options;
        const { width = 560, height = 315, autoplay = false, controls = true, config, onError = () => { }, } = { ...opts, ...this.#options };
        const { vimeoHash } = opts;
        const query = new URLSearchParams({ api: "1" });
        if (vimeoHash)
            query.set("h", vimeoHash);
        if (autoplay)
            query.set("autoplay", "1");
        if (!controls)
            query.set("controls", "0");
        const vimeoConfig = config?.vimeo ?? {};
        for (const [key, value] of Object.entries(vimeoConfig)) {
            if (value !== undefined && value !== "")
                query.set(key, String(value));
        }
        const iframe = createEmbedIframeElement({
            src: `${EMBED_BASE}${id}?${query.toString()}`,
            width,
            height,
            allow: "autoplay; fullscreen; picture-in-picture",
            allowFullScreen: true,
        });
        container.appendChild(iframe);
        this.#iframe = iframe;
        void loadScript(VIMEO_SCRIPT, {
            isLoaded: () => !!window.Vimeo?.Player,
            errorMessage: "Failed to load Vimeo player script",
        }).then(() => {
            const vimeoPlayer = new window.Vimeo.Player(iframe);
            this.#vimeoPlayer = vimeoPlayer;
            const { onReady = () => { }, onPlay = () => { }, onPause = () => { }, onBuffering = () => { }, onEnded = () => { }, onProgress = () => { }, onDurationChange = () => { }, onMute = () => { }, } = this.#options;
            vimeoPlayer.on("error", (data) => {
                const err = data;
                this.playerState.error = {
                    ...(err.message != null ? { message: err.message } : {}),
                    ...(err.name != null ? { code: err.name } : {}),
                };
                if (!this.playerState.error.message)
                    this.playerState.error.message = "Vimeo playback error";
                onError(this.playerState.error);
            });
            vimeoPlayer.on("play", () => {
                this.playerState.isPlaying = true;
                this.playerState.isPaused = false;
                onPlay();
            });
            vimeoPlayer.on("pause", () => {
                this.playerState.isPlaying = false;
                this.playerState.isPaused = true;
                onPause();
            });
            vimeoPlayer.on("bufferstart", onBuffering);
            vimeoPlayer.on("finish", onEnded);
            vimeoPlayer.on("ended", onEnded);
            vimeoPlayer.on("timeupdate", (data) => {
                const { seconds, duration } = data;
                this.playerState.currentTime = seconds;
                if (typeof duration === "number" && duration !== this.playerState.duration) {
                    this.playerState.duration = duration;
                    onDurationChange(duration);
                }
                onProgress(this.playerState.currentTime);
            });
            vimeoPlayer.on("volumechange", (data) => {
                const { volume, muted } = data;
                this.playerState.volume = volume;
                this.playerState.muted = muted;
                onMute({ muted });
            });
            if (typeof initialVolume === "number" && initialVolume >= 0 && initialVolume <= 1) {
                vimeoPlayer.setVolume(initialVolume).then(() => {
                    this.playerState.volume = initialVolume;
                });
            }
            else {
                vimeoPlayer.getVolume().then((v) => {
                    this.playerState.volume = v;
                });
            }
            onReady();
            this.markReady();
        });
    }
    play() {
        return this.#vimeoPlayer?.play() ?? Promise.resolve();
    }
    pause() {
        return this.#vimeoPlayer?.pause() ?? Promise.resolve();
    }
    seek(seconds) {
        return this.#vimeoPlayer?.setCurrentTime(seconds).then(() => {
            this.#options.onSeek?.(seconds);
        });
    }
    mute() {
        return this.#vimeoPlayer?.setMuted(true).then(() => {
            this.#options.onMute?.({ muted: true });
        });
    }
    unmute() {
        return this.#vimeoPlayer?.setMuted(false).then(() => {
            this.#options.onMute?.({ muted: false });
        });
    }
    destroy() {
        this.#vimeoPlayer?.destroy();
        if (this.#iframe.parentNode)
            this.#iframe.remove();
    }
    get paused() {
        return this.playerState.isPaused;
    }
    get currentTime() {
        return this.playerState.currentTime;
    }
    set currentTime(seconds) {
        void this.seek(seconds);
    }
    get duration() {
        return this.playerState.duration;
    }
    get muted() {
        return this.playerState.muted;
    }
    get volume() {
        return this.playerState.volume ?? 1;
    }
    set volume(vol) {
        const v = Math.max(0, Math.min(1, vol));
        void this.#vimeoPlayer?.setVolume(v).then(() => {
            this.playerState.volume = v;
        });
    }
    get error() {
        return this.playerState.error;
    }
}
/**
 * Create a controllable Vimeo player in the given container.
 * Returns an EmbedPlayerVideoElement that mimics HTMLVideoElement.
 */
export const createPlayer = (container, id, options = {}) => {
    const element = new VimeoEmbedPlayer(container, id, options);
    return element.ready();
};
//# sourceMappingURL=player.js.map