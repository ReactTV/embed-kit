import { createEmbedIframeElement, type IEmbedPlayer, type IErrorData, type TCreatePlayer } from "../_base/index.js";

const EMBED_ORIGIN = "https://player.twitch.tv";
const NS_EMBED = "twitch-embed";
const NS_PLAYER_PROXY = "twitch-embed-player-proxy";
const CMD_PLAY = 3;
const CMD_PAUSE = 2;
const CMD_SEEK = 4;
const CMD_SET_MUTED = 10;

interface TwitchMessage {
  namespace?: string;
  eventName?: string | number;
  params?: { playback?: string; currentTime?: number; duration?: number } | boolean;
}

/**
 * Create a controllable Twitch player in the given container (video by id, or clip by slug).
 * Uses the player.twitch.tv iframe and postMessage API; no Twitch Embed SDK.
 * Clips use clips.twitch.tv/embed (no control API).
 */
export const createPlayer: TCreatePlayer = (container, id, options = {}) => {
  const { width = 560, height = 315, autoplay = false, onReady, onPlay, onPause, onBuffering, onEnded, onProgress, onMute, onError } = options;
  const { twitchType } = options as typeof options & { twitchType?: string };
  const isClip = twitchType === "clip";
  const isChannel = twitchType === "channel";
  const parent =
    typeof window !== "undefined" && window.location?.hostname
      ? window.location.hostname
      : "localhost";
  const parentParam =
    parent === "localhost" || parent === "127.0.0.1"
      ? "parent=localhost&parent=127.0.0.1"
      : `parent=${encodeURIComponent(parent)}`;

  if (isClip) {
    const clipUrl = `https://clips.twitch.tv/embed?clip=${encodeURIComponent(id)}&${parentParam}`;
    const iframe = createEmbedIframeElement({
      src: clipUrl,
      width: typeof width === "number" ? width : parseInt(String(width), 10) || 560,
      height: typeof height === "number" ? height : parseInt(String(height), 10) || 315,
      allowFullScreen: true,
    });
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
      get duration() {
        return Promise.resolve(0);
      },
      seek: () => {},
      get autoplay() {
        return Promise.resolve(autoplay);
      },
      mute() {},
      unmute() {},
      get muted() {
        return Promise.resolve(false);
      },
      get lastError() {
        return null;
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
  const mediaParam = isChannel ? "channel" : "video";
  const iframe = createEmbedIframeElement({
    src: `${EMBED_ORIGIN}/?${mediaParam}=${encodeURIComponent(id)}&${parentQuery}${autoplay ? "&autoplay=true" : ""}`,
    width: typeof width === "number" ? width : parseInt(String(width), 10) || 560,
    height: typeof height === "number" ? height : parseInt(String(height), 10) || 315,
    allow: "accelerometer; fullscreen; autoplay; encrypted-media; picture-in-picture",
    allowFullScreen: true,
  });
  container.appendChild(iframe);

  let isPaused = true;
  let currentTime = 0;
  let duration = 0;
  let isMuted = false;
  let lastError: IErrorData | null = null;
  let lastPlayback: string | undefined;
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
      onReady?.();
    } else if (data.namespace === NS_EMBED && data.eventName === "error") {
      const msg = data.params && typeof data.params === "object" && !Array.isArray(data.params)
        ? (data.params as { message?: string }).message
        : undefined;
      lastError = { message: msg ?? "Twitch embed error" };
      onError?.(lastError);
    } else if (data.namespace === NS_PLAYER_PROXY && data.eventName === "UPDATE_STATE" && data.params && typeof data.params === "object" && !Array.isArray(data.params)) {
      const p = data.params as { playback?: string; currentTime?: number; duration?: number };
      if (p.playback !== undefined) {
        if (p.playback === "Playing" && lastPlayback !== "Playing") onPlay?.();
        if ((p.playback === "Paused" || p.playback === "Ready") && lastPlayback === "Playing") onPause?.();
        if (p.playback === "Buffering") onBuffering?.();
        lastPlayback = p.playback;
        isPaused = p.playback !== "Playing";
        if (p.playback === "Ended") onEnded?.();
      }
      if (typeof p.currentTime === "number") {
        currentTime = p.currentTime;
      }
      if (typeof p.duration === "number") {
        duration = p.duration;
      }
      if (onProgress && (typeof p.currentTime === "number" || typeof p.duration === "number")) {
        onProgress({
          currentTime: typeof p.currentTime === "number" ? p.currentTime : currentTime,
          duration: typeof p.duration === "number" ? p.duration : duration,
        });
      }
    }
  };

  window.addEventListener("message", onMessage);

  const send = (eventName: number, params?: number | boolean): void => {
    if (!iframe.contentWindow) return;
    iframe.contentWindow.postMessage(
      { eventName, params, namespace: NS_PLAYER_PROXY },
      EMBED_ORIGIN
    );
  };

  const player: IEmbedPlayer = {
    get ready() {
      return readyPromise;
    },
    play() {
      isPaused = false;
      send(CMD_PLAY);
      onPlay?.();
    },
    pause() {
      isPaused = true;
      send(CMD_PAUSE);
      onPause?.();
    },
    get paused() {
      return Promise.resolve(isPaused);
    },
    get currentTime() {
      return Promise.resolve(currentTime);
    },
    get duration() {
      return Promise.resolve(duration);
    },
    seek(seconds: number) {
      send(CMD_SEEK, seconds);
    },
    get autoplay() {
      return Promise.resolve(autoplay);
    },
    mute() {
      isMuted = true;
      send(CMD_SET_MUTED, true);
      onMute?.({ muted: true });
    },
    unmute() {
      isMuted = false;
      send(CMD_SET_MUTED, false);
      onMute?.({ muted: false });
    },
    get muted() {
      return Promise.resolve(isMuted);
    },
    get lastError() {
      return lastError;
    },
    destroy() {
      window.removeEventListener("message", onMessage);
      if (iframe.parentNode) iframe.remove();
    },
  };

  return Promise.resolve(player);
};
