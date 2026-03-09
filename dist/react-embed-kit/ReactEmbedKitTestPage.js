import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React, { useState, useEffect, useMemo } from "react";
import { ReactEmbedKit } from "./ReactEmbedKit.js";
import { SOURCE_URL as YOUTUBE_SOURCE_URL, VIDEO_ID as YOUTUBE_VIDEO_ID, } from "../youtube/constants.js";
import { SOURCE_URL as VIMEO_SOURCE_URL } from "../vimeo/constants.js";
import { VIDEO_SOURCE_URL as TWITCH_VIDEO_SOURCE_URL } from "../twitch/constants.js";
import { SOURCE_URL as TIKTOK_SOURCE_URL } from "../tiktok/constants.js";
import { SOURCE_URL as DAILYMOTION_SOURCE_URL } from "../dailymotion/constants.js";
const PRESETS = [
    { label: "YouTube", url: YOUTUBE_SOURCE_URL },
    { label: "youtu.be", url: `https://youtu.be/${YOUTUBE_VIDEO_ID}` },
    { label: "Vimeo", url: VIMEO_SOURCE_URL },
    { label: "Twitch (video)", url: TWITCH_VIDEO_SOURCE_URL },
    { label: "TikTok", url: TIKTOK_SOURCE_URL },
    { label: "Dailymotion", url: DAILYMOTION_SOURCE_URL },
];
function formatTime(seconds) {
    if (seconds == null || Number.isNaN(seconds))
        return "—";
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${String(s).padStart(2, "0")}`;
}
/**
 * Test page component for ReactEmbedKit: URL input, embed, play/pause/seek/mute
 * controls, and a data panel showing currentTime, duration, paused, muted,
 * isBuffering, isSeeking.
 */
export function ReactEmbedKitTestPage() {
    const [url, setUrl] = useState(PRESETS[0]?.url ?? "");
    const [player, setPlayer] = useState(null);
    const [buffering, setBuffering] = useState(false);
    const [seeking, setSeeking] = useState(false);
    const [controls, setControls] = useState(true);
    const [enableCaptions, setEnableCaptions] = useState(false);
    const [showAnnotations, setShowAnnotations] = useState(true);
    const [data, setData] = useState({
        currentTime: null,
        duration: null,
        paused: null,
        muted: null,
    });
    useEffect(() => {
        setPlayer(null);
        setBuffering(false);
        setSeeking(false);
    }, [url]);
    useEffect(() => {
        if (!player) {
            setData({ currentTime: null, duration: null, paused: null, muted: null });
            return;
        }
        let cancelled = false;
        const poll = async () => {
            if (cancelled)
                return;
            try {
                const [currentTime, duration, paused, muted] = await Promise.all([
                    player.currentTime,
                    player.duration,
                    player.paused,
                    player.muted,
                ]);
                if (!cancelled)
                    setData({ currentTime, duration, paused, muted });
            }
            catch {
                // ignore
            }
        };
        void poll();
        const id = setInterval(poll, 500);
        return () => {
            cancelled = true;
            clearInterval(id);
        };
    }, [player]);
    const dataRows = player
        ? [
            ["currentTime", formatTime(data.currentTime)],
            ["duration", formatTime(data.duration)],
            ["paused", String(data.paused)],
            ["muted", String(data.muted)],
            ["isBuffering", String(buffering)],
            ["isSeeking", String(seeking)],
        ]
        : [];
    const selectedPreset = PRESETS.find((p) => p.url === url)?.url ?? "";
    const embedConfig = useMemo(() => ({
        youtube: {
            origin: typeof window !== "undefined" ? window.location.origin : undefined,
        },
    }), []);
    return (_jsxs("div", { className: "section", children: [_jsx("label", { htmlFor: "provider", children: "Provider" }), _jsxs("select", { id: "provider", value: selectedPreset, onChange: (e) => {
                    const value = e.target.value;
                    if (value)
                        setUrl(value);
                }, "aria-label": "Choose a provider to autofill URL", children: [_jsx("option", { value: "", children: "Custom / paste URL below" }), PRESETS.map((p) => (_jsx("option", { value: p.url, children: p.label }, p.url)))] }), _jsx("label", { htmlFor: "url", children: "Video URL" }), _jsx("input", { id: "url", type: "url", value: url, onChange: (e) => setUrl(e.target.value), placeholder: "https://www.youtube.com/watch?v=..." }), _jsx("p", { className: "hint", children: "Try: YouTube, youtu.be, Vimeo, Twitch videos/clips/channel, TikTok, Dailymotion" }), _jsxs("div", { className: "player-options", style: { marginBottom: "0.75rem" }, children: [_jsxs("label", { style: { display: "flex", alignItems: "center", gap: "0.5rem", marginRight: "1rem" }, children: [_jsx("input", { type: "checkbox", checked: controls, onChange: (e) => setControls(e.target.checked) }), "Show native controls"] }), _jsxs("label", { style: { display: "flex", alignItems: "center", gap: "0.5rem", marginRight: "1rem" }, children: [_jsx("input", { type: "checkbox", checked: enableCaptions, onChange: (e) => setEnableCaptions(e.target.checked) }), "Enable captions"] }), _jsxs("label", { style: { display: "flex", alignItems: "center", gap: "0.5rem" }, children: [_jsx("input", { type: "checkbox", checked: showAnnotations, onChange: (e) => setShowAnnotations(e.target.checked) }), "Show annotations"] })] }), _jsx("div", { className: "player-wrap", children: _jsx(ReactEmbedKit, { url: url, width: 560, height: 315, controls: controls, enableCaptions: enableCaptions, showAnnotations: showAnnotations, config: embedConfig, onReady: (p) => setPlayer(p), onBuffering: () => setBuffering(true), onPlay: () => setBuffering(false), onSeeking: () => setSeeking(true), onSeek: () => setSeeking(false), onError: (d) => console.warn("Embed error:", d), onUnsupportedUrl: (u) => {
                        setPlayer(null);
                        console.warn("Unsupported URL:", u);
                    } }) }), _jsxs("div", { className: "controls", children: [_jsx("button", { type: "button", disabled: !player, onClick: () => player?.play(), children: "Play" }), _jsx("button", { type: "button", disabled: !player, onClick: () => player?.pause(), children: "Pause" }), _jsx("button", { type: "button", disabled: !player, onClick: () => {
                            setSeeking(true);
                            player?.seek(0);
                        }, children: "Seek to 0:00" }), _jsx("button", { type: "button", disabled: !player, onClick: () => {
                            setSeeking(true);
                            player?.seek(30);
                        }, children: "Seek to 0:30" }), _jsx("button", { type: "button", disabled: !player, onClick: () => player?.mute(), children: "Mute" }), _jsx("button", { type: "button", disabled: !player, onClick: () => player?.unmute(), children: "Unmute" })] }), _jsx("div", { className: "data-panel", children: dataRows.length > 0 ? (_jsx("dl", { children: dataRows.map(([label, value]) => (_jsxs(React.Fragment, { children: [_jsx("dt", { children: label }), _jsx("dd", { children: value })] }, label))) })) : (_jsx("p", { className: "no-player", children: "Load a supported URL to see live data." })) })] }));
}
//# sourceMappingURL=ReactEmbedKitTestPage.js.map