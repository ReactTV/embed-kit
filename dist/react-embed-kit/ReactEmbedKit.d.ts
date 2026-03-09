import type { IEmbedPlayer, IErrorData, IMuteData } from "../_base/index.js";
/** Props for ReactEmbedKit. Callbacks and options are typed explicitly so they infer correctly (no index signature). */
export interface ReactEmbedKitProps {
    url: string;
    width?: number;
    height?: number;
    className?: string;
    style?: React.CSSProperties;
    autoplay?: boolean;
    /** When set, syncs play/pause to the player (e.g. playing={true} calls play()). Undefined is treated as false. */
    playing?: boolean;
    /** When true, requests picture-in-picture when ready. Only if the provider supports it. */
    pip?: boolean;
    /** Initial volume 0–1. Not all providers support volume. */
    volume?: number;
    progressInterval?: number;
    /** Show native player controls. Default true. YouTube: playerVars.controls. */
    controls?: boolean;
    /** Load captions by default when available. YouTube: cc_load_policy. */
    enableCaptions?: boolean;
    /** Show video annotations (e.g. YouTube cards). YouTube: iv_load_policy (1 = show, 3 = hide). */
    showAnnotations?: boolean;
    /** Provider-specific config. e.g. config={{ youtube: { origin }, vimeo: { title: 0 } }}. */
    config?: {
        youtube?: Record<string, number | string | undefined>;
        vimeo?: Record<string, number | string | undefined>;
    };
    /** Ref set to EmbedPlayerVideoElement when ready (play, pause, currentTime, addEventListener). Cleared on unmount. */
    playerRef?: React.Ref<IEmbedPlayer | null>;
    onUnsupportedUrl?: (url: string) => void;
    onError?: (data: IErrorData) => void;
    onReady?: (player: IEmbedPlayer) => void;
    onPlay?: () => void;
    onPause?: () => void;
    onBuffering?: () => void;
    onEnded?: () => void;
    onProgress?: (currentTime: number) => void;
    /** Fired when duration is known or changes (e.g. after metadata load). */
    onDurationChange?: (duration: number) => void;
    onSeeking?: () => void;
    onSeek?: (currentTime: number) => void;
    onMute?: (data: IMuteData) => void;
    onPlaybackQualityChange?: (quality: string) => void;
    onPlaybackRateChange?: (rate: number) => void;
    onAutoplayBlocked?: () => void;
    onApiChange?: () => void;
}
export declare function ReactEmbedKit({ url, playerRef: playerRefProp, onUnsupportedUrl, onError, onReady, className, style, playing, pip, ...playerOptions }: ReactEmbedKitProps): React.ReactElement;
//# sourceMappingURL=ReactEmbedKit.d.ts.map