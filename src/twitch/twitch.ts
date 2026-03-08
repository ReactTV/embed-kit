import type { IEmbedPlayer, IEmbedProvider } from "../_base/index.js";
import {
  REGEX_CHANNEL,
  REGEX_CLIP,
  REGEX_CLIPS_HOST,
  REGEX_VIDEO,
} from "./constants.js";
import { createPlayer as createTwitchPlayer } from "./player.js";

export class TwitchEmbed implements IEmbedProvider {
  readonly name = "twitch";

  #player: IEmbedPlayer | null = null;

  getEmbedUrl(id: string, options?: Record<string, unknown>): string {
    const twitchType = options?.twitchType as string | undefined;
    const isClip = twitchType === "clip";
    const isChannel = twitchType === "channel";
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
    if (isChannel) {
      return `https://player.twitch.tv/?channel=${encodeURIComponent(id)}&${parentParam}`;
    }
    return `https://player.twitch.tv/?video=${id}&${parentParam}`;
  }

  async createPlayer(
    container: HTMLElement,
    id: string,
    options?: Record<string, unknown>
  ): Promise<IEmbedPlayer> {
    const player = await createTwitchPlayer(container, id, options);
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
    const videoMatch = REGEX_VIDEO.exec(trimmed);
    if (videoMatch) return { id: videoMatch[1]!, provider: this.name };
    const clipsHostMatch = REGEX_CLIPS_HOST.exec(trimmed);
    if (clipsHostMatch) return { id: clipsHostMatch[1]!, provider: this.name, options: { twitchType: "clip" } };
    const clipMatch = REGEX_CLIP.exec(trimmed);
    if (clipMatch) return { id: clipMatch[1]!, provider: this.name, options: { twitchType: "clip" } };
    const channelMatch = REGEX_CHANNEL.exec(trimmed);
    if (channelMatch) return { id: channelMatch[1]!, provider: this.name, options: { twitchType: "channel" } };
    return null;
  }
}
