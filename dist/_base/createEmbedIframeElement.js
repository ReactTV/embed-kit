/**
 * Normalized iframe template generation for all embed providers.
 */
const DEFAULT_WIDTH = 560;
const DEFAULT_HEIGHT = 315;
function escapeHtmlAttr(value) {
    return value
        .replace(/&/g, "&amp;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
}
/** Emit an attribute string, or null if value is missing/false. */
function attr(name, value) {
    if (value === undefined || value === null)
        return null;
    if (typeof value === "boolean")
        return value ? name : null;
    return `${name}="${escapeHtmlAttr(String(value))}"`;
}
/** Emit a boolean attribute name when condition is true. */
function boolAttr(name, condition) {
    return condition ? name : null;
}
/**
 * Build iframe HTML from normalized props. Use this so all providers render
 * iframes consistently. Attribute values are escaped for safe HTML output.
 */
export function renderEmbedIframe(props) {
    const { src, width = DEFAULT_WIDTH, height = DEFAULT_HEIGHT, title = "", allow, allowFullScreen = true, sandbox, loading, referrerPolicy, className, style, ...rest } = props;
    const knownAttrs = [
        attr("src", src),
        attr("width", width),
        attr("height", height),
        attr("title", title || null),
        attr("allow", allow),
        boolAttr("allowfullscreen", allowFullScreen),
        attr("frameborder", "0"),
        attr("sandbox", sandbox),
        attr("loading", loading),
        attr("referrerpolicy", referrerPolicy),
        attr("class", className),
        attr("style", style),
    ];
    const extraAttrs = Object.entries(rest)
        .filter(([, value]) => value !== undefined && value !== null)
        .map(([key, value]) => {
        const name = key.toLowerCase().replace(/([a-z])([A-Z])/g, "$1-$2");
        if (typeof value === "boolean") {
            return value ? name : null;
        }
        return `${name}="${escapeHtmlAttr(String(value))}"`;
    })
        .filter(Boolean);
    const allAttrs = [...knownAttrs.filter(Boolean), ...extraAttrs];
    return `<iframe ${allAttrs.join(" ")}></iframe>`;
}
/**
 * Create an iframe element from normalized props. Use this when you need a live
 * HTMLIFrameElement (e.g. for Vimeo.Player(iframe) or postMessage). Uses
 * renderEmbedIframe and parses the result so attribute logic lives in one place.
 */
export function createEmbedIframeElement(props) {
    const div = document.createElement("div");
    div.innerHTML = renderEmbedIframe(props);
    const iframe = div.querySelector("iframe");
    if (!iframe)
        throw new Error("renderEmbedIframe did not produce an iframe");
    return iframe;
}
//# sourceMappingURL=createEmbedIframeElement.js.map