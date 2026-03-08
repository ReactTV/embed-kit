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
 * play(), pause(), paused, currentTime, duration, seek(), mute(), unmute(), muted, ready, lastError.
 */
export function createEmbedElement(provider: IEmbedProvider): CustomElementConstructor {
  return class extends HTMLElement {
    static get observedAttributes(): string[] {
      return ["src", "video-id", "width", "height", "title", "autoplay"];
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

    /** Resolves when the embed player is ready for playback control. */
    get ready(): Promise<void> {
      return this.player.then((p) => p?.ready ?? new Promise<void>(() => {}));
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
      const onMute = (this as unknown as { onMute?: (data: { muted: boolean }) => void }).onMute;
      const onSeeking = (this as unknown as { onSeeking?: () => void }).onSeeking;
      const onSeek = (this as unknown as { onSeek?: (data: { currentTime: number }) => void }).onSeek;
      const onPlay = (this as unknown as { onPlay?: () => void }).onPlay;
      const onPause = (this as unknown as { onPause?: () => void }).onPause;
      const onBuffering = (this as unknown as { onBuffering?: () => void }).onBuffering;
      const userOnError =
        (this as unknown as { onError?: (data: IErrorData) => void }).onError ?? (() => {});
      const onError = (data: IErrorData): void => {
        this.#lastError = data;
        userOnError(data);
      };
      this.#playerPromise = provider.createPlayer(container, id, {
        width,
        height,
        autoplay,
        ...(typeof onMute === "function" ? { onMute } : {}),
        ...(typeof onSeeking === "function" ? { onSeeking } : {}),
        ...(typeof onSeek === "function" ? { onSeek } : {}),
        ...(typeof onPlay === "function" ? { onPlay } : {}),
        ...(typeof onPause === "function" ? { onPause } : {}),
        ...(typeof onBuffering === "function" ? { onBuffering } : {}),
        onError,
        ...options,
      }).then((player) => {
        this.#player = player;
        const onReady =
          (this as unknown as { onReady?: () => void }).onReady ?? (() => {});
        onReady();
        return player;
      });
    }
  };
}
