import type { EmbedOptions, EmbedProvider, ParsedEmbed } from "../_base/index.js";

export class TikTokEmbed implements EmbedProvider {
  readonly name = "tiktok";

  getEmbedUrl(id: string, _options?: EmbedOptions): string {
    // TODO: build TikTok embed URL
    void _options;
    return `https://www.tiktok.com/embed/v2/${id}`;
  }

  parseSourceUrl(url: string): ParsedEmbed | null {
    const trimmed = url.trim();
    const vmMatch = /(?:vm|vt)\.tiktok\.com\/([\w-]+)/.exec(trimmed);
    if (vmMatch) return { id: vmMatch[1]!, provider: this.name };
    const videoMatch = /tiktok\.com\/@[\w.-]+\/video\/(\d+)/.exec(trimmed);
    if (videoMatch) return { id: videoMatch[1]!, provider: this.name };
    const embedMatch = /tiktok\.com\/embed\/v2\/(\d+)/.exec(trimmed);
    if (embedMatch) return { id: embedMatch[1]!, provider: this.name };
    return null;
  }
}
