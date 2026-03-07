import type { EmbedOptions, EmbedProvider, ParsedEmbed } from "../_base/index.js";

export class InternetArchiveEmbed implements EmbedProvider {
  readonly name = "internet-archive";

  getEmbedUrl(id: string, _options?: EmbedOptions): string {
    // TODO: build Internet Archive embed URL (archive.org embed)
    void _options;
    return `https://archive.org/embed/${id}`;
  }

  parseSourceUrl(url: string): ParsedEmbed | null {
    const trimmed = url.trim();
    const detailsMatch = /archive\.org\/details\/([^/?#]+)/.exec(trimmed);
    if (detailsMatch) return { id: detailsMatch[1]!, provider: this.name };
    const embedMatch = /archive\.org\/embed\/([^/?#]+)/.exec(trimmed);
    if (embedMatch) return { id: embedMatch[1]!, provider: this.name };
    return null;
  }
}
