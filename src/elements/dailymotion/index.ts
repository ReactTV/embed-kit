import { createEmbedElement } from "../_base/index.js";
import { DailymotionEmbed } from "./dailymotion.js";

export { DailymotionEmbed } from "./dailymotion.js";
export { createPlayer } from "./player.js";

const provider = new DailymotionEmbed();

/** Element class for `<dailymotion-embed>`. Use for React wrappers (e.g. createComponent from @lit/react). */
export const DailymotionEmbedElement = createEmbedElement(provider);

export { provider as dailymotionEmbedProvider };

/** Register the custom element `<dailymotion-embed>`. No-op if customElements is unavailable (e.g. Node). */
export function registerDailymotionEmbed(): void {
  if (typeof customElements !== "undefined" && !customElements.get("dailymotion-embed")) {
    customElements.define("dailymotion-embed", DailymotionEmbedElement);
  }
}
