import type { CreatePlayerOptions, EmbedPlayer } from "../_base/index.js";

const EMBED_ORIGIN = "https://player.twitch.tv";
const NS_EMBED = "twitch-embed";
const NS_PLAYER_PROXY = "twitch-embed-player-proxy";
const CMD_PLAY = 3;
const CMD_PAUSE = 2;
const CMD_SEEK = 4;

interface TwitchMessage {
  namespace?: string;
  eventName?: string;
  params?: { playback?: string; currentTime?: number; duration?: number };
}

/**
 * Create a controllable Twitch player in the given container (video by id, or clip by slug).
 * Uses the player.twitch.tv iframe and postMessage API; no Twitch Embed SDK.
 * Clips use clips.twitch.tv/embed (no control API).
 */
export function createPlayer(
  container: HTMLElement,
  videoId: string,
  options: CreatePlayerOptions = {}
): Promise<EmbedPlayer> {
  const width = options.width ?? 560;
  const height = options.height ?? 315;
  const autoplay = Boolean((options as { autoplay?: boolean }).autoplay);
  const isClip = (options as { twitchType?: string }).twitchType === "clip";
  const parent =
    typeof window !== "undefined" && window.location?.hostname
      ? window.location.hostname
      : "localhost";
  const parentParam =
    parent === "localhost" || parent === "127.0.0.1"
      ? "parent=localhost&parent=127.0.0.1"
      : `parent=${encodeURIComponent(parent)}`;

  if (isClip) {
    const clipUrl = `https://clips.twitch.tv/embed?clip=${encodeURIComponent(videoId)}&${parentParam}`;
    const iframe = document.createElement("iframe");
    iframe.src = clipUrl;
    iframe.width = String(typeof width === "number" ? width : parseInt(String(width), 10) || 560);
    iframe.height = String(typeof height === "number" ? height : parseInt(String(height), 10) || 315);
    iframe.setAttribute("frameborder", "0");
    iframe.allowFullscreen = true;
    container.appendChild(iframe);
    return Promise.resolve({
      get ready() {
        return Promise.resolve();
      },
      play: () => {},
      pause: () => {},
      get paused() {
        return Promise.resolve(false);
      },
      get currentTime() {
        return Promise.resolve(0);
      },
      seek: () => {},
      get autoplay() {
        return Promise.resolve(autoplay);
      },
      destroy() {
        if (iframe.parentNode) iframe.remove();
      },
    });
  }

  const parentQuery =
    parent === "localhost" || parent === "127.0.0.1"
      ? "parent=localhost&parent=127.0.0.1"
      : `parent=${encodeURIComponent(parent)}`;
  const iframe = document.createElement("iframe");
  iframe.src = `${EMBED_ORIGIN}/?video=${encodeURIComponent(videoId)}&${parentQuery}${autoplay ? "&autoplay=true" : ""}`;
  iframe.width = String(typeof width === "number" ? width : parseInt(String(width), 10) || 560);
  iframe.height = String(typeof height === "number" ? height : parseInt(String(height), 10) || 315);
  iframe.setAttribute("frameborder", "0");
  iframe.allowFullscreen = true;
  iframe.allow = "accelerometer; fullscreen; autoplay; encrypted-media; picture-in-picture";
  container.appendChild(iframe);

  let isPaused = true;
  let currentTime = 0;
  let readyResolve: () => void;
  const readyPromise = new Promise<void>((r) => {
    readyResolve = r;
  });

  const onMessage = (event: MessageEvent): void => {
    if (event.source !== iframe.contentWindow || event.origin !== EMBED_ORIGIN) return;
    const data = event.data as TwitchMessage;
    if (!data?.namespace) return;

    if (data.namespace === NS_EMBED && data.eventName === "ready") {
      readyResolve();
    } else if (data.namespace === NS_PLAYER_PROXY && data.eventName === "UPDATE_STATE" && data.params) {
      const p = data.params;
      if (p.playback !== undefined) {
        isPaused = p.playback !== "Playing";
      }
      if (typeof p.currentTime === "number") {
        currentTime = p.currentTime;
      }
    }
  };

  window.addEventListener("message", onMessage);

  const send = (eventName: number, params?: number): void => {
    if (!iframe.contentWindow) return;
    iframe.contentWindow.postMessage(
      { eventName, params, namespace: NS_PLAYER_PROXY },
      EMBED_ORIGIN
    );
  };

  const player: EmbedPlayer = {
    get ready() {
      return readyPromise;
    },
    play() {
      send(CMD_PLAY);
    },
    pause() {
      send(CMD_PAUSE);
    },
    get paused() {
      return Promise.resolve(isPaused);
    },
    get currentTime() {
      return Promise.resolve(currentTime);
    },
    seek(seconds: number) {
      send(CMD_SEEK, seconds);
    },
    get autoplay() {
      return Promise.resolve(autoplay);
    },
    destroy() {
      window.removeEventListener("message", onMessage);
      if (iframe.parentNode) iframe.remove();
    },
  };

  return Promise.resolve(player);
}
