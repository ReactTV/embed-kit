import { createControllableEmbedElement } from "../_base/index.js";
import { InternetArchiveEmbed } from "./internet-archive.js";
export { InternetArchiveEmbed } from "./internet-archive.js";
export { createPlayer } from "./player.js";
const provider = new InternetArchiveEmbed();
/** The default Internet Archive embed provider (used by the custom element). Use for provider.play(), provider.pause(), provider.getPaused(). */
export { provider as internetArchiveEmbedProvider };
/** Register the custom element `<internet-archive-embed>`. No-op if customElements is unavailable (e.g. Node). */
export function registerInternetArchiveEmbed() {
    if (typeof customElements !== "undefined" && !customElements.get("internet-archive-embed")) {
        customElements.define("internet-archive-embed", createControllableEmbedElement(provider, "internet-archive-embed"));
    }
}
//# sourceMappingURL=index.js.map