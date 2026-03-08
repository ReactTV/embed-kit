/**
 * Normalized iframe template generation for all embed providers.
 */

export interface IIframeEmbedProps {
  /** Embed URL (required). */
  src: string;
  /** Width in pixels. Default 560. */
  width?: number;
  /** Height in pixels. Default 315. */
  height?: number;
  /** Accessible title for the iframe. */
  title?: string;
  /** Feature policy (e.g. "accelerometer; autoplay; clipboard-write; encrypted-media"). */
  allow?: string;
  /** Allow fullscreen. Default true. */
  allowFullScreen?: boolean;
  /** Sandbox allowlist (e.g. "allow-scripts allow-same-origin"). */
  sandbox?: string;
  /** Loading: "lazy" | "eager". */
  loading?: "lazy" | "eager";
  /** Referrer policy for the iframe (e.g. "no-referrer", "strict-origin-when-cross-origin"). */
  referrerPolicy?: string;
  /** Optional class name(s) for the iframe element. */
  className?: string;
  /** Optional inline style string. */
  style?: string;
  /** Optional extra HTML attributes (e.g. data-*). Keys and values are not escaped. */
  [key: string]: string | number | boolean | undefined;
}

const DEFAULT_WIDTH = 560;
const DEFAULT_HEIGHT = 315;

function escapeHtmlAttr(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/** Emit an attribute string, or null if value is missing/false. */
function attr(
  name: string,
  value: string | number | boolean | undefined | null
): string | null {
  if (value === undefined || value === null) return null;
  if (typeof value === "boolean") return value ? name : null;
  return `${name}="${escapeHtmlAttr(String(value))}"`;
}

/** Emit a boolean attribute name when condition is true. */
function boolAttr(name: string, condition: boolean): string | null {
  return condition ? name : null;
}

/**
 * Build iframe HTML from normalized props. Use this so all providers render
 * iframes consistently. Attribute values are escaped for safe HTML output.
 */
export function renderEmbedIframe(props: IIframeEmbedProps): string {
  const {
    src,
    width = DEFAULT_WIDTH,
    height = DEFAULT_HEIGHT,
    title = "",
    allow,
    allowFullScreen = true,
    sandbox,
    loading,
    referrerPolicy,
    className,
    style,
    ...rest
  } = props;

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
      return typeof value === "boolean"
        ? (value ? name : null)
        : `${name}="${escapeHtmlAttr(String(value))}"`;
    })
    .filter(Boolean) as string[];

  const allAttrs = [...knownAttrs.filter(Boolean), ...extraAttrs] as string[];
  return `<iframe ${allAttrs.join(" ")}></iframe>`;
}

/**
 * Create an iframe element from normalized props. Use this when you need a live
 * HTMLIFrameElement (e.g. for Vimeo.Player(iframe) or postMessage). Uses
 * renderEmbedIframe and parses the result so attribute logic lives in one place.
 */
export function createEmbedIframeElement(props: IIframeEmbedProps): HTMLIFrameElement {
  const div = document.createElement("div");
  div.innerHTML = renderEmbedIframe(props);
  const iframe = div.querySelector("iframe");
  if (!iframe) throw new Error("renderEmbedIframe did not produce an iframe");
  return iframe;
}
