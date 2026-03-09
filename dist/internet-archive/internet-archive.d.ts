import type { EmbedOptions, EmbedPlayer, EmbedProvider, ParsedEmbed } from "../_base/index.js";
export declare class InternetArchiveEmbed implements EmbedProvider {
    #private;
    readonly name = "internet-archive";
    getEmbedUrl(id: string, _options?: EmbedOptions): string;
    createPlayer(container: HTMLElement, id: string, options?: EmbedOptions): Promise<EmbedPlayer>;
    play(): void;
    pause(): void;
    getPaused(): Promise<boolean>;
    parseSourceUrl(url: string): ParsedEmbed | null;
}
//# sourceMappingURL=internet-archive.d.ts.map