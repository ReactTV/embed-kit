import type { IEmbedPlayer, IEmbedProvider } from "../_base/index.js";
import {
  REGEX_CHANNELS,
  REGEX_DIRECT,
  REGEX_GROUPS,
  REGEX_HASH,
  REGEX_PLAYER,
} from "./constants.js";
import { createPlayer as createVimeoPlayer } from "./player.js";

export class VimeoEmbed implements IEmbedProvider {
  readonly name = "vimeo";

  #player: IEmbedPlayer | null = null;

  getEmbedUrl(id: string, options?: Record<string, unknown>): string {
    const base = `https://player.vimeo.com/video/${id}`;
    const hash = options?.vimeoHash as string | undefined;
    if (hash) return `${base}?h=${encodeURIComponent(hash)}`;
    return base;
  }

  async createPlayer(
    container: HTMLElement,
    id: string,
    options?: Record<string, unknown>
  ): Promise<IEmbedPlayer> {
    const player = await createVimeoPlayer(container, id, options);
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

  mute(): void | Promise<void> {
    return this.#player?.mute();
  }

  unmute(): void | Promise<void> {
    return this.#player?.unmute();
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
    if (playerMatch) {
      const id = playerMatch[1]!;
      const hashMatch = REGEX_HASH.exec(trimmed);
      return hashMatch
        ? { id, provider: this.name, options: { vimeoHash: decodeURIComponent(hashMatch[1]!) } }
        : { id, provider: this.name };
    }
    const directMatch = REGEX_DIRECT.exec(trimmed);
    if (directMatch) {
      const id = directMatch[1]!;
      const hashMatch = REGEX_HASH.exec(trimmed);
      return hashMatch
        ? { id, provider: this.name, options: { vimeoHash: decodeURIComponent(hashMatch[1]!) } }
        : { id, provider: this.name };
    }
    const channelsMatch = REGEX_CHANNELS.exec(trimmed);
    if (channelsMatch) return { id: channelsMatch[1]!, provider: this.name };
    const groupsMatch = REGEX_GROUPS.exec(trimmed);
    if (groupsMatch) return { id: groupsMatch[1]!, provider: this.name };
    return null;
  }
}
