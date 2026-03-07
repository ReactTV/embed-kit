import type { EmbedOptions, EmbedProvider, ParsedEmbed } from "../_base/index.js";

export class DailymotionEmbed implements EmbedProvider {
  readonly name = "dailymotion";

  getEmbedUrl(id: string, _options?: EmbedOptions): string {
    // TODO: build Dailymotion embed URL
    void _options;
    return `https://www.dailymotion.com/embed/video/${id}`;
  }

  parseSourceUrl(url: string): ParsedEmbed | null {
    // TODO: parse dailymotion.com/video/..., dai.ly/..., etc.
    void url;
    return null;
  }
}
