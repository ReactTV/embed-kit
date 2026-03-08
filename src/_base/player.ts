/**
 * Normalized embed player API (play, pause, paused, currentTime, seek, autoplay, mute, unmute, muted).
 * Each provider that supports playback control implements this interface.
 */

export interface EmbedPlayer {
  /** Resolves when the player is ready for playback control (e.g. after embed has loaded). */
  readonly ready: Promise<void>;

  /** Start playback. */
  play(): void | Promise<void>;

  /** Pause playback. */
  pause(): void | Promise<void>;

  /** Resolves to true if playback is paused, false if playing. */
  readonly paused: Promise<boolean>;

  /** Resolves to current playback time in seconds. Unsupported providers may return 0. */
  readonly currentTime: Promise<number>;

  /** Resolves to total duration in seconds. Unsupported providers may return 0. */
  readonly duration: Promise<number>;

  /** Seek to the given time in seconds. Unsupported providers may no-op. */
  seek(seconds: number): void | Promise<void>;

  /** Resolves to true if autoplay was requested when creating the player. */
  readonly autoplay: Promise<boolean>;

  /** Mute audio. Unsupported providers may no-op. */
  mute(): void | Promise<void>;

  /** Unmute audio. Unsupported providers may no-op. */
  unmute(): void | Promise<void>;

  /** Resolves to true if audio is muted, false otherwise. Unsupported providers may return false. */
  readonly muted: Promise<boolean>;

  /** Optional: clean up player and listeners. */
  destroy?(): void | Promise<void>;
}

export interface CreatePlayerOptions {
  width?: string | number;
  height?: string | number;
  /** When true, the embed will start playing automatically when loaded (if supported). */
  autoplay?: boolean;
  /** Called when playback reaches the end of the media. */
  onEnded?: () => void;
  [key: string]: unknown;
}
