import type { IEmbedPlayer, IEmbedProvider } from "../_base/index.js";
import { REGEX_EMBED, REGEX_SHORT, REGEX_WATCH } from "./constants.js";
import { createPlayer as createYouTubePlayer } from "./player.js";

export class YouTubeEmbed implements IEmbedProvider {
  readonly name = "youtube";

  #player: IEmbedPlayer | null = null;

  getEmbedUrl(id: string, _options?: Record<string, unknown>): string {
    void _options;
    return `https://www.youtube.com/embed/${id}`;
  }

  async createPlayer(
    container: HTMLElement,
    id: string,
    options?: Record<string, unknown>
  ): Promise<IEmbedPlayer> {
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

  mute(): void {
    this.#player?.mute();
  }

  unmute(): void {
    this.#player?.unmute();
  }

  get muted(): Promise<boolean> {
    return this.#player?.muted ?? Promise.resolve(false);
  }

  parseSourceUrl(url: string) {
    const trimmed = url.trim();
    const watchMatch = REGEX_WATCH.exec(trimmed);
    if (watchMatch) return { id: watchMatch[1]!, provider: this.name };
    const shortMatch = REGEX_SHORT.exec(trimmed);
    if (shortMatch) return { id: shortMatch[1]!, provider: this.name };
    const embedMatch = REGEX_EMBED.exec(trimmed);
    if (embedMatch) return { id: embedMatch[1]!, provider: this.name };
    return null;
  }
}
