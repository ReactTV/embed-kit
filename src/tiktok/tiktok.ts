import type { EmbedOptions, EmbedPlayer, EmbedProvider, ParsedEmbed } from "../_base/index.js";
import { createPlayer as createTikTokPlayer } from "./player.js";

export class TikTokEmbed implements EmbedProvider {
  readonly name = "tiktok";

  #player: EmbedPlayer | null = null;

  getEmbedUrl(id: string, _options?: EmbedOptions): string {
    void _options;
    return `https://www.tiktok.com/player/v1/${id}`;
  }

  async createPlayer(
    container: HTMLElement,
    id: string,
    options?: EmbedOptions
  ): Promise<EmbedPlayer> {
    const player = await createTikTokPlayer(container, id, options as { width?: string | number; height?: string | number });
    this.#player = player;
    return player;
  }

  play(): void {
    this.#player?.play();
  }

  pause(): void {
    this.#player?.pause();
  }

  get ready(): Promise<void> {
    return this.#player?.ready ?? new Promise<void>(() => {});
  }

  get paused(): Promise<boolean> {
    return this.#player?.paused ?? Promise.resolve(true);
  }

  get currentTime(): Promise<number> {
    return this.#player?.currentTime ?? Promise.resolve(0);
  }

  seek(seconds: number): void {
    this.#player?.seek(seconds);
  }

  get autoplay(): Promise<boolean> {
    return this.#player?.autoplay ?? Promise.resolve(false);
  }

  parseSourceUrl(url: string): ParsedEmbed | null {
    const trimmed = url.trim();
    const playerMatch = /tiktok\.com\/player\/v1\/(\d+)/.exec(trimmed);
    if (playerMatch) return { id: playerMatch[1]!, provider: this.name };
    const vmMatch = /(?:vm|vt)\.tiktok\.com\/([\w-]+)/.exec(trimmed);
    if (vmMatch) return { id: vmMatch[1]!, provider: this.name };
    const videoMatch = /tiktok\.com\/@[\w.-]+\/video\/(\d+)/.exec(trimmed);
    if (videoMatch) return { id: videoMatch[1]!, provider: this.name };
    const embedMatch = /tiktok\.com\/embed\/v2\/(\d+)/.exec(trimmed);
    if (embedMatch) return { id: embedMatch[1]!, provider: this.name };
    return null;
  }
}
