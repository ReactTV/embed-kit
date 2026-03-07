import type { EmbedOptions, EmbedProvider, ParsedEmbed } from "../_base/index.js";

export class YouTubeEmbed implements EmbedProvider {
  readonly name = "youtube";

  getEmbedUrl(id: string, _options?: EmbedOptions): string {
    // TODO: build YouTube embed URL (e.g. youtube.com/embed/:id)
    void _options;
    return `https://www.youtube.com/embed/${id}`;
  }

  parseSourceUrl(url: string): ParsedEmbed | null {
    const trimmed = url.trim();
    const watchMatch = /(?:youtube\.com\/watch\?.*\bv=)([a-zA-Z0-9_-]{11})/.exec(trimmed);
    if (watchMatch) return { id: watchMatch[1]!, provider: this.name };
    const shortMatch = /youtu\.be\/([a-zA-Z0-9_-]{11})/.exec(trimmed);
    if (shortMatch) return { id: shortMatch[1]!, provider: this.name };
    const embedMatch = /youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/.exec(trimmed);
    if (embedMatch) return { id: embedMatch[1]!, provider: this.name };
    return null;
  }
}
