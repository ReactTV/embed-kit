import { TwitchEmbed } from "./twitch.js";
export { TwitchEmbed } from "./twitch.js";
export { createPlayer } from "./player.js";
declare const provider: TwitchEmbed;
/** The default Twitch embed provider (used by the custom element). Use provider.play(), provider.pause(), await provider.paused, await provider.currentTime. */
export { provider as twitchEmbedProvider };
/** Register the custom element `<twitch-embed>`. No-op if customElements is unavailable (e.g. Node). */
export declare function registerTwitchEmbed(): void;
//# sourceMappingURL=index.d.ts.map