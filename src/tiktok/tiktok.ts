import type { EmbedOptions, EmbedProvider, ParsedEmbed } from "../_base/index.js";

export class TikTokEmbed implements EmbedProvider {
  readonly name = "tiktok";

  getEmbedUrl(id: string, _options?: EmbedOptions): string {
    void _options;
    return `https://www.tiktok.com/player/v1/${id}`;
  }

  parseSourceUrl(url: string): ParsedEmbed | null {
    const trimmed = url.trim();
    const playerMatch = /tiktok\.com\/player\/v1\/(\d+)/.exec(trimmed);
    if (playerMatch) return { id: playerMatch[1]!, provider: this.name };
    const vmMatch = /(?:vm|vt)\.tiktok\.com\/([\w-]+)/.exec(trimmed);
    if (vmMatch) return { id: vmMatch[1]!, provider: this.name };
    const videoMatch = /tiktok\.com\/@[\w.-]+\/video\/(\d+)/.exec(trimmed);
    if (videoMatch) return { id: videoMatch[1]!, provider: this.name };
    const embedMatch = /tiktok\.com\/embed\/v2\/(\d+)/.exec(trimmed);
    if (embedMatch) return { id: embedMatch[1]!, provider: this.name };
    return null;
  }
}
