import type { EmbedOptions, EmbedProvider, ParsedEmbed } from "../_base/index.js";

export class TikTokEmbed implements EmbedProvider {
  readonly name = "tiktok";

  getEmbedUrl(id: string, _options?: EmbedOptions): string {
    // TODO: build TikTok embed URL
    void _options;
    return `https://www.tiktok.com/embed/v2/${id}`;
  }

  parseSourceUrl(url: string): ParsedEmbed | null {
    // TODO: parse tiktok.com/@user/video/..., vm.tiktok.com/..., etc.
    void url;
    return null;
  }
}
