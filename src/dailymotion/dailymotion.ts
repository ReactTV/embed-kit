import type { EmbedOptions, EmbedPlayer, EmbedProvider, ParsedEmbed } from "../_base/index.js";
import { createPlayer as createDailymotionPlayer } from "./player.js";

export class DailymotionEmbed implements EmbedProvider {
  readonly name = "dailymotion";

  #player: EmbedPlayer | null = null;

  getEmbedUrl(id: string, _options?: EmbedOptions): string {
    void _options;
    return `https://www.dailymotion.com/embed/video/${id}`;
  }

  async createPlayer(
    container: HTMLElement,
    id: string,
    options?: EmbedOptions
  ): Promise<EmbedPlayer> {
    const player = await createDailymotionPlayer(container, id, options as { width?: string | number; height?: string | number });
    this.#player = player;
    return player;
  }

  play(): void {
    this.#player?.play();
  }

  pause(): void {
    this.#player?.pause();
  }

  getPaused(): Promise<boolean> {
    return this.#player?.getPaused() ?? Promise.resolve(true);
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
