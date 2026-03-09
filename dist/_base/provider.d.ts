import type { EmbedPlayer } from "./player.js";
/**
 * Provider contract: URL building and optional player creation.
 * Each embed (YouTube, Twitch, etc.) implements this.
 */
export interface EmbedProvider {
    readonly name: string;
    getEmbedUrl(id: string, options?: Record<string, unknown>): string;
    parseSourceUrl(url: string): {
        id: string;
        provider: string;
        options?: Record<string, unknown>;
    } | null;
    createPlayer(container: HTMLElement, id: string, options?: Record<string, unknown>): Promise<EmbedPlayer>;
}
//# sourceMappingURL=provider.d.ts.map