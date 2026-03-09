import { YouTubeEmbed } from "./youtube.js";
export { YouTubeEmbed } from "./youtube.js";
export { createPlayer } from "./player.js";
declare const provider: YouTubeEmbed;
/** The default YouTube embed provider (used by the custom element). Use provider.play(), provider.pause(), await provider.paused, await provider.currentTime. */
export { provider as youtubeEmbedProvider };
/** Register the custom element `<youtube-embed>`. No-op if customElements is unavailable (e.g. Node). */
export declare function registerYouTubeEmbed(): void;
//# sourceMappingURL=index.d.ts.map