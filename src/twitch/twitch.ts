import type { EmbedOptions, EmbedPlayer, EmbedProvider, ParsedEmbed } from "../_base/index.js";
import { createPlayer as createTwitchPlayer } from "./player.js";

export class TwitchEmbed implements EmbedProvider {
  readonly name = "twitch";

  #player: EmbedPlayer | null = null;

  getEmbedUrl(id: string, options?: EmbedOptions): string {
    const isClip = options?.twitchType === "clip";
    const param = isClip ? "clip" : "video";
    return `https://player.twitch.tv/?${param}=${id}`;
  }

  async createPlayer(
    container: HTMLElement,
    id: string,
    options?: EmbedOptions
  ): Promise<EmbedPlayer> {
    const player = await createTwitchPlayer(container, id, options as { width?: string | number; height?: string | number });
    this.#player = player;
    return player;
  }

  play(): void {
    this.#player?.play();
  }

  pause(): void {
    this.#player?.pause();
  }

  get paused(): Promise<boolean> {
    return this.#player?.paused ?? Promise.resolve(true);
  }

  get currentTime(): Promise<number> {
    return this.#player?.currentTime ?? Promise.resolve(0);
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
