import { jsx as _jsx } from "react/jsx-runtime";
import { useRef, useEffect, useState } from "react";
import { getProviderForUrl } from "./providers.js";
const defaultWidth = 560;
const defaultHeight = 315;
const noop = () => { };
export function ReactEmbedKit({ url, playerRef: playerRefProp, onUnsupportedUrl, onError = () => { }, onReady = () => { }, className, style, playing, pip, ...playerOptions }) {
    const containerRef = useRef(null);
    const playerRef = useRef(null);
    const playerRefPropRef = useRef(playerRefProp);
    playerRefPropRef.current = playerRefProp;
    const optionsRef = useRef({ ...playerOptions, onReady, onError });
    optionsRef.current = { ...playerOptions, onReady, onError };
    const [playerReady, setPlayerReady] = useState(null);
    useEffect(() => {
        const container = containerRef.current;
        if (!container)
            return;
        const resolved = getProviderForUrl(url);
        if (!resolved) {
            onUnsupportedUrl?.(url);
            return;
        }
        container.innerHTML = "";
        const { provider, id } = resolved;
        let cancelled = false;
        const promise = provider.createPlayer(container, id, {
            ...playerOptions,
            width: playerOptions.width ?? defaultWidth,
            height: playerOptions.height ?? defaultHeight,
            onReady: noop,
            onError: (data) => optionsRef.current.onError?.(data),
            onPlay: () => optionsRef.current.onPlay?.(),
            onPause: () => optionsRef.current.onPause?.(),
            onBuffering: () => optionsRef.current.onBuffering?.(),
            onEnded: () => optionsRef.current.onEnded?.(),
            onProgress: (t) => optionsRef.current.onProgress?.(t),
            onDurationChange: (d) => optionsRef.current.onDurationChange?.(d),
            onSeeking: () => optionsRef.current.onSeeking?.(),
            onSeek: (t) => optionsRef.current.onSeek?.(t),
            onMute: (data) => optionsRef.current.onMute?.(data),
            onPlaybackQualityChange: (q) => optionsRef.current.onPlaybackQualityChange?.(q),
            onPlaybackRateChange: (r) => optionsRef.current.onPlaybackRateChange?.(r),
            onAutoplayBlocked: () => optionsRef.current.onAutoplayBlocked?.(),
            onApiChange: () => optionsRef.current.onApiChange?.(),
        });
        promise
            .then((player) => {
            if (cancelled) {
                try {
                    player.destroy?.();
                }
                catch {
                    // Container may already have been cleared when URL changed
                }
                return;
            }
            playerRef.current = player;
            const ref = playerRefPropRef.current;
            if (ref != null) {
                if (typeof ref === "function")
                    ref(player);
                else
                    ref.current = player;
            }
            setPlayerReady(player);
            optionsRef.current.onReady?.(player);
        })
            .catch((err) => {
            if (!cancelled) {
                optionsRef.current.onError?.({ message: err?.message ?? String(err) });
            }
        });
        return () => {
            cancelled = true;
            setPlayerReady(null);
            const p = playerRef.current;
            playerRef.current = null;
            const ref = playerRefPropRef.current;
            if (ref != null) {
                if (typeof ref === "function")
                    ref(null);
                else
                    ref.current = null;
            }
            try {
                p?.destroy?.();
            }
            finally {
                container.innerHTML = "";
            }
        };
    }, [
        url,
        playerOptions.width,
        playerOptions.height,
        playerOptions.autoplay,
        playerOptions.controls,
        playerOptions.enableCaptions,
        playerOptions.showAnnotations,
        playerOptions.progressInterval,
    ]);
    // Sync controlled playing state to the player when it or the player changes.
    useEffect(() => {
        if (!playerReady)
            return;
        if (playing) {
            void playerReady.play();
        }
        else {
            playerReady.pause();
        }
    }, [playing, playerReady]);
    // Request pip when player is ready, if pip prop is true.
    useEffect(() => {
        if (!pip || !playerReady)
            return;
        playerReady.requestPictureInPicture?.();
    }, [pip, playerReady]);
    return _jsx("div", { ref: containerRef, className: className, style: style });
}
//# sourceMappingURL=ReactEmbedKit.js.map