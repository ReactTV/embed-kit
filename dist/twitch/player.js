import { createEmbedIframeElement, EmbedPlayerVideoElement, } from "../_base/index.js";
import { EMBED_ORIGIN, NS_EMBED, NS_PLAYER_PROXY, PlaybackState, PlayerCommands, } from "./constants.js";
/**
 * Twitch embed player as a subclass of EmbedPlayerVideoElement.
 */
class TwitchEmbedPlayer extends EmbedPlayerVideoElement {
    #iframe;
    #handleMessage;
    #options;
    constructor(container, id, options = {}) {
        const { twitchType } = options;
        const embedUrl = twitchType === "clip"
            ? `https://clips.twitch.tv/embed?clip=${encodeURIComponent(id)}`
            : `https://player.twitch.tv/?video=${encodeURIComponent(id)}`;
        super(options.url ?? embedUrl);
        this.#options = options;
        const { width = 560, height = 315, autoplay = false, controls = true, enableCaptions, onReady = () => { }, onPlay = () => { }, onPause = () => { }, onBuffering = () => { }, onEnded = () => { }, onProgress = () => { }, onDurationChange = () => { }, onSeek = () => { }, onError = () => { }, } = this.#options;
        const isChannel = twitchType === "channel";
        const mediaParam = isChannel ? "channel" : "video";
        const iframeSrc = twitchType === "clip"
            ? `https://clips.twitch.tv/embed?clip=${encodeURIComponent(id)}&parent=${encodeURIComponent(window.location.hostname)}`
            : `${EMBED_ORIGIN}/?${mediaParam}=${encodeURIComponent(id)}&parent=${encodeURIComponent(window.location.hostname)}&controls=${controls}${autoplay ? "&autoplay=true" : ""}`;
        const iframe = createEmbedIframeElement({
            src: iframeSrc,
            width,
            height,
            allow: "accelerometer; fullscreen; autoplay; encrypted-media; picture-in-picture",
            allowFullScreen: true,
        });
        container.appendChild(iframe);
        this.#iframe = iframe;
        const send = (command, params) => {
            if (!iframe.contentWindow)
                return;
            iframe.contentWindow.postMessage({ eventName: command, params, namespace: NS_PLAYER_PROXY }, EMBED_ORIGIN);
        };
        const handleMessage = (event) => {
            if (event.source !== iframe.contentWindow || event.origin !== EMBED_ORIGIN)
                return;
            const message = event.data;
            if (message.namespace === NS_EMBED) {
                if (message.eventName === "ready") {
                    if (enableCaptions !== undefined) {
                        send(enableCaptions ? PlayerCommands.ENABLE_CAPTIONS : PlayerCommands.DISABLE_CAPTIONS);
                    }
                    onReady();
                    this.markReady();
                }
                if (message.eventName === "error") {
                    const msg = message.params?.message ?? "Twitch embed error";
                    this.playerState.error = { message: msg };
                    onError(this.playerState.error);
                }
                if (message.eventName === "seek") {
                    this.playerState.currentTime = message.params.position;
                    onSeek(message.params.position);
                }
                if (message.eventName === "play" ||
                    message.eventName === "playing" ||
                    message.eventName === "video.play") {
                    onPlay();
                }
            }
            if (message.namespace === NS_PLAYER_PROXY && message.eventName === "UPDATE_STATE") {
                const p = message.params;
                const isPlaying = p.playback === PlaybackState.PLAYING;
                if (isPlaying && !this.playerState.isPlaying)
                    onPlay();
                if (!isPlaying && this.playerState.isPlaying)
                    onPause();
                if (p.playback === PlaybackState.BUFFERING)
                    onBuffering();
                if (p.playback === PlaybackState.ENDED)
                    onEnded();
                this.playerState.isPlaying = isPlaying;
                this.playerState.isPaused = !isPlaying;
                this.playerState.currentTime = p.currentTime;
                if (p.duration !== this.playerState.duration) {
                    this.playerState.duration = p.duration;
                    onDurationChange(p.duration);
                }
                if (typeof p.muted === "boolean")
                    this.playerState.muted = p.muted;
                if (typeof p.volume === "number" && !Number.isNaN(p.volume))
                    this.playerState.volume = p.volume;
                onProgress(p.currentTime);
            }
        };
        this.#handleMessage = handleMessage;
        window.addEventListener("message", handleMessage);
    }
    play() {
        this.playerState.isPaused = false;
        if (this.#iframe.contentWindow) {
            this.#iframe.contentWindow.postMessage({ eventName: PlayerCommands.PLAY, params: undefined, namespace: NS_PLAYER_PROXY }, EMBED_ORIGIN);
        }
        this.#options.onPlay?.();
        return Promise.resolve();
    }
    pause() {
        this.playerState.isPaused = true;
        if (this.#iframe.contentWindow) {
            this.#iframe.contentWindow.postMessage({ eventName: PlayerCommands.PAUSE, params: undefined, namespace: NS_PLAYER_PROXY }, EMBED_ORIGIN);
        }
        this.#options.onPause?.();
        return Promise.resolve();
    }
    seek(seconds) {
        if (this.#iframe.contentWindow) {
            this.#iframe.contentWindow.postMessage({ eventName: PlayerCommands.SEEK, params: seconds, namespace: NS_PLAYER_PROXY }, EMBED_ORIGIN);
        }
        this.playerState.currentTime = seconds;
        this.#options.onSeek?.(seconds);
    }
    mute() {
        this.playerState.muted = true;
        if (this.#iframe.contentWindow) {
            this.#iframe.contentWindow.postMessage({ eventName: PlayerCommands.SET_MUTED, params: true, namespace: NS_PLAYER_PROXY }, EMBED_ORIGIN);
        }
        this.#options.onMute?.({ muted: true });
    }
    unmute() {
        this.playerState.muted = false;
        if (this.#iframe.contentWindow) {
            this.#iframe.contentWindow.postMessage({ eventName: PlayerCommands.SET_MUTED, params: false, namespace: NS_PLAYER_PROXY }, EMBED_ORIGIN);
        }
        this.#options.onMute?.({ muted: false });
    }
    destroy() {
        window.removeEventListener("message", this.#handleMessage);
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
        this.seek(seconds);
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
        this.playerState.volume = v;
        if (this.#iframe.contentWindow) {
            this.#iframe.contentWindow.postMessage({ eventName: PlayerCommands.SET_VOLUME, params: v, namespace: NS_PLAYER_PROXY }, EMBED_ORIGIN);
        }
    }
    get error() {
        return this.playerState.error;
    }
}
/**
 * Create a Twitch player in the given container (video by id, channel by name, or clip by slug).
 * Returns an EmbedPlayerVideoElement that mimics HTMLVideoElement.
 */
export const createPlayer = (container, id, options = {}) => {
    const element = new TwitchEmbedPlayer(container, id, options);
    return element.ready();
};
//# sourceMappingURL=player.js.map