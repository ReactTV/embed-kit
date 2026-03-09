import type { CreatePlayerOptions, EmbedPlayer } from "../_base/index.js";
/**
 * Create a controllable Internet Archive player in the given container.
 * Uses postMessage to the embed iframe for play/pause. getPaused() is not supported by the
 * archive.org embed and resolves to false (unknown state).
 */
export declare function createPlayer(container: HTMLElement, itemId: string, options?: CreatePlayerOptions): Promise<EmbedPlayer>;
//# sourceMappingURL=player.d.ts.map