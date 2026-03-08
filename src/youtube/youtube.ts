import type { EmbedOptions, EmbedPlayer, EmbedProvider, ParsedEmbed } from "../_base/index.js";
import { createPlayer as createYouTubePlayer } from "./player.js";

export class YouTubeEmbed implements EmbedProvider {
  readonly name = "youtube";

  #player: EmbedPlayer | null = null;

  getEmbedUrl(id: string, _options?: EmbedOptions): string {
    void _options;
    return `https://www.youtube.com/embed/${id}`;
  }

  async createPlayer(
    container: HTMLElement,
    id: string,
    options?: EmbedOptions
  ): Promise<EmbedPlayer> {
    const player = await createYouTubePlayer(container, id, options as { width?: string | number; height?: string | number });
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
    const watchMatch = /(?:youtube\.com\/watch\?.*\bv=)([a-zA-Z0-9_-]{11})/.exec(trimmed);
    if (watchMatch) return { id: watchMatch[1]!, provider: this.name };
    const shortMatch = /youtu\.be\/([a-zA-Z0-9_-]{11})/.exec(trimmed);
    if (shortMatch) return { id: shortMatch[1]!, provider: this.name };
    const embedMatch = /youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/.exec(trimmed);
    if (embedMatch) return { id: embedMatch[1]!, provider: this.name };
    return null;
  }
}
