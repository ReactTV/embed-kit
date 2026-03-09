import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useRef, useEffect, useState } from "react";
import { getProviderForUrl } from "./providers.js";
const defaultWidth = "560";
const defaultHeight = "315";
function toCssSize(value, fallback) {
    if (value === undefined)
        return fallback;
    const s = String(value);
    return /^\d+$/.test(s) ? `${s}px` : s;
}
/**
 * React wrapper for embed-kit: pass a video URL and the correct provider (YouTube, Twitch, TikTok, Dailymotion, Vimeo) is chosen automatically.
 * Renders a single div that hosts the embed; play/pause and other controls are available via the embed's callbacks or by using a ref and calling the player API.
 */
export function ReactEmbedKit({ url, width = defaultWidth, height = defaultHeight, autoplay, onReady, onPlay, onPause, onBuffering, onEnded, onProgress, onMute, onError, onUnsupportedUrl, className, style, ...restOptions }) {
    const containerRef = useRef(null);
    const playerRef = useRef(null);
    const [error, setError] = useState(null);
    useEffect(() => {
        const container = containerRef.current;
        if (!container)
            return;
        const resolved = getProviderForUrl(url);
        if (!resolved) {
            setError(`Unsupported URL: ${url}`);
            onUnsupportedUrl?.(url);
            return;
        }
        setError(null);
        // Clear any previous player DOM so the new embed isn't covered (handles URL change
        // before the previous createPlayer promise resolved, so destroy() was never called).
        container.innerHTML = "";
        const { provider, id, options: providerOptions } = resolved;
        const mergedOptions = {
            width,
            height,
            autoplay: Boolean(autoplay),
            onError: (data) => {
                setError(data.message ?? String(data.code ?? "Unknown error"));
                onError?.(data);
            },
            ...providerOptions,
            ...restOptions,
        };
        if (typeof onPlay === "function")
            mergedOptions.onPlay = onPlay;
        if (typeof onPause === "function")
            mergedOptions.onPause = onPause;
        if (typeof onBuffering === "function")
            mergedOptions.onBuffering = onBuffering;
        if (typeof onEnded === "function")
            mergedOptions.onEnded = onEnded;
        if (typeof onProgress === "function")
            mergedOptions.onProgress = onProgress;
        if (typeof onMute === "function")
            mergedOptions.onMute = onMute;
        let cancelled = false;
        const promise = provider.createPlayer(container, id, mergedOptions);
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
            onReady?.(player);
        })
            .catch((err) => {
            if (!cancelled) {
                setError(err?.message ?? String(err));
                onError?.({ message: err?.message ?? String(err) });
            }
        });
        return () => {
            cancelled = true;
            const p = playerRef.current;
            playerRef.current = null;
            p?.destroy?.();
        };
    }, [url, width, height, autoplay]);
    const w = toCssSize(width, defaultWidth);
    const h = toCssSize(height, defaultHeight);
    return (_jsxs("div", { className: className, style: {
            position: "relative",
            width: w,
            height: h,
            minWidth: w,
            minHeight: h,
            ...style,
        }, children: [_jsx("div", { ref: containerRef, style: {
                    width: "100%",
                    height: "100%",
                    overflow: "hidden",
                } }), error !== null ? (_jsx("div", { style: {
                    position: "absolute",
                    inset: 0,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: "#f5f5f5",
                    color: "#666",
                    fontSize: "14px",
                }, children: error })) : null] }));
}
//# sourceMappingURL=ReactEmbedKit.js.map