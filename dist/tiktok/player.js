import { createEmbedIframeElement, EmbedPlayerVideoElement, } from "../_base/index.js";
const EMBED_ORIGIN = "https://www.tiktok.com";
const EMBED_BASE = "https://www.tiktok.com/player/v1/";
/** TikTok onStateChange values: -1 init, 0 ended, 1 playing, 2 paused, 3 buffering */
const STATE_ENDED = 0;
const STATE_PAUSED = 2;
function post(iframe, type, value) {
    if (!iframe.contentWindow)
        return;
    const message = {
        "x-tiktok-player": true,
        type,
        ...(value !== undefined ? { value } : {}),
    };
    iframe.contentWindow.postMessage(message, "*");
}
/**
 * TikTok embed player as a subclass of EmbedPlayerVideoElement.
 * Implements the subset directly via postMessage to the TikTok iframe.
 */
class TikTokEmbedPlayer extends EmbedPlayerVideoElement {
    #iframe;
    #handleMessage;
    #options;
    constructor(container, id, options = {}) {
        super(options.url ?? `https://www.tiktok.com/@/video/${id}`);
        this.#options = options;
        const { width = 325, height = 575, autoplay = false, controls = true, onReady = () => { }, onPlay = () => { }, onPause = () => { }, onBuffering = () => { }, onEnded = () => { }, onProgress = () => { }, onDurationChange = () => { }, onError = () => { }, } = this.#options;
        const params = new URLSearchParams({ controls: controls ? "1" : "0" });
        if (autoplay)
            params.set("autoplay", "1");
        const iframe = createEmbedIframeElement({
            src: `${EMBED_BASE}${id}?${params.toString()}`,
            width,
            height,
            allow: "autoplay; fullscreen",
            allowFullScreen: true,
        });
        iframe.style.display = "block";
        iframe.style.maxWidth = "100%";
        iframe.style.maxHeight = "100%";
        container.appendChild(iframe);
        this.#iframe = iframe;
        const handleMessage = (event) => {
            if (event.origin !== EMBED_ORIGIN || event.source !== iframe.contentWindow)
                return;
            const data = event.data;
            if (!data || typeof data !== "object" || !("type" in data))
                return;
            switch (data.type) {
                case "onPlayerReady":
                    onReady();
                    this.markReady();
                    break;
                case "onStateChange":
                    if (typeof data.value === "number") {
                        this.playerState.isPaused = data.value === STATE_PAUSED;
                        if (data.value === 1)
                            onPlay();
                        if (data.value === STATE_PAUSED)
                            onPause();
                        if (data.value === 3)
                            onBuffering();
                        if (data.value === STATE_ENDED)
                            onEnded();
                    }
                    break;
                case "onCurrentTime": {
                    const t = data.value;
                    if (t) {
                        if (typeof t.currentTime === "number")
                            this.playerState.currentTime = t.currentTime;
                        if (typeof t.duration === "number") {
                            if (t.duration !== this.playerState.duration) {
                                this.playerState.duration = t.duration;
                                onDurationChange(t.duration);
                            }
                        }
                        onProgress(this.playerState.currentTime);
                    }
                    break;
                }
                case "onError":
                case "error": {
                    const err = data.value;
                    const errorData = {
                        ...(err?.message != null ? { message: err.message } : {}),
                        ...(err?.code != null ? { code: err.code } : {}),
                    };
                    this.playerState.error =
                        Object.keys(errorData).length > 0
                            ? errorData
                            : { message: "TikTok embed error" };
                    onError(this.playerState.error);
                    break;
                }
            }
        };
        this.#handleMessage = handleMessage;
        window.addEventListener("message", handleMessage);
    }
    play() {
        post(this.#iframe, "play");
        return Promise.resolve();
    }
    pause() {
        post(this.#iframe, "pause");
        return Promise.resolve();
    }
    seek(seconds) {
        post(this.#iframe, "seekTo", seconds);
        this.playerState.currentTime = seconds;
        this.#options.onSeek?.(seconds);
    }
    mute() {
        this.playerState.muted = true;
        post(this.#iframe, "mute", true);
        this.#options.onMute?.({ muted: true });
    }
    unmute() {
        this.playerState.muted = false;
        post(this.#iframe, "mute", false);
        this.#options.onMute?.({ muted: false });
    }
    destroy() {
        window.removeEventListener("message", this.#handleMessage);
        if (this.#iframe.parentNode)
            this.#iframe.remove();
    }
    get currentTime() {
        return this.playerState.currentTime;
    }
    set currentTime(seconds) {
        this.seek(seconds);
    }
    get duration() {
        return this.playerState.duration;
    }
    get paused() {
        return this.playerState.isPaused;
    }
    get muted() {
        return this.playerState.muted;
    }
    get volume() {
        return this.playerState.volume ?? 1;
    }
    set volume(vol) {
        this.playerState.volume = vol;
    }
    get error() {
        return this.playerState.error;
    }
}
/**
 * Create a controllable TikTok player in the given container.
 * Returns an EmbedPlayerVideoElement that mimics HTMLVideoElement.
 */
export const createPlayer = (container, id, options = {}) => {
    const element = new TikTokEmbedPlayer(container, id, options);
    return element.ready();
};
//# sourceMappingURL=player.js.map