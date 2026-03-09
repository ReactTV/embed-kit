import type { ICreatePlayerOptions, IEmbedPlayer, IErrorData } from "../_base/index.js";
export interface ReactEmbedKitProps extends Omit<ICreatePlayerOptions, "onError" | "onReady"> {
    /** Full URL to the video (e.g. YouTube watch link, Twitch video URL, TikTok URL). The correct embed provider is chosen automatically. */
    url: string;
    /** Optional callback when the URL could not be matched to any supported provider. */
    onUnsupportedUrl?: (url: string) => void;
    /** Called when the embed reports an error. */
    onError?: (data: IErrorData) => void;
    /** Called with the player instance when the embed is ready (use for play, pause, seek, mute, etc.). */
    onReady?: (player: IEmbedPlayer) => void;
    /** CSS width (default "560"). */
    width?: string | number;
    /** CSS height (default "315"). */
    height?: string | number;
    /** Root element class name. */
    className?: string;
    /** Inline styles for the root element. */
    style?: React.CSSProperties;
}
/**
 * React wrapper for embed-kit: pass a video URL and the correct provider (YouTube, Twitch, TikTok, Dailymotion, Vimeo) is chosen automatically.
 * Renders a single div that hosts the embed; play/pause and other controls are available via the embed's callbacks or by using a ref and calling the player API.
 */
export declare function ReactEmbedKit({ url, width, height, autoplay, onReady, onPlay, onPause, onBuffering, onEnded, onProgress, onMute, onError, onUnsupportedUrl, className, style, ...restOptions }: ReactEmbedKitProps): React.ReactElement;
//# sourceMappingURL=ReactEmbedKit.d.ts.map