import type { EmbedOptions, EmbedProvider, ParsedEmbed } from "../_base/index.js";

export class VimeoEmbed implements EmbedProvider {
  readonly name = "vimeo";

  getEmbedUrl(id: string, _options?: EmbedOptions): string {
    void _options;
    return `https://player.vimeo.com/video/${id}`;
  }

  parseSourceUrl(url: string): ParsedEmbed | null {
    const trimmed = url.trim();
    const playerMatch = /player\.vimeo\.com\/video\/(\d+)/.exec(trimmed);
    if (playerMatch) return { id: playerMatch[1]!, provider: this.name };
    const directMatch = /vimeo\.com\/(\d+)(?:\/|$|\?)/.exec(trimmed);
    if (directMatch) return { id: directMatch[1]!, provider: this.name };
    const channelsMatch = /vimeo\.com\/channels\/[\w-]+\/(\d+)/.exec(trimmed);
    if (channelsMatch) return { id: channelsMatch[1]!, provider: this.name };
    const groupsMatch = /vimeo\.com\/groups\/[\w-]+\/videos\/(\d+)/.exec(trimmed);
    if (groupsMatch) return { id: groupsMatch[1]!, provider: this.name };
    return null;
  }
}
