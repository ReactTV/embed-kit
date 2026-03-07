import { createEmbedElement } from "../_base/index.js";
import { VimeoEmbed } from "./vimeo.js";

export { VimeoEmbed } from "./vimeo.js";

const provider = new VimeoEmbed();

/** Register the custom element `<vimeo-embed>`. No-op if customElements is unavailable (e.g. Node). */
export function registerVimeoEmbed(): void {
  if (typeof customElements !== "undefined" && !customElements.get("vimeo-embed")) {
    customElements.define("vimeo-embed", createEmbedElement(provider, "vimeo-embed"));
  }
}
