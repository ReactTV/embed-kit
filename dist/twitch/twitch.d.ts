import type { IEmbedPlayer, IEmbedProvider } from "../_base/index.js";
export declare class TwitchEmbed implements IEmbedProvider {
    #private;
    readonly name = "twitch";
    getEmbedUrl(id: string, options?: Record<string, unknown>): string;
    createPlayer(container: HTMLElement, id: string, options?: Record<string, unknown>): Promise<IEmbedPlayer>;
    play(): void;
    pause(): void;
    get paused(): boolean;
    get currentTime(): number;
    seek(seconds: number): void;
    mute(): void;
    unmute(): void;
    get muted(): boolean;
    get volume(): number | undefined;
    setVolume(volume: number): void | Promise<void>;
    parseSourceUrl(url: string): {
        id: string;
        provider: string;
        options?: never;
    } | {
        id: string;
        provider: string;
        options: {
            twitchType: string;
        };
    } | null;
}
//# sourceMappingURL=twitch.d.ts.map