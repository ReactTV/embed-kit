import { createEmbedIframeElement, loadScript, } from "../_base/index.js";
const VIMEO_SCRIPT = "https://player.vimeo.com/api/player.js";
const EMBED_BASE = "https://player.vimeo.com/video/";
/**
 * Create a controllable Vimeo player in the given container.
 * Returns a normalized IEmbedPlayer (play, pause, paused, currentTime).
 */
export const createPlayer = (container, id, options = {}) => {
    const { width = 560, height = 315, autoplay = false, volume: initialVolume, controls = true, config, onReady = () => { }, onPlay = () => { }, onPause = () => { }, onBuffering = () => { }, onEnded = () => { }, onProgress = () => { }, onDurationChange = () => { }, onSeek = () => { }, onMute = () => { }, onError = () => { }, vimeoHash, } = options;
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
    const playerState = {
        currentTime: 0,
        duration: 0,
        isPlaying: false,
        isPaused: true,
        muted: false,
        ...(typeof initialVolume === "number" && initialVolume >= 0 && initialVolume <= 1 && { volume: initialVolume }),
        error: null,
    };
    return loadScript(VIMEO_SCRIPT, {
        isLoaded: () => !!window.Vimeo?.Player,
        errorMessage: "Failed to load Vimeo player script",
    }).then(() => {
        const vimeoPlayer = new window.Vimeo.Player(iframe);
        vimeoPlayer.on("error", (data) => {
            const err = data;
            playerState.error = {
                ...(err.message != null ? { message: err.message } : {}),
                ...(err.name != null ? { code: err.name } : {}),
            };
            if (!playerState.error.message)
                playerState.error.message = "Vimeo playback error";
            onError(playerState.error);
        });
        vimeoPlayer.on("play", () => {
            playerState.isPlaying = true;
            playerState.isPaused = false;
            onPlay();
        });
        vimeoPlayer.on("pause", () => {
            playerState.isPlaying = false;
            playerState.isPaused = true;
            onPause();
        });
        vimeoPlayer.on("bufferstart", onBuffering);
        vimeoPlayer.on("finish", onEnded);
        vimeoPlayer.on("ended", onEnded);
        vimeoPlayer.on("timeupdate", (data) => {
            const { seconds, duration } = data;
            playerState.currentTime = seconds;
            if (typeof duration === "number" && duration !== playerState.duration) {
                playerState.duration = duration;
                onDurationChange(duration);
            }
            onProgress(playerState.currentTime);
        });
        vimeoPlayer.on("volumechange", (data) => {
            const { volume, muted } = data;
            playerState.volume = volume;
            playerState.muted = muted;
            onMute({ muted });
        });
        const applyInitialVolume = () => {
            if (typeof initialVolume === "number" && initialVolume >= 0 && initialVolume <= 1) {
                vimeoPlayer.setVolume(initialVolume).then(() => {
                    playerState.volume = initialVolume;
                });
            }
            else {
                vimeoPlayer.getVolume().then((v) => {
                    playerState.volume = v;
                });
            }
        };
        onReady();
        applyInitialVolume();
        return {
            play: () => vimeoPlayer.play(),
            pause: () => vimeoPlayer.pause(),
            get paused() {
                return playerState.isPaused;
            },
            get currentTime() {
                return playerState.currentTime;
            },
            get duration() {
                return playerState.duration;
            },
            seek(seconds) {
                return vimeoPlayer.setCurrentTime(seconds).then(() => {
                    onSeek(seconds);
                });
            },
            mute() {
                return vimeoPlayer.setMuted(true).then(() => {
                    onMute({ muted: true });
                });
            },
            unmute() {
                return vimeoPlayer.setMuted(false).then(() => {
                    onMute({ muted: false });
                });
            },
            get muted() {
                return playerState.muted;
            },
            get volume() {
                return playerState.volume;
            },
            setVolume(vol) {
                const v = Math.max(0, Math.min(1, vol));
                return vimeoPlayer.setVolume(v).then(() => {
                    playerState.volume = v;
                });
            },
            get error() {
                return playerState.error;
            },
            destroy() {
                vimeoPlayer.destroy();
                if (iframe.parentNode)
                    container.removeChild(iframe);
            },
        };
    });
};
//# sourceMappingURL=player.js.map