import { DailymotionEmbed } from "./dailymotion.js";
export { DailymotionEmbed } from "./dailymotion.js";
export { createPlayer } from "./player.js";
declare const provider: DailymotionEmbed;
/** The default Dailymotion embed provider (used by the custom element). Use provider.play(), provider.pause(), await provider.paused, await provider.currentTime. */
export { provider as dailymotionEmbedProvider };
/** Register the custom element `<dailymotion-embed>`. No-op if customElements is unavailable (e.g. Node). */
export declare function registerDailymotionEmbed(): void;
//# sourceMappingURL=index.d.ts.map