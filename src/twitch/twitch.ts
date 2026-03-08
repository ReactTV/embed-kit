import type { EmbedOptions, EmbedPlayer, EmbedProvider, ParsedEmbed } from "../_base/index.js";
import { createPlayer as createTwitchPlayer } from "./player.js";

export class TwitchEmbed implements EmbedProvider {
  readonly name = "twitch";

  #player: EmbedPlayer | null = null;

  getEmbedUrl(id: string, options?: EmbedOptions): string {
    const isClip = options?.twitchType === "clip";
    const parent =
      (options?.twitchParent as string) ??
      (options?.parent as string) ??
      (typeof window !== "undefined" && window.location?.hostname) ??
      "localhost";
    const parentParam =
      parent === "localhost" || parent === "127.0.0.1"
        ? "parent=localhost&parent=127.0.0.1"
        : `parent=${encodeURIComponent(parent)}`;
    if (isClip) {
      return `https://clips.twitch.tv/embed?clip=${encodeURIComponent(id)}&${parentParam}`;
    }
    return `https://player.twitch.tv/?video=${id}&parent=${encodeURIComponent(parent)}`;
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

  parseSourceUrl(url: string): ParsedEmbed | null {
    const trimmed = url.trim();
    const videoMatch = /twitch\.tv\/videos\/(\d+)/.exec(trimmed);
    if (videoMatch) return { id: videoMatch[1]!, provider: this.name };
    const clipsHostMatch = /clips\.twitch\.tv\/([\w-]+)/.exec(trimmed);
    if (clipsHostMatch) return { id: clipsHostMatch[1]!, provider: this.name, options: { twitchType: "clip" } };
    const clipMatch = /twitch\.tv\/(?:[\w-]+\/)?clip\/([\w-]+)/.exec(trimmed);
    if (clipMatch) return { id: clipMatch[1]!, provider: this.name, options: { twitchType: "clip" } };
    return null;
  }
}
