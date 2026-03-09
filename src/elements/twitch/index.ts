import { createEmbedElement } from "../_base/index.js";
import { TwitchEmbed } from "./twitch.js";

export { TwitchEmbed } from "./twitch.js";
export { createPlayer } from "./player.js";

const provider = new TwitchEmbed();

/** Element class for `<twitch-embed>`. Use for React wrappers (e.g. createComponent from @lit/react). */
export const TwitchEmbedElement = createEmbedElement(provider);

export { provider as twitchEmbedProvider };

/** Register the custom element `<twitch-embed>`. No-op if customElements is unavailable (e.g. Node). */
export function registerTwitchEmbed(): void {
  if (typeof customElements !== "undefined" && !customElements.get("twitch-embed")) {
    customElements.define("twitch-embed", TwitchEmbedElement);
  }
}
