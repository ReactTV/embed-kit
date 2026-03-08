import { createEmbedElement } from "../_base/index.js";
import { TwitchEmbed } from "./twitch.js";

export { TwitchEmbed } from "./twitch.js";
export { createPlayer } from "./player.js";

const provider = new TwitchEmbed();

/** The default Twitch embed provider (used by the custom element). Use provider.play(), provider.pause(), await provider.paused, await provider.currentTime. */
export { provider as twitchEmbedProvider };

/** Register the custom element `<twitch-embed>`. No-op if customElements is unavailable (e.g. Node). */
export function registerTwitchEmbed(): void {
  if (typeof customElements !== "undefined" && !customElements.get("twitch-embed")) {
    customElements.define("twitch-embed", createEmbedElement(provider));
  }
}
