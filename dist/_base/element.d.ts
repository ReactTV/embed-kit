import type { TCreatePlayer } from "./player.js";
/**
 * Provider contract: URL building and player creation.
 * Each embed (YouTube, Twitch, etc.) implements this.
 */
export interface IEmbedProvider {
    readonly name: string;
    getEmbedUrl(id: string, options?: Record<string, unknown>): string;
    parseSourceUrl(url: string): {
        id: string;
        provider: string;
        options?: Record<string, unknown>;
    } | null;
    createPlayer: TCreatePlayer;
}
export declare function createEmbedElement(provider: IEmbedProvider): CustomElementConstructor;
//# sourceMappingURL=element.d.ts.map