import { createEmbedElement } from "../_base/index.js";
import { TikTokEmbed } from "./tiktok.js";

export { TikTokEmbed } from "./tiktok.js";
export { createPlayer } from "./player.js";

const provider = new TikTokEmbed();

/** Element class for `<tiktok-embed>`. Use for React wrappers (e.g. createComponent from @lit/react). */
export const TikTokEmbedElement = createEmbedElement(provider);

export { provider as tiktokEmbedProvider };

/** Register the custom element `<tiktok-embed>`. No-op if customElements is unavailable (e.g. Node). */
export function registerTikTokEmbed(): void {
  if (typeof customElements !== "undefined" && !customElements.get("tiktok-embed")) {
    customElements.define("tiktok-embed", TikTokEmbedElement);
  }
}
