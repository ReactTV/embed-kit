import type { EmbedOptions, EmbedProvider, ParsedEmbed } from "../_base/index.js";

export class DailymotionEmbed implements EmbedProvider {
  readonly name = "dailymotion";

  getEmbedUrl(id: string, _options?: EmbedOptions): string {
    // TODO: build Dailymotion embed URL
    void _options;
    return `https://www.dailymotion.com/embed/video/${id}`;
  }

  parseSourceUrl(url: string): ParsedEmbed | null {
    const trimmed = url.trim();
    const videoMatch = /dailymotion\.com\/video\/([a-zA-Z0-9]+)/.exec(trimmed);
    if (videoMatch) return { id: videoMatch[1]!, provider: this.name };
    const shortMatch = /dai\.ly\/([a-zA-Z0-9]+)/.exec(trimmed);
    if (shortMatch) return { id: shortMatch[1]!, provider: this.name };
    const embedMatch = /dailymotion\.com\/embed\/video\/([a-zA-Z0-9]+)/.exec(trimmed);
    if (embedMatch) return { id: embedMatch[1]!, provider: this.name };
    return null;
  }
}
