import { createEmbedElement } from "../_base/index.js";
import { YouTubeEmbed } from "./youtube.js";

export { YouTubeEmbed } from "./youtube.js";

const provider = new YouTubeEmbed();

/** Register the custom element `<youtube-embed>`. No-op if customElements is unavailable (e.g. Node). */
export function registerYouTubeEmbed(): void {
  if (typeof customElements !== "undefined" && !customElements.get("youtube-embed")) {
    customElements.define("youtube-embed", createEmbedElement(provider, "youtube-embed"));
  }
}
