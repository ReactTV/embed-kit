import { createEmbedElement } from "../_base/index.js";
import { TikTokEmbed } from "./tiktok.js";
export { TikTokEmbed } from "./tiktok.js";
export { createPlayer } from "./player.js";
const provider = new TikTokEmbed();
/** The default TikTok embed provider (used by the custom element). Use provider.play(), provider.pause(), await provider.paused, await provider.currentTime. */
export { provider as tiktokEmbedProvider };
/** Register the custom element `<tiktok-embed>`. No-op if customElements is unavailable (e.g. Node). */
export function registerTikTokEmbed() {
    if (typeof customElements !== "undefined" && !customElements.get("tiktok-embed")) {
        customElements.define("tiktok-embed", createEmbedElement(provider));
    }
}
//# sourceMappingURL=index.js.map