import type { EmbedPlayer } from "./player.js";

/**
 * Shared contract for embed providers.
 * Each provider (YouTube, Twitch, etc.) implements this interface.
 */

export interface EmbedOptions {
  [key: string]: unknown;
}

export interface ParsedEmbed {
  id: string;
  provider: string;
  /** Optional provider-specific data (e.g. Twitch clip vs video). Passed through to getEmbedUrl. */
  options?: EmbedOptions;
}

export interface EmbedProvider {
  readonly name: string;

  /** Build the embed URL for the given media ID and options. */
  getEmbedUrl(id: string, options?: EmbedOptions): string;

  /** Parse a source URL and return provider id + provider name if recognized. */
  parseSourceUrl(url: string): ParsedEmbed | null;

  /**
   * Create a controllable player in the given container (optional).
   * Providers that support play/pause implement this; others omit it.
   */
  createPlayer?(
    container: HTMLElement,
    id: string,
    options?: EmbedOptions
  ): Promise<EmbedPlayer>;

  /** Start playback (optional; delegates to the active player from createPlayer). */
  play?(): void | Promise<void>;

  /** Pause playback (optional; delegates to the active player from createPlayer). */
  pause?(): void | Promise<void>;

  /** Resolves to true if paused, false if playing (optional; delegates to the active player). */
  readonly paused?: Promise<boolean>;

  /** Resolves to current playback time in seconds (optional; delegates to the active player). */
  readonly currentTime?: Promise<number>;

  /** Seek to the given time in seconds (optional; delegates to the active player). */
  seek?(seconds: number): void | Promise<void>;

  /** Resolves to true if autoplay was requested (optional; delegates to the active player). */
  readonly autoplay?: Promise<boolean>;
}

/** Provider that supports the normalized play/pause API. */
export type ControllableEmbedProvider = EmbedProvider & {
  createPlayer(
    container: HTMLElement,
    id: string,
    options?: EmbedOptions
  ): Promise<EmbedPlayer>;
  play(): void | Promise<void>;
  pause(): void | Promise<void>;
  readonly paused: Promise<boolean>;
  readonly currentTime: Promise<number>;
  seek(seconds: number): void | Promise<void>;
  readonly autoplay: Promise<boolean>;
};
