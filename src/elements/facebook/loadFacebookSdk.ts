import { loadScript } from "../_base/index.js";
import type { IFacebookVideoPlayer, IFacebookXfbmlReadyMessage } from "./player.types.js";

const FB_SDK = "https://connect.facebook.net/en_US/sdk.js";
const FB_SDK_VERSION = "v22.0";

declare global {
  interface Window {
    FB?: {
      init: (params: { appId?: string; xfbml?: boolean; version: string }) => void;
      XFBML: { parse: (node?: HTMLElement) => void };
      Event: {
        subscribe: (event: string, callback: (msg: IFacebookXfbmlReadyMessage) => void) => void;
      };
    };
    fbAsyncInit?: () => void;
  }
}

let fbSdkPromise: Promise<void> | null = null;
let fbSdkInitialized = false;
let xfbmlReadyRouterInstalled = false;
let facebookAppId: string | undefined;

/** Optional Meta app id; only applied if SDK is not initialized yet. */
export function configureFacebookSdk(options: { appId?: string }): void {
  const id = options.appId?.trim();
  if (id && !fbSdkInitialized) {
    facebookAppId = id;
  }
}

const readyHandlersByPlayerId = new Map<string, (instance: IFacebookVideoPlayer) => void>();

function ensureFbRoot(): void {
  if (!document.getElementById("fb-root")) {
    const root = document.createElement("div");
    root.id = "fb-root";
    document.body.prepend(root);
  }
}

function installXfbmlReadyRouter(): void {
  if (xfbmlReadyRouterInstalled || !window.FB?.Event) return;
  xfbmlReadyRouterInstalled = true;

  window.FB.Event.subscribe("xfbml.ready", (msg) => {
    if (msg.type !== "video" || !msg.id || !msg.instance) return;
    readyHandlersByPlayerId.get(msg.id)?.(msg.instance);
  });
}

function initFacebookSdk(): void {
  if (fbSdkInitialized || !window.FB) return;
  window.FB.init({
    ...(facebookAppId ? { appId: facebookAppId } : {}),
    // Each embed is rendered explicitly via parseFacebookEmbed; skip the whole-document scan.
    xfbml: false,
    version: FB_SDK_VERSION,
  });
  installXfbmlReadyRouter();
  fbSdkInitialized = true;
}

/**
 * Loads the Facebook JS SDK once and resolves when FB.init has run.
 * @see https://developers.facebook.com/docs/plugins/embedded-video-player/api/
 */
export function loadFacebookSdk(): Promise<void> {
  if (window.FB?.XFBML?.parse && fbSdkInitialized) {
    return Promise.resolve();
  }

  if (window.FB?.XFBML?.parse) {
    initFacebookSdk();
    return Promise.resolve();
  }

  if (!fbSdkPromise) {
    ensureFbRoot();
    fbSdkPromise = new Promise((resolve, reject) => {
      const prev = window.fbAsyncInit;
      window.fbAsyncInit = () => {
        prev?.();
        if (!window.FB) {
          reject(new Error("Facebook SDK failed to initialize"));
          return;
        }
        initFacebookSdk();
        resolve();
      };

      void loadScript(FB_SDK, {
        isLoaded: () => !!window.FB?.XFBML?.parse,
        errorMessage: "Failed to load Facebook SDK",
      }).then(() => {
        if (window.FB?.XFBML?.parse && !fbSdkInitialized) {
          initFacebookSdk();
          resolve();
        }
      }, reject);
    });
  }

  return fbSdkPromise;
}

export function registerFacebookVideoReady(
  playerId: string,
  onReady: (instance: IFacebookVideoPlayer) => void
): void {
  readyHandlersByPlayerId.set(playerId, onReady);
}

export function unregisterFacebookVideoReady(playerId: string): void {
  readyHandlersByPlayerId.delete(playerId);
}

/** Renders XFBML *descendants* of `node` — pass the container, not the `.fb-video` itself. */
export function parseFacebookEmbed(node: HTMLElement): void {
  window.FB?.XFBML.parse(node);
}
