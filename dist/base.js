/**
 * Shared contract for embed providers.
 * Each provider (YouTube, Twitch, etc.) implements this interface.
 */
const DEFAULT_WIDTH = "560";
const DEFAULT_HEIGHT = "315";
function escapeHtmlAttr(value) {
    return value
        .replace(/&/g, "&amp;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
}
/**
 * Build iframe HTML from normalized props. Use this so all providers render
 * iframes consistently. Attribute values are escaped for safe HTML output.
 */
export function renderEmbedIframe(props) {
    const { src, width = DEFAULT_WIDTH, height = DEFAULT_HEIGHT, title = "", allow, allowFullScreen = true, sandbox, loading, referrerPolicy, className, style, ...rest } = props;
    const attrs = [];
    attrs.push(`src="${escapeHtmlAttr(src)}"`);
    attrs.push(`width="${escapeHtmlAttr(String(width))}"`);
    attrs.push(`height="${escapeHtmlAttr(String(height))}"`);
    if (title)
        attrs.push(`title="${escapeHtmlAttr(title)}"`);
    if (allow)
        attrs.push(`allow="${escapeHtmlAttr(allow)}"`);
    if (allowFullScreen)
        attrs.push("allowfullscreen");
    if (sandbox)
        attrs.push(`sandbox="${escapeHtmlAttr(sandbox)}"`);
    if (loading)
        attrs.push(`loading="${escapeHtmlAttr(loading)}"`);
    if (referrerPolicy)
        attrs.push(`referrerpolicy="${escapeHtmlAttr(referrerPolicy)}"`);
    if (className)
        attrs.push(`class="${escapeHtmlAttr(className)}"`);
    if (style)
        attrs.push(`style="${escapeHtmlAttr(style)}"`);
    for (const [key, value] of Object.entries(rest)) {
        if (value === undefined || value === null)
            continue;
        const attrName = key.toLowerCase().replace(/([a-z])([A-Z])/g, "$1-$2");
        if (typeof value === "boolean") {
            if (value)
                attrs.push(attrName);
        }
        else {
            attrs.push(`${attrName}="${escapeHtmlAttr(String(value))}"`);
        }
    }
    return `<iframe ${attrs.join(" ")}></iframe>`;
}
//# sourceMappingURL=base.js.map