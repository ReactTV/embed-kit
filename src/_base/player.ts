/**
 * Normalized embed player API (play, pause, paused, currentTime, seek).
 * Each provider that supports playback control implements this interface.
 */

export interface EmbedPlayer {
  /** Start playback. */
  play(): void | Promise<void>;

  /** Pause playback. */
  pause(): void | Promise<void>;

  /** Resolves to true if playback is paused, false if playing. */
  readonly paused: Promise<boolean>;

  /** Resolves to current playback time in seconds. Unsupported providers may return 0. */
  readonly currentTime: Promise<number>;

  /** Seek to the given time in seconds. Unsupported providers may no-op. */
  seek(seconds: number): void | Promise<void>;

  /** Optional: clean up player and listeners. */
  destroy?(): void | Promise<void>;
}

export interface CreatePlayerOptions {
  width?: string | number;
  height?: string | number;
  [key: string]: unknown;
}
