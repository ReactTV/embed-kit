const EMBED_BASE = "https://archive.org/embed/";
function post(iframe, action) {
    if (!iframe.contentWindow)
        return;
    // Use "*" so the embed accepts from any parent; some players only listen when origin is wildcard.
    iframe.contentWindow.postMessage(action, "*");
    // Some JW Player–based embeds expect an object; send both so at least one is handled.
    if (action === "play" || action === "pause") {
        iframe.contentWindow.postMessage({ event: action, type: action }, "*");
    }
}
/**
 * Create a controllable Internet Archive player in the given container.
 * Uses postMessage to the embed iframe for play/pause. getPaused() is not supported by the
 * archive.org embed and resolves to false (unknown state).
 */
export function createPlayer(container, itemId, options = {}) {
    const width = options.width ?? 560;
    const height = options.height ?? 315;
    const iframe = document.createElement("iframe");
    iframe.src = `${EMBED_BASE}${itemId}`;
    iframe.width = String(width);
    iframe.height = String(height);
    iframe.setAttribute("frameborder", "0");
    iframe.allow = "autoplay; fullscreen";
    iframe.allowFullscreen = true;
    container.appendChild(iframe);
    let loadCompleteResolve;
    const loadComplete = new Promise((resolve) => {
        loadCompleteResolve = resolve;
    });
    iframe.addEventListener("load", () => loadCompleteResolve(), { once: true });
    const player = {
        async play() {
            await loadComplete;
            post(iframe, "play");
        },
        async pause() {
            await loadComplete;
            post(iframe, "pause");
        },
        getPaused: () => Promise.resolve(false), // archive.org embed does not expose paused state
        destroy() {
            if (iframe.parentNode)
                container.removeChild(iframe);
        },
    };
    return Promise.resolve(player);
}
//# sourceMappingURL=player.js.map