import type { EmbedOptions, EmbedProvider, ParsedEmbed } from "../base.js";

export class YouTubeEmbed implements EmbedProvider {
  readonly name = "youtube";

  getEmbedUrl(id: string, _options?: EmbedOptions): string {
    // TODO: build YouTube embed URL (e.g. youtube.com/embed/:id)
    void _options;
    return `https://www.youtube.com/embed/${id}`;
  }

  parseSourceUrl(url: string): ParsedEmbed | null {
    // TODO: parse youtube.com/watch?v=..., youtu.be/..., etc.
    void url;
    return null;
  }
}
