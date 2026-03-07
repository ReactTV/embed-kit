import type { EmbedOptions, EmbedProvider, ParsedEmbed } from "../_base/index.js";

export class TwitchEmbed implements EmbedProvider {
  readonly name = "twitch";

  getEmbedUrl(id: string, _options?: EmbedOptions): string {
    // TODO: build Twitch embed URL (video or clip)
    void _options;
    return `https://player.twitch.tv/?video=${id}`;
  }

  parseSourceUrl(url: string): ParsedEmbed | null {
    // TODO: parse twitch.tv/videos/..., twitch.tv/.../clip/..., etc.
    void url;
    return null;
  }
}
