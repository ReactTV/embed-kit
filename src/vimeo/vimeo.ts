import type { EmbedOptions, EmbedPlayer, EmbedProvider, ParsedEmbed } from "../_base/index.js";
import { createPlayer as createVimeoPlayer } from "./player.js";

export class VimeoEmbed implements EmbedProvider {
  readonly name = "vimeo";

  #player: EmbedPlayer | null = null;

  getEmbedUrl(id: string, options?: EmbedOptions): string {
    const base = `https://player.vimeo.com/video/${id}`;
    const hash = options?.vimeoHash as string | undefined;
    if (hash) return `${base}?h=${encodeURIComponent(hash)}`;
    return base;
  }

  async createPlayer(
    container: HTMLElement,
    id: string,
    options?: EmbedOptions
  ): Promise<EmbedPlayer> {
    const player = await createVimeoPlayer(container, id, options as { width?: string | number; height?: string | number });
    this.#player = player;
    return player;
  }

  play(): void | Promise<void> {
    return this.#player?.play();
  }

  pause(): void | Promise<void> {
    return this.#player?.pause();
  }

  get paused(): Promise<boolean> {
    return this.#player?.paused ?? Promise.resolve(true);
  }

  get currentTime(): Promise<number> {
    return this.#player?.currentTime ?? Promise.resolve(0);
  }

  seek(seconds: number): void | Promise<void> {
    return this.#player?.seek(seconds);
  }

  parseSourceUrl(url: string): ParsedEmbed | null {
    const trimmed = url.trim();
    const playerMatch = /player\.vimeo\.com\/video\/(\d+)/.exec(trimmed);
    if (playerMatch) {
      const id = playerMatch[1]!;
      const hashMatch = /[?&]h=([^&]+)/.exec(trimmed);
      return hashMatch
        ? { id, provider: this.name, options: { vimeoHash: decodeURIComponent(hashMatch[1]!) } }
        : { id, provider: this.name };
    }
    const directMatch = /vimeo\.com\/(\d+)(?:\/|$|\?)/.exec(trimmed);
    if (directMatch) {
      const id = directMatch[1]!;
      const hashMatch = /[?&]h=([^&]+)/.exec(trimmed);
      return hashMatch
        ? { id, provider: this.name, options: { vimeoHash: decodeURIComponent(hashMatch[1]!) } }
        : { id, provider: this.name };
    }
    const channelsMatch = /vimeo\.com\/channels\/[\w-]+\/(\d+)/.exec(trimmed);
    if (channelsMatch) return { id: channelsMatch[1]!, provider: this.name };
    const groupsMatch = /vimeo\.com\/groups\/[\w-]+\/videos\/(\d+)/.exec(trimmed);
    if (groupsMatch) return { id: groupsMatch[1]!, provider: this.name };
    return null;
  }
}
