/**
 * Normalized iframe template generation for all embed providers.
 */
export interface IIframeEmbedProps {
    /** Embed URL (required). */
    src: string;
    /** Width (e.g. "560", "100%"). Default "560". */
    width?: string | number;
    /** Height (e.g. "315", "100%"). Default "315". */
    height?: string | number;
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
/**
 * Build iframe HTML from normalized props. Use this so all providers render
 * iframes consistently. Attribute values are escaped for safe HTML output.
 */
export declare function renderEmbedIframe(props: IIframeEmbedProps): string;
/**
 * Create an iframe element from normalized props. Use this when you need a live
 * HTMLIFrameElement (e.g. for Vimeo.Player(iframe) or postMessage). Uses
 * renderEmbedIframe and parses the result so attribute logic lives in one place.
 */
export declare function createEmbedIframeElement(props: IIframeEmbedProps): HTMLIFrameElement;
//# sourceMappingURL=iframe.d.ts.map