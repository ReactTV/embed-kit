import { createControllableEmbedElement } from "../_base/index.js";
import { YouTubeEmbed } from "./youtube.js";

export { YouTubeEmbed } from "./youtube.js";
export { createPlayer } from "./player.js";

const provider = new YouTubeEmbed();

/** The default YouTube embed provider (used by the custom element). Use provider.play(), provider.pause(), await provider.paused, await provider.currentTime. */
export { provider as youtubeEmbedProvider };

/** Register the custom element `<youtube-embed>`. No-op if customElements is unavailable (e.g. Node). */
export function registerYouTubeEmbed(): void {
  if (typeof customElements !== "undefined" && !customElements.get("youtube-embed")) {
    customElements.define("youtube-embed", createControllableEmbedElement(provider, "youtube-embed"));
  }
}
