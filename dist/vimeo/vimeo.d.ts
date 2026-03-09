import type { IEmbedPlayer, IEmbedProvider } from "../_base/index.js";
export declare class VimeoEmbed implements IEmbedProvider {
    #private;
    readonly name = "vimeo";
    getEmbedUrl(id: string, options?: Record<string, unknown>): string;
    createPlayer(container: HTMLElement, id: string, options?: Record<string, unknown>): Promise<IEmbedPlayer>;
    play(): void | Promise<void>;
    pause(): void | Promise<void>;
    get paused(): boolean;
    get currentTime(): number;
    seek(seconds: number): void | Promise<void>;
    mute(): void | Promise<void>;
    unmute(): void | Promise<void>;
    get muted(): boolean;
    get volume(): number | undefined;
    setVolume(volume: number): void | Promise<void>;
    parseSourceUrl(url: string): {
        id: string;
        provider: string;
        options: {
            vimeoHash: string;
        };
    } | {
        id: string;
        provider: string;
        options?: never;
    } | null;
}
//# sourceMappingURL=vimeo.d.ts.map