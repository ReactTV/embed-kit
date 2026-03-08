// Player: createPlayer options, callback payloads, and returned player
export type { TCreatePlayer, ICreatePlayerOptions, IEmbedPlayer, IErrorData, IMuteData, IProgressData, ISeekData, TPlayerState } from "./player.js";

// Iframe helpers (for provider implementations)
export type { IIframeEmbedProps } from "./createEmbedIframeElement.js";
export { createEmbedIframeElement, renderEmbedIframe } from "./createEmbedIframeElement.js";

// Container div for SDKs that mount by id (e.g. Dailymotion, YouTube)
export type { CreatePlayerContainerOptions } from "./createPlayerContainer.js";
export { createPlayerContainer } from "./createPlayerContainer.js";

// Provider contract + custom element
export type { IEmbedProvider } from "./element.js";
export { createEmbedElement } from "./element.js";

// Script loading (for provider SDKs)
export type { LoadScriptOptions } from "./loadScript.js";
export { loadScript } from "./loadScript.js";
