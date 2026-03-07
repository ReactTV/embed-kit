import { createEmbedElement } from "../_base/index.js";
import { TikTokEmbed } from "./tiktok.js";

export { TikTokEmbed } from "./tiktok.js";

const provider = new TikTokEmbed();

/** Register the custom element `<tiktok-embed>`. No-op if customElements is unavailable (e.g. Node). */
export function registerTikTokEmbed(): void {
  if (typeof customElements !== "undefined" && !customElements.get("tiktok-embed")) {
    customElements.define("tiktok-embed", createEmbedElement(provider, "tiktok-embed"));
  }
}
