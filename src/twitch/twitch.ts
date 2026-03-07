import type { EmbedOptions, EmbedProvider, ParsedEmbed } from "../_base/index.js";

export class TwitchEmbed implements EmbedProvider {
  readonly name = "twitch";

  getEmbedUrl(id: string, options?: EmbedOptions): string {
    const isClip = options?.twitchType === "clip";
    const param = isClip ? "clip" : "video";
    return `https://player.twitch.tv/?${param}=${id}`;
  }

  parseSourceUrl(url: string): ParsedEmbed | null {
    const trimmed = url.trim();
    const videoMatch = /twitch\.tv\/videos\/(\d+)/.exec(trimmed);
    if (videoMatch) return { id: videoMatch[1]!, provider: this.name };
    const clipMatch = /twitch\.tv\/(?:[\w-]+\/)?clip\/([\w-]+)/.exec(trimmed);
    if (clipMatch) return { id: clipMatch[1]!, provider: this.name, options: { twitchType: "clip" } };
    return null;
  }
}
