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

/** Normalized progress payload: current playback time and optional duration (seconds). */
export interface ProgressData {
  /** Current playback position in seconds. */
  currentTime: number;
  /** Total duration in seconds when known. Unsupported providers may omit. */
  duration?: number;
}

export interface CreatePlayerOptions {
  width?: string | number;
  height?: string | number;
  /** When true, the embed will start playing automatically when loaded (if supported). */
  autoplay?: boolean;
  /** Called when the player is ready for playback control (same moment the ready promise resolves). */
  onReady?: () => void;
  /** Called when playback reaches the end of the media. */
  onEnded?: () => void;
  /** Called during playback with current time (and duration when available). Unsupported providers may not call. */
  onProgress?: (data: ProgressData) => void;
  /** Called when the mute state changes (e.g. after mute() or unmute(), or when the user toggles mute in the embed). */
  onMute?: (data: MuteData) => void;
  [key: string]: unknown;
}

/** Normalized mute payload: current muted state. */
export interface MuteData {
  /** True if audio is muted, false if unmuted. */
  muted: boolean;
}
