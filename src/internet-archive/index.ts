import { createEmbedElement } from "../_base/index.js";
import { InternetArchiveEmbed } from "./internet-archive.js";

export { InternetArchiveEmbed } from "./internet-archive.js";

const provider = new InternetArchiveEmbed();

/** Register the custom element `<internet-archive-embed>`. No-op if customElements is unavailable (e.g. Node). */
export function registerInternetArchiveEmbed(): void {
  if (typeof customElements !== "undefined" && !customElements.get("internet-archive-embed")) {
    customElements.define(
      "internet-archive-embed",
      createEmbedElement(provider, "internet-archive-embed")
    );
  }
}

