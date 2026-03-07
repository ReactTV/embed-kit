import { createEmbedElement } from "../_base/index.js";
import { DailymotionEmbed } from "./dailymotion.js";

export { DailymotionEmbed } from "./dailymotion.js";

const provider = new DailymotionEmbed();

/** Register the custom element `<dailymotion-embed>`. No-op if customElements is unavailable (e.g. Node). */
export function registerDailymotionEmbed(): void {
  if (typeof customElements !== "undefined" && !customElements.get("dailymotion-embed")) {
    customElements.define("dailymotion-embed", createEmbedElement(provider, "dailymotion-embed"));
  }
}
