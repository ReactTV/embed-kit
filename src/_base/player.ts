/**
 * Normalized embed player API (play, pause, getPaused).
 * Each provider that supports playback control implements this interface.
 */

export interface EmbedPlayer {
  /** Start playback. */
  play(): void | Promise<void>;

  /** Pause playback. */
  pause(): void | Promise<void>;

  /** Resolves to true if playback is paused, false if playing. */
  getPaused(): Promise<boolean>;

  /** Optional: clean up player and listeners. */
  destroy?(): void | Promise<void>;
}

export interface CreatePlayerOptions {
  width?: string | number;
  height?: string | number;
  [key: string]: unknown;
}
