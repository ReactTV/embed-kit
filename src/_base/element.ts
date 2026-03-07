import type { EmbedProvider } from "./provider.js";
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
