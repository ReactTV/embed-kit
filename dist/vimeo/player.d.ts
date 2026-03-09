import { type TCreatePlayer } from "../_base/index.js";
import type { IVimeoPlayer } from "./player.types.js";
declare global {
    interface Window {
        Vimeo?: {
            Player: new (iframe: HTMLIFrameElement) => IVimeoPlayer;
        };
    }
}
/**
 * Create a controllable Vimeo player in the given container.
 * Returns an EmbedPlayerVideoElement that mimics HTMLVideoElement.
 */
export declare const createPlayer: TCreatePlayer;
//# sourceMappingURL=player.d.ts.map