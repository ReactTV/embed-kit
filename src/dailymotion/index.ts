import { createEmbedElement } from "../_base/index.js";
import { DailymotionEmbed } from "./dailymotion.js";

export { DailymotionEmbed } from "./dailymotion.js";
export { createPlayer } from "./player.js";

const provider = new DailymotionEmbed();

/** The default Dailymotion embed provider (used by the custom element). Use provider.play(), provider.pause(), await provider.paused, await provider.currentTime. */
export { provider as dailymotionEmbedProvider };

/** Register the custom element `<dailymotion-embed>`. No-op if customElements is unavailable (e.g. Node). */
export function registerDailymotionEmbed(): void {
  if (typeof customElements !== "undefined" && !customElements.get("dailymotion-embed")) {
    customElements.define("dailymotion-embed", createEmbedElement(provider));
  }
}
