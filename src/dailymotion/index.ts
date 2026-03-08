import { createControllableEmbedElement } from "../_base/index.js";
import { DailymotionEmbed } from "./dailymotion.js";

export { DailymotionEmbed } from "./dailymotion.js";
export { createPlayer } from "./player.js";

const provider = new DailymotionEmbed();

/** The default Dailymotion embed provider (used by the custom element). Use for provider.play(), provider.pause(), provider.getPaused(). */
export { provider as dailymotionEmbedProvider };

/** Register the custom element `<dailymotion-embed>`. No-op if customElements is unavailable (e.g. Node). */
export function registerDailymotionEmbed(): void {
  if (typeof customElements !== "undefined" && !customElements.get("dailymotion-embed")) {
    customElements.define("dailymotion-embed", createControllableEmbedElement(provider, "dailymotion-embed"));
  }
}
