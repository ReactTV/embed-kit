// Player: createPlayer options, callback payloads, and returned player
export type { TCreatePlayer, ICreatePlayerOptions, IEmbedPlayer, IErrorData, IMuteData, IProgressData } from "./player.js";

// Iframe helpers (for provider implementations)
export type { IIframeEmbedProps } from "./iframe.js";
export { createEmbedIframeElement, renderEmbedIframe } from "./iframe.js";

// Provider contract + custom element
export type { IEmbedProvider } from "./element.js";
export { createEmbedElement } from "./element.js";
