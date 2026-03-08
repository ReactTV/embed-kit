import type { EmbedPlayer } from "./player.js";
import type { EmbedOptions, EmbedProvider } from "./provider.js";
import { renderEmbedIframe } from "./iframe.js";

const DEFAULT_WIDTH = "560";
const DEFAULT_HEIGHT = "315";

/**
 * Creates a custom element class that renders this provider's embed in a shadow root.
 * Use `src` (full URL) or `video-id` (media id). Optional: `width`, `height`, `title`.
 */
export function createEmbedElement(
  provider: EmbedProvider,
  _tagName: string
): CustomElementConstructor {
  return class extends HTMLElement {
    static get observedAttributes(): string[] {
      return ["src", "video-id", "width", "height", "title"];
    }

    #shadow: ShadowRoot | null = null;

    connectedCallback(): void {
      if (!this.#shadow) {
        this.#shadow = this.attachShadow({ mode: "open" });
      }
      this.#render();
    }

    attributeChangedCallback(): void {
      this.#render();
    }

    #render(): void {
      if (!this.#shadow) return;

      const srcAttr = this.getAttribute("src");
      const idAttr = this.getAttribute("video-id");

      let embedUrl: string | null = null;

      if (srcAttr) {
        const parsed = provider.parseSourceUrl(srcAttr);
        if (parsed) {
          embedUrl = provider.getEmbedUrl(parsed.id, parsed.options);
        }
      } else if (idAttr) {
        embedUrl = provider.getEmbedUrl(idAttr);
      }

      if (!embedUrl) {
        this.#shadow.innerHTML = "";
        return;
      }

      const width = this.getAttribute("width") ?? DEFAULT_WIDTH;
      const height = this.getAttribute("height") ?? DEFAULT_HEIGHT;
      const title = this.getAttribute("title") ?? "";

      const html = renderEmbedIframe({
        src: embedUrl,
        width,
        height,
        title,
      });

      this.style.display = "block";
      const w = String(width);
      const h = String(height);
      this.style.width = /^\d+$/.test(w) ? `${w}px` : w;
      this.style.height = /^\d+$/.test(h) ? `${h}px` : h;

      this.#shadow.innerHTML = `<style>:host{display:block;} iframe{display:block;border:0;}</style>${html}`;
    }
  };
}

/**
 * Creates a custom element class for a provider that implements createPlayer.
 * The element calls provider.createPlayer() and exposes play(), pause(), paused, currentTime, seek(), autoplay, mute(), unmute(), muted.
 * The player container is mounted in the light DOM (on the host) so SDKs that use document.getElementById
 * (e.g. Dailymotion) can find the mount element.
 */
export function createControllableEmbedElement(
  provider: EmbedProvider & {
    createPlayer(
      container: HTMLElement,
      id: string,
      options?: EmbedOptions
    ): Promise<EmbedPlayer>;
  },
  _tagName: string
): CustomElementConstructor {
  return class extends HTMLElement {
    static get observedAttributes(): string[] {
      return ["src", "video-id", "width", "height", "title", "autoplay"];
    }

    #playerPromise: Promise<EmbedPlayer> | null = null;
    #player: EmbedPlayer | null = null;
    #container: HTMLElement | null = null;

    connectedCallback(): void {
      this.#render();
    }

    attributeChangedCallback(): void {
      this.#render();
    }

    async play(): Promise<void> {
      const player = await this.#getPlayer();
      if (player) player.play();
    }

    async pause(): Promise<void> {
      const player = await this.#getPlayer();
      if (player) player.pause();
    }

    get paused(): Promise<boolean> {
      return this.#getPlayer().then((player) => (player ? player.paused : Promise.resolve(true)));
    }

    get currentTime(): Promise<number> {
      return this.#getPlayer().then((player) => (player ? player.currentTime : Promise.resolve(0)));
    }

    get duration(): Promise<number> {
      return this.#getPlayer().then((player) => (player ? player.duration : Promise.resolve(0)));
    }

    async seek(seconds: number): Promise<void> {
      const player = await this.#getPlayer();
      if (player) player.seek(seconds);
    }

    get autoplay(): Promise<boolean> {
      return this.#getPlayer().then((player) => (player ? player.autoplay : Promise.resolve(false)));
    }

    async mute(): Promise<void> {
      const player = await this.#getPlayer();
      if (player) player.mute();
    }

    async unmute(): Promise<void> {
      const player = await this.#getPlayer();
      if (player) player.unmute();
    }

    get muted(): Promise<boolean> {
      return this.#getPlayer().then((player) => (player ? player.muted : Promise.resolve(false)));
    }

    /** Resolves when the embed player is ready for playback control. */
    get ready(): Promise<void> {
      const p = this.#playerPromise;
      return p ? p.then((player) => player.ready) : new Promise<void>(() => {});
    }

    async #getPlayer(): Promise<EmbedPlayer | null> {
      if (this.#player) return this.#player;
      if (this.#playerPromise) return this.#playerPromise;
      return null;
    }

    #render(): void {
      const srcAttr = this.getAttribute("src");
      const idAttr = this.getAttribute("video-id");

      let id: string | null = null;
      let options: EmbedOptions | undefined;

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
        return;
      }

      const width = this.getAttribute("width") ?? DEFAULT_WIDTH;
      const height = this.getAttribute("height") ?? DEFAULT_HEIGHT;

      this.style.display = "block";
      const w = String(width);
      const h = String(height);
      this.style.width = /^\d+$/.test(w) ? `${w}px` : w;
      this.style.height = /^\d+$/.test(h) ? `${h}px` : h;

      // Only mount and create the player when the element is in the document.
      // Otherwise (e.g. attributes set before appendChild), the iframe is never
      // in the DOM and providers like Vimeo never fire ready().
      if (!this.isConnected) {
        if (this.#container?.parentNode) this.#container.remove();
        this.#container = null;
        this.#playerPromise = null;
        this.#player = null;
        return;
      }

      if (this.#container?.parentNode) {
        this.#container.remove();
      }
      this.#player = null;
      this.#playerPromise = null;

      const container = document.createElement("div");
      container.style.display = "block";
      const widthPx = /^\d+$/.test(w) ? `${w}px` : w;
      const heightPx = /^\d+$/.test(h) ? `${h}px` : h;
      container.style.width = widthPx;
      container.style.height = heightPx;
      container.style.minWidth = widthPx;
      container.style.minHeight = heightPx;
      container.style.overflow = "hidden";
      this.appendChild(container);
      this.#container = container;

      const autoplayAttr = this.getAttribute("autoplay");
      const autoplay = autoplayAttr !== null && autoplayAttr !== "false";
      this.#playerPromise = provider.createPlayer(container, id, {
        width,
        height,
        autoplay,
        ...options,
      }).then((player) => {
        this.#player = player;
        return player;
      });
    }
  };
}
