/**
 * Create an iframe element from normalized props. Use this when you need a live
 * HTMLIFrameElement (e.g. for Vimeo.Player(iframe) or postMessage). Uses
 * renderEmbedIframe and parses the result so attribute logic lives in one place.
 */
export function createIframe(src: string): HTMLIFrameElement {
  const iframe = document.createElement("iframe");
  iframe.src = src;
  iframe.style.width = "100%";
  iframe.style.height = "100%";
  iframe.style.overflow = "hidden";
  iframe.style.border = "none";
  return iframe;
}
