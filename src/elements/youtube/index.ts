import { createEmbedElement } from "../_base/index.js";
import { YouTubeEmbed } from "./youtube.js";

export { YouTubeEmbed } from "./youtube.js";
export { createPlayer } from "./player.js";

const provider = new YouTubeEmbed();

/** Element class for `<youtube-embed>`. Use for React wrappers (e.g. createComponent from @lit/react). */
export const YouTubeEmbedElement = createEmbedElement(provider);

/** The default YouTube embed provider (used by the custom element). Use provider.play(), provider.pause(), await provider.paused, await provider.currentTime. */
export { provider as youtubeEmbedProvider };

/** Register the custom element `<youtube-embed>`. No-op if customElements is unavailable (e.g. Node). */
export function registerYouTubeEmbed(): void {
  if (typeof customElements !== "undefined" && !customElements.get("youtube-embed")) {
    customElements.define("youtube-embed", YouTubeEmbedElement);
  }
}
