import { createPlayerContainer, loadScript, EmbedPlayerVideoElement, wrapOptionsForEventTarget, } from "../_base/index.js";
const DAILYMOTION_LIB = "https://geo.dailymotion.com/libs/player.js";
/**
 * Create a controllable Dailymotion player. Returns an EmbedPlayerVideoElement that mimics HTMLVideoElement.
 */
export const createPlayer = (container, id, options = {}) => {
    const element = new EmbedPlayerVideoElement(options.url ?? `https://www.dailymotion.com/video/${id}`);
    const wrappedOptions = wrapOptionsForEventTarget(element, options);
    const { width = 560, height = 315, autoplay = false, controls = true, onReady = () => { }, onPlay = () => { }, onPause = () => { }, onBuffering = () => { }, onEnded = () => { }, onProgress = () => { }, onDurationChange = () => { }, onSeek = () => { }, onSeeking = () => { }, onMute = () => { }, onError = () => { }, } = wrappedOptions;
    const params = {};
    if (autoplay)
        params.autoplay = true;
    if (!controls)
        params.controls = false;
    const { element: wrapper, id: containerId } = createPlayerContainer(container, "dailymotion-player", {
        width,
        height,
    });
    return loadScript(DAILYMOTION_LIB, {
        isLoaded: () => !!window.dailymotion?.createPlayer,
        errorMessage: "Failed to load Dailymotion player script",
    })
        .then(() => {
        if (!window.dailymotion?.createPlayer) {
            wrapper.remove();
            return Promise.reject(new Error("Dailymotion player API not available"));
        }
        return window.dailymotion.createPlayer(containerId, {
            video: id,
            ...(Object.keys(params).length > 0 ? { params } : {}),
        });
    })
        .then((dmPlayer) => {
        onReady();
        const playerState = {
            currentTime: 0,
            duration: 0,
            isPaused: true,
            muted: false,
            error: null,
            isPlaying: false,
        };
        const { events } = window.dailymotion;
        dmPlayer.on(events.VIDEO_PLAY, () => {
            playerState.isPlaying = true;
            playerState.isPaused = false;
            onPlay();
        });
        dmPlayer.on(events.VIDEO_PAUSE, () => {
            playerState.isPlaying = false;
            playerState.isPaused = true;
            onPause();
        });
        dmPlayer.on(events.VIDEO_SEEKSTART, onSeeking);
        dmPlayer.on(events.VIDEO_SEEKEND, (data) => {
            playerState.currentTime = data.videoTime ?? 0;
            onSeek(playerState.currentTime);
        });
        dmPlayer.on(events.VIDEO_BUFFERING, onBuffering);
        dmPlayer.on(events.VIDEO_END, onEnded);
        dmPlayer.on(events.PLAYER_VOLUMECHANGE, (data) => {
            playerState.muted = data.playerIsMuted ?? false;
            if (typeof data.playerVolume === "number" && !Number.isNaN(data.playerVolume)) {
                playerState.volume = data.playerVolume;
            }
        });
        dmPlayer.on(events.VIDEO_DURATIONCHANGE, (data) => {
            const nextDuration = data.videoDuration ?? 0;
            if (nextDuration !== playerState.duration) {
                playerState.duration = nextDuration;
                onDurationChange(playerState.duration);
            }
        });
        const handleError = () => {
            playerState.error = { message: "Dailymotion playback error" };
            onError(playerState.error);
        };
        dmPlayer.on(events.PLAYER_ERROR, handleError);
        if (events.VIDEO_ERROR)
            dmPlayer.on(events.VIDEO_ERROR, handleError);
        dmPlayer.on(events.VIDEO_TIMECHANGE, (state) => {
            playerState.currentTime = state?.videoTime ?? 0;
            onProgress(playerState.currentTime);
        });
        const inner = {
            get currentTime() {
                return playerState.currentTime;
            },
            destroy() {
                dmPlayer.destroy();
                wrapper.remove();
            },
            get duration() {
                return playerState.duration;
            },
            get error() {
                return playerState.error;
            },
            get muted() {
                return playerState.muted;
            },
            mute() {
                dmPlayer.setMute(true);
                playerState.muted = true;
                onMute({ muted: true });
            },
            pause() {
                dmPlayer.pause();
            },
            get paused() {
                return playerState.isPaused;
            },
            play() {
                dmPlayer.play();
            },
            seek(seconds) {
                dmPlayer.seek(seconds);
                onSeek(seconds);
            },
            unmute() {
                dmPlayer.setMute(false);
                playerState.muted = false;
                onMute({ muted: false });
            },
            get volume() {
                return playerState.volume ?? dmPlayer.getVolume?.();
            },
            setVolume(vol) {
                const v = Math.max(0, Math.min(1, vol));
                dmPlayer.setVolume?.(v);
                playerState.volume = v;
            },
        };
        element.setPlayer(inner);
        return element;
    })
        .catch((err) => {
        wrapper.remove();
        throw err;
    });
};
//# sourceMappingURL=player.js.map