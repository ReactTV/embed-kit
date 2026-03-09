import { TikTokEmbed } from "./tiktok.js";
export { TikTokEmbed } from "./tiktok.js";
export { createPlayer } from "./player.js";
declare const provider: TikTokEmbed;
/** The default TikTok embed provider (used by the custom element). Use provider.play(), provider.pause(), await provider.paused, await provider.currentTime. */
export { provider as tiktokEmbedProvider };
/** Register the custom element `<tiktok-embed>`. No-op if customElements is unavailable (e.g. Node). */
export declare function registerTikTokEmbed(): void;
//# sourceMappingURL=index.d.ts.map