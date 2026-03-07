import type { EmbedOptions, EmbedProvider, ParsedEmbed } from "../_base/index.js";

export class InternetArchiveEmbed implements EmbedProvider {
  readonly name = "internet-archive";

  getEmbedUrl(id: string, _options?: EmbedOptions): string {
    // TODO: build Internet Archive embed URL (archive.org embed)
    void _options;
    return `https://archive.org/embed/${id}`;
  }

  parseSourceUrl(url: string): ParsedEmbed | null {
    // TODO: parse archive.org/details/..., archive.org/embed/..., etc.
    void url;
    return null;
  }
}
