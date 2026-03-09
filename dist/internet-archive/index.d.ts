import { InternetArchiveEmbed } from "./internet-archive.js";
export { InternetArchiveEmbed } from "./internet-archive.js";
export { createPlayer } from "./player.js";
declare const provider: InternetArchiveEmbed;
/** The default Internet Archive embed provider (used by the custom element). Use for provider.play(), provider.pause(), provider.getPaused(). */
export { provider as internetArchiveEmbedProvider };
/** Register the custom element `<internet-archive-embed>`. No-op if customElements is unavailable (e.g. Node). */
export declare function registerInternetArchiveEmbed(): void;
//# sourceMappingURL=index.d.ts.map