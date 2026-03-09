import { createPlayerContainer, loadScript } from "../_base/index.js";
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
 * Create a controllable YouTube player in the given container.
 * Returns a normalized IEmbedPlayer (play, pause, getPaused).
 */
export const createPlayer = (container, id, options = {}) => {
    const { width = 560, height = 315, autoplay = false, volume: initialVolume, controls = true, enableCaptions, showAnnotations, config, onReady = () => { }, onPlay = () => { }, onPause = () => { }, onBuffering = () => { }, onEnded = () => { }, onProgress = () => { }, onDurationChange = () => { }, onSeek = () => { }, onMute = () => { }, onError = () => { }, onPlaybackQualityChange = () => { }, onPlaybackRateChange = () => { }, onAutoplayBlocked = () => { }, onApiChange = () => { }, progressInterval = 50, } = options;
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
    const playerState = {
        currentTime: 0,
        duration: 0,
        isPlaying: false,
        isPaused: true,
        muted: false,
        ...(typeof initialVolume === "number" &&
            initialVolume >= 0 &&
            initialVolume <= 1 && { volume: initialVolume }),
        error: null,
    };
    return loadYTScript().then(() => {
        const { element: div } = createPlayerContainer(container, "yt-player");
        const YT = window.YT;
        const { PlayerState } = YT;
        let player = null;
        const readyState = {
            progressIntervalId: undefined,
            destroyed: false,
        };
        new YT.Player(div, {
            videoId: id,
            width,
            height,
            playerVars,
            events: {
                onError(ev) {
                    playerState.error = { code: ev.data };
                    onError(playerState.error);
                },
                onReady(ev) {
                    if (readyState.destroyed)
                        return;
                    player = ev.target;
                    if (typeof initialVolume === "number" && initialVolume >= 0 && initialVolume <= 1) {
                        player.setVolume(Math.round(initialVolume * 100));
                        playerState.volume = initialVolume;
                    }
                    else {
                        playerState.volume = player.getVolume() / 100;
                    }
                    onReady();
                    // YouTube IFrame API has no timeupdate/progress event and no volume/mute event; polling required.
                    if (readyState.destroyed)
                        return;
                    readyState.progressIntervalId = setInterval(() => {
                        if (readyState.destroyed || !player)
                            return;
                        playerState.currentTime = player.getCurrentTime();
                        onProgress(playerState.currentTime);
                        const isMuted = player.isMuted();
                        if (playerState.muted !== isMuted) {
                            playerState.muted = isMuted;
                            onMute({ muted: isMuted });
                        }
                        playerState.volume = player.getVolume() / 100;
                        playerState.isPlaying = player.getPlayerState() === PlayerState.PLAYING;
                        playerState.isPaused = player.getPlayerState() === PlayerState.PAUSED;
                        const newDuration = player.getDuration();
                        if (newDuration !== playerState.duration) {
                            playerState.duration = newDuration;
                            onDurationChange(playerState.duration);
                        }
                        playerState.currentTime = player.getCurrentTime();
                        playerState.error = null;
                    }, progressInterval);
                },
                onStateChange(ev) {
                    if (ev.data === PlayerState.PLAYING)
                        onPlay();
                    if (ev.data === PlayerState.PAUSED)
                        onPause();
                    if (ev.data === PlayerState.BUFFERING)
                        onBuffering();
                    if (ev.data === PlayerState.ENDED)
                        onEnded();
                },
                onPlaybackQualityChange(ev) {
                    onPlaybackQualityChange(ev.data);
                },
                onPlaybackRateChange(ev) {
                    onPlaybackRateChange(ev.data);
                },
                onAutoplayBlocked() {
                    onAutoplayBlocked();
                },
                onApiChange() {
                    onApiChange();
                },
            },
        });
        return {
            play: () => player.playVideo(),
            pause: () => player.pauseVideo(),
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
                player.seekTo(seconds, true);
                onSeek(seconds);
            },
            mute: () => {
                player.mute();
                playerState.muted = true;
                onMute({ muted: true });
            },
            unmute: () => {
                player.unMute();
                playerState.muted = false;
                onMute({ muted: false });
            },
            get muted() {
                return playerState.muted;
            },
            get volume() {
                return playerState.volume;
            },
            setVolume(vol) {
                const v = Math.max(0, Math.min(1, vol));
                player.setVolume(Math.round(v * 100));
                playerState.volume = v;
            },
            get error() {
                return playerState.error;
            },
            destroy() {
                readyState.destroyed = true;
                if (readyState.progressIntervalId)
                    clearInterval(readyState.progressIntervalId);
                if (div.parentNode)
                    div.remove();
            },
        };
    });
};
//# sourceMappingURL=player.js.map