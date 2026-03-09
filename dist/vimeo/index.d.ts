import { VimeoEmbed } from "./vimeo.js";
export { VimeoEmbed } from "./vimeo.js";
export { createPlayer } from "./player.js";
declare const provider: VimeoEmbed;
/** The default Vimeo embed provider (used by the custom element). Use provider.play(), provider.pause(), await provider.paused, await provider.currentTime. */
export { provider as vimeoEmbedProvider };
/** Register the custom element `<vimeo-embed>`. No-op if customElements is unavailable (e.g. Node). */
export declare function registerVimeoEmbed(): void;
//# sourceMappingURL=index.d.ts.map