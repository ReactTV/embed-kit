import { createControllableEmbedElement } from "../_base/index.js";
import { VimeoEmbed } from "./vimeo.js";

export { VimeoEmbed } from "./vimeo.js";
export { createPlayer } from "./player.js";

const provider = new VimeoEmbed();

/** The default Vimeo embed provider (used by the custom element). Use for provider.play(), provider.pause(), provider.getPaused(). */
export { provider as vimeoEmbedProvider };

/** Register the custom element `<vimeo-embed>`. No-op if customElements is unavailable (e.g. Node). */
export function registerVimeoEmbed(): void {
  if (typeof customElements !== "undefined" && !customElements.get("vimeo-embed")) {
    customElements.define("vimeo-embed", createControllableEmbedElement(provider, "vimeo-embed"));
  }
}
