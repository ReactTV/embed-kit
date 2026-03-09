import type { TCreatePlayer } from "../_base/index.js";
declare global {
    interface Window {
        YT?: {
            Player: new (el: string | HTMLElement, opts: YTOptions) => YTPlayer;
            PlayerState: {
                ENDED: 0;
                PLAYING: 1;
                PAUSED: 2;
                BUFFERING: 3;
                CUED: 5;
            };
        };
        onYouTubeIframeAPIReady?: () => void;
    }
}
interface YTOptions {
    videoId: string;
    width?: number;
    height?: number;
    playerVars?: Record<string, number | string>;
    events?: {
        onReady?: (ev: {
            target: YTPlayer;
        }) => void;
        onStateChange?: (ev: {
            data: number;
        }) => void;
        onError?: (ev: {
            data: number;
        }) => void;
        onPlaybackQualityChange?: (ev: {
            data: string;
        }) => void;
        onPlaybackRateChange?: (ev: {
            data: number;
        }) => void;
        onAutoplayBlocked?: () => void;
        onApiChange?: () => void;
    };
}
interface YTPlayer {
    playVideo: () => void;
    pauseVideo: () => void;
    getPlayerState: () => number;
    getCurrentTime: () => number;
    getDuration: () => number;
    seekTo: (seconds: number, allowSeekAhead: boolean) => void;
    mute: () => void;
    unMute: () => void;
    isMuted: () => boolean;
    getVolume: () => number;
    setVolume: (volume: number) => void;
}
/**
 * Create a controllable YouTube player in the given container.
 * Returns a normalized IEmbedPlayer (play, pause, getPaused).
 */
export declare const createPlayer: TCreatePlayer;
export {};
//# sourceMappingURL=player.d.ts.map