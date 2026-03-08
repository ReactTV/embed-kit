import type { IEmbedPlayer, IEmbedProvider } from "../_base/index.js";
import { REGEX_EMBED, REGEX_PLAYER, REGEX_VIDEO, REGEX_VM } from "./constants.js";
import { createPlayer as createTikTokPlayer } from "./player.js";

export class TikTokEmbed implements IEmbedProvider {
  readonly name = "tiktok";

  #player: IEmbedPlayer | null = null;

  getEmbedUrl(id: string, _options?: Record<string, unknown>): string {
    void _options;
    return `https://www.tiktok.com/player/v1/${id}`;
  }

  async createPlayer(
    container: HTMLElement,
    id: string,
    options?: Record<string, unknown>
  ): Promise<IEmbedPlayer> {
    const player = await createTikTokPlayer(container, id, options);
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

  seek(seconds: number): void {
    this.#player?.seek(seconds);
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

  get volume(): number | undefined {
    return this.#player?.volume;
  }

  setVolume(volume: number): void | Promise<void> {
    return this.#player?.setVolume?.(volume);
  }

  parseSourceUrl(url: string) {
    const trimmed = url.trim();
    const playerMatch = REGEX_PLAYER.exec(trimmed);
    if (playerMatch) return { id: playerMatch[1]!, provider: this.name };
    const vmMatch = REGEX_VM.exec(trimmed);
    if (vmMatch) return { id: vmMatch[1]!, provider: this.name };
    const videoMatch = REGEX_VIDEO.exec(trimmed);
    if (videoMatch) return { id: videoMatch[1]!, provider: this.name };
    const embedMatch = REGEX_EMBED.exec(trimmed);
    if (embedMatch) return { id: embedMatch[1]!, provider: this.name };
    return null;
  }
}
