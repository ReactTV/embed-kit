import { createPlayerContainer, loadScript, EmbedPlayerVideoElement } from "../_base/index.js";
const YT_SCRIPT = "https://www.youtube.com/iframe_api";
function loadYTScript() {
    return loadScript(YT_SCRIPT, {
        isLoaded: () => !!window.YT?.Player,
        ready: () => new Promise((resolve) => {
            const prev = window.onYouTubeIframeAPIReady;
            window.onYouTubeIframeAPIReady = () => {
                prev?.();
                resolve();
            };
        }),
        errorMessage: "Failed to load YouTube iframe API",
    });
}
/**
 * YouTube embed player as a subclass of EmbedPlayerVideoElement.
 */
class YouTubeEmbedPlayer extends EmbedPlayerVideoElement {
    #player = null;
    #div = null;
    #readyState;
    #options;
    #initialVolume;
    #progressInterval;
    constructor(container, id, options = {}) {
        const initialVolume = options.volume;
        const stateOverrides = typeof initialVolume === "number" &&
            initialVolume >= 0 &&
            initialVolume <= 1
            ? { volume: initialVolume }
            : undefined;
        super(options.url ?? `https://www.youtube.com/watch?v=${id}`, stateOverrides);
        this.#options = options;
        const { width = 560, height = 315, autoplay = false, volume: vol, controls = true, enableCaptions, showAnnotations, config, progressInterval = 50, } = this.#options;
        this.#initialVolume = vol;
        this.#progressInterval = progressInterval;
        const youtubeConfig = config?.youtube ?? {};
        const playerVars = {
            autoplay: autoplay ? 1 : 0,
            ...youtubeConfig,
        };
        if (controls !== undefined)
            playerVars.controls = controls ? 1 : 0;
        if (enableCaptions !== undefined)
            playerVars.cc_load_policy = enableCaptions ? 1 : 0;
        if (showAnnotations !== undefined)
            playerVars.iv_load_policy = showAnnotations ? 1 : 3;
        this.#readyState = { progressIntervalId: undefined, destroyed: false };
        const { onReady = () => { }, onPlay = () => { }, onPause = () => { }, onBuffering = () => { }, onEnded = () => { }, onProgress = () => { }, onDurationChange = () => { }, onMute = () => { }, onError = () => { }, onPlaybackQualityChange = () => { }, onPlaybackRateChange = () => { }, onAutoplayBlocked = () => { }, onApiChange = () => { } } = this.#options;
        void loadYTScript().then(() => {
            if (this.#readyState.destroyed)
                return;
            const YT = window.YT;
            const { PlayerState } = YT;
            const { element: div } = createPlayerContainer(container, "yt-player");
            this.#div = div;
            new YT.Player(div, {
                videoId: id,
                width,
                height,
                playerVars,
                events: {
                    onError: (ev) => {
                        this.playerState.error = { code: ev.data };
                        onError(this.playerState.error);
                    },
                    onReady: (ev) => {
                        if (this.#readyState.destroyed)
                            return;
                        this.#player = ev.target;
                        const player = this.#player;
                        if (typeof this.#initialVolume === "number" &&
                            this.#initialVolume >= 0 &&
                            this.#initialVolume <= 1) {
                            player.setVolume(Math.round(this.#initialVolume * 100));
                            this.playerState.volume = this.#initialVolume;
                        }
                        else {
                            this.playerState.volume = player.getVolume() / 100;
                        }
                        onReady();
                        if (this.#readyState.destroyed)
                            return;
                        this.#readyState.progressIntervalId = setInterval(() => {
                            if (this.#readyState.destroyed || !this.#player)
                                return;
                            this.playerState.currentTime = this.#player.getCurrentTime();
                            onProgress(this.playerState.currentTime);
                            const isMuted = this.#player.isMuted();
                            if (this.playerState.muted !== isMuted) {
                                this.playerState.muted = isMuted;
                                onMute({ muted: isMuted });
                            }
                            this.playerState.volume = this.#player.getVolume() / 100;
                            this.playerState.isPlaying = this.#player.getPlayerState() === PlayerState.PLAYING;
                            this.playerState.isPaused = this.#player.getPlayerState() === PlayerState.PAUSED;
                            const newDuration = this.#player.getDuration();
                            if (newDuration !== this.playerState.duration) {
                                this.playerState.duration = newDuration;
                                onDurationChange(this.playerState.duration);
                            }
                            this.playerState.currentTime = this.#player.getCurrentTime();
                            this.playerState.error = null;
                        }, this.#progressInterval);
                        this.markReady();
                    },
                    onStateChange: (ev) => {
                        if (ev.data === PlayerState.PLAYING)
                            onPlay();
                        if (ev.data === PlayerState.PAUSED)
                            onPause();
                        if (ev.data === PlayerState.BUFFERING)
                            onBuffering();
                        if (ev.data === PlayerState.ENDED)
                            onEnded();
                    },
                    onPlaybackQualityChange: (ev) => onPlaybackQualityChange(ev.data),
                    onPlaybackRateChange: (ev) => onPlaybackRateChange(ev.data),
                    onAutoplayBlocked: () => onAutoplayBlocked(),
                    onApiChange: () => onApiChange(),
                },
            });
        });
    }
    play() {
        this.#player?.playVideo();
        return Promise.resolve();
    }
    pause() {
        this.#player?.pauseVideo();
        return Promise.resolve();
    }
    seek(seconds) {
        this.#player?.seekTo(seconds, true);
        this.#options.onSeek?.(seconds);
    }
    mute() {
        this.#player?.mute();
        this.playerState.muted = true;
        this.#options.onMute?.({ muted: true });
    }
    unmute() {
        this.#player?.unMute();
        this.playerState.muted = false;
        this.#options.onMute?.({ muted: false });
    }
    destroy() {
        this.#readyState.destroyed = true;
        if (this.#readyState.progressIntervalId)
            clearInterval(this.#readyState.progressIntervalId);
        if (this.#div?.parentNode)
            this.#div.remove();
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
        this.#player?.setVolume(Math.round(v * 100));
        this.playerState.volume = v;
    }
    get error() {
        return this.playerState.error;
    }
}
/**
 * Create a controllable YouTube player in the given container.
 * Returns an EmbedPlayerVideoElement that mimics HTMLVideoElement.
 */
export const createPlayer = (container, id, options = {}) => {
    const element = new YouTubeEmbedPlayer(container, id, options);
    return element.ready();
};
//# sourceMappingURL=player.js.map