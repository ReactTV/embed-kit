import type { IEmbedPlayer, IErrorData, TCreatePlayer } from "./player.js";

const DEFAULT_WIDTH = 560;
const DEFAULT_HEIGHT = 315;

/**
 * Provider contract: URL building and player creation.
 * Each embed (YouTube, Twitch, etc.) implements this.
 */

export interface IEmbedProvider {
  readonly name: string;
  getEmbedUrl(id: string, options?: Record<string, unknown>): string;
  parseSourceUrl(url: string): { id: string; provider: string; options?: Record<string, unknown> } | null;
  createPlayer: TCreatePlayer;
}


/**
 * Creates a custom element class that mounts the provider's player and exposes
 * play(), pause(), paused, currentTime, duration, seek(), mute(), unmute(), muted, lastError.
 */
/** Callback props that consumers may set on the element (e.g. via ref). */
interface EmbedElementCallbacks {
  onReady?: () => void;
  onPlay?: () => void;
  onPause?: () => void;
  onBuffering?: () => void;
  onEnded?: () => void;
  onProgress?: (currentTime: number) => void;
  onSeeking?: () => void;
  onSeek?: (currentTime: number) => void;
  onMute?: (data: { muted: boolean }) => void;
  onError?: (data: IErrorData) => void;
}

export function createEmbedElement(provider: IEmbedProvider): CustomElementConstructor {
  return class extends HTMLElement implements EmbedElementCallbacks {
    declare onReady?: () => void;
    declare onPlay?: () => void;
    declare onPause?: () => void;
    declare onBuffering?: () => void;
    declare onEnded?: () => void;
    declare onProgress?: (currentTime: number) => void;
    declare onSeeking?: () => void;
    declare onSeek?: (currentTime: number) => void;
    declare onMute?: (data: { muted: boolean }) => void;
    declare onError?: (data: IErrorData) => void;

    static get observedAttributes(): string[] {
      return ["src", "video-id", "width", "height", "title", "autoplay", "volume"];
    }

    #playerPromise: Promise<IEmbedPlayer> | null = null;
    #player: IEmbedPlayer | null = null;
    #container: HTMLElement | null = null;
    #lastError: IErrorData | null = null;

    /** Resolves to the current player, or null if no video/id or not yet created. */
    get player(): Promise<IEmbedPlayer | null> {
      if (this.#player) return Promise.resolve(this.#player);
      if (this.#playerPromise) return this.#playerPromise;
      return Promise.resolve(null);
    }

    connectedCallback(): void {
      this.#render();
    }

    attributeChangedCallback(): void {
      this.#render();
    }

    async play(): Promise<void> {
      (await this.player)?.play();
    }

    async pause(): Promise<void> {
      (await this.player)?.pause();
    }

    get paused(): Promise<boolean> {
      return this.player.then((p) => p?.paused ?? Promise.resolve(true));
    }

    get currentTime(): Promise<number> {
      return this.player.then((p) => p?.currentTime ?? Promise.resolve(0));
    }

    get duration(): Promise<number> {
      return this.player.then((p) => p?.duration ?? Promise.resolve(0));
    }

    async seek(seconds: number): Promise<void> {
      (await this.player)?.seek(seconds);
    }

    async mute(): Promise<void> {
      (await this.player)?.mute();
    }

    async unmute(): Promise<void> {
      (await this.player)?.unmute();
    }

    get muted(): Promise<boolean> {
      return this.player.then((p) => p?.muted ?? Promise.resolve(false));
    }

    /** Volume 0–1 when supported by the provider. */
    get volume(): Promise<number | undefined> {
      return this.player.then((p) => p?.volume);
    }

    async setVolume(volume: number): Promise<void> {
      (await this.player)?.setVolume?.(volume);
    }

    /** Last error from the player, if any. Cleared when the embed is recreated (e.g. video-id change). */
    get lastError(): IErrorData | null {
      return this.#lastError;
    }

    #render(): void {
      const srcAttr = this.getAttribute("src");
      const idAttr = this.getAttribute("video-id");

      let id: string | null = null;
      let options: Record<string, unknown> | undefined;

      if (srcAttr) {
        const parsed = provider.parseSourceUrl(srcAttr);
        if (parsed) {
          id = parsed.id;
          options = parsed.options;
        }
      } else if (idAttr) {
        id = idAttr;
      }

      if (!id) {
        if (this.#container?.parentNode) this.#container.remove();
        this.#container = null;
        this.#playerPromise = null;
        this.#player = null;
        this.#lastError = null;
        return;
      }

      const width =
        parseInt(this.getAttribute("width") ?? String(DEFAULT_WIDTH), 10) || DEFAULT_WIDTH;
      const height =
        parseInt(this.getAttribute("height") ?? String(DEFAULT_HEIGHT), 10) || DEFAULT_HEIGHT;

      this.style.display = "block";
      this.style.width = `${width}px`;
      this.style.height = `${height}px`;

      // Only mount and create the player when the element is in the document.
      // Otherwise (e.g. attributes set before appendChild), the iframe is never
      // in the DOM and providers like Vimeo never fire ready().
      if (!this.isConnected) {
        if (this.#container?.parentNode) this.#container.remove();
        this.#container = null;
        this.#playerPromise = null;
        this.#player = null;
        this.#lastError = null;
        return;
      }

      if (this.#container?.parentNode) {
        this.#container.remove();
      }
      this.#player = null;
      this.#playerPromise = null;
      this.#lastError = null;

      const container = document.createElement("div");
      container.style.display = "block";
      container.style.width = `${width}px`;
      container.style.height = `${height}px`;
      container.style.minWidth = `${width}px`;
      container.style.minHeight = `${height}px`;
      container.style.overflow = "hidden";
      this.appendChild(container);
      this.#container = container;

      const autoplayAttr = this.getAttribute("autoplay");
      const autoplay = autoplayAttr !== null && autoplayAttr !== "false";
      const volumeAttr = this.getAttribute("volume");
      const volume = volumeAttr !== null ? parseFloat(volumeAttr) : undefined;
      const noop = (): void => {};
      const userOnError = this.onError ?? noop;
      this.#playerPromise = provider.createPlayer(container, id, {
        width,
        height,
        autoplay,
        ...(typeof volume === "number" && !Number.isNaN(volume) && { volume }),
        onReady: this.onReady ?? noop,
        onPlay: this.onPlay ?? noop,
        onPause: this.onPause ?? noop,
        onBuffering: this.onBuffering ?? noop,
        onEnded: this.onEnded ?? noop,
        onProgress: this.onProgress ?? noop,
        onSeeking: this.onSeeking ?? noop,
        onSeek: this.onSeek ?? noop,
        onMute: this.onMute ?? noop,
        onError: (data: IErrorData) => {
          this.#lastError = data;
          userOnError(data);
        },
        ...options,
      }).then((player) => {
        this.#player = player;
        return player;
      });
    }
  };
}
