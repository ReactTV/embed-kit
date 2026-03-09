import {
  createEmbedIframeElement,
  type IEmbedPlayer,
  type IProgressData,
  type TCreatePlayer,
  type TPlayerState,
} from "../_base/index.js";

const EMBED_ORIGIN = "https://www.tiktok.com";
const EMBED_BASE = "https://www.tiktok.com/player/v1/";

/** TikTok onStateChange values: -1 init, 0 ended, 1 playing, 2 paused, 3 buffering */
const STATE_ENDED = 0;
const STATE_PAUSED = 2;

function post(iframe: HTMLIFrameElement, type: string, value?: unknown): void {
  if (!iframe.contentWindow) return;
  const message: { "x-tiktok-player": boolean; type: string; value?: unknown } = {
    "x-tiktok-player": true,
    type,
    ...(value !== undefined ? { value } : {}),
  };
  iframe.contentWindow.postMessage(message, "*");
}

/**
 * Create a controllable TikTok player in the given container.
 * Uses postMessage: play, pause, seekTo; listens for onStateChange and onCurrentTime.
 */
export const createPlayer: TCreatePlayer = (container, id, options = {}) => {
  const {
    width = 325,
    height = 575,
    autoplay = false,
    controls = true,
    onReady = () => {},
    onPlay = () => {},
    onPause = () => {},
    onBuffering = () => {},
    onEnded = () => {},
    onProgress = () => {},
    onDurationChange = () => {},
    onSeek = () => {},
    onMute = () => {},
    onError = () => {},
  } = options;

  const params = new URLSearchParams({ controls: controls ? "1" : "0" });
  if (autoplay) params.set("autoplay", "1");

  // Vertical video: width is the narrow dimension, height the tall one (e.g. 325×575).
  const iframe = createEmbedIframeElement({
    src: `${EMBED_BASE}${id}?${params.toString()}`,
    width,
    height,
    allow: "autoplay; fullscreen",
    allowFullScreen: true,
  });
  iframe.style.display = "block";
  iframe.style.maxWidth = "100%";
  iframe.style.maxHeight = "100%";
  container.appendChild(iframe);

  const playerState: TPlayerState = {
    currentTime: 0,
    isPaused: true,
    muted: false,
    volume: 1,
    error: null,
    isPlaying: false,
    duration: 0,
  };
  let resolveReady: () => void;
  new Promise<void>((resolve) => {
    resolveReady = resolve;
  });
  let resolvePlayer: (p: IEmbedPlayer) => void;
  const playerPromise = new Promise<IEmbedPlayer>((resolve) => {
    resolvePlayer = resolve;
  });

  const handleMessage = (event: MessageEvent): void => {
    if (event.origin !== EMBED_ORIGIN || event.source !== iframe.contentWindow) return;
    const data = event.data;
    if (!data || typeof data !== "object" || !("type" in data)) return;

    switch (data.type) {
      case "onPlayerReady":
        resolveReady();
        onReady();
        resolvePlayer(player);
        break;
      case "onStateChange":
        if (typeof data.value === "number") {
          playerState.isPaused = data.value === STATE_PAUSED;
          if (data.value === 1) onPlay(); // 1 = playing
          if (data.value === STATE_PAUSED) onPause();
          if (data.value === 3) onBuffering(); // 3 = buffering
          if (data.value === STATE_ENDED) onEnded();
        }
        break;
      case "onCurrentTime":
        const t = data.value as Partial<IProgressData> | undefined;
        if (t) {
          if (typeof t.currentTime === "number") playerState.currentTime = t.currentTime;
          if (typeof t.duration === "number") {
            if (t.duration !== playerState.duration) {
              playerState.duration = t.duration;
              onDurationChange(t.duration);
            }
          }
          onProgress(playerState.currentTime);
        }
        break;
      case "onError":
      case "error": {
        const err = data.value as { message?: string; code?: number | string } | undefined;
        const errorData = {
          ...(err?.message != null ? { message: err.message } : {}),
          ...(err?.code != null ? { code: err.code } : {}),
        };
        playerState.error =
          Object.keys(errorData).length > 0 ? errorData : { message: "TikTok embed error" };
        onError(playerState.error);
        break;
      }
    }
  };

  window.addEventListener("message", handleMessage);

  const player: IEmbedPlayer = {
    async play() {
      post(iframe, "play");
    },
    async pause() {
      post(iframe, "pause");
    },
    get paused(): boolean {
      return playerState.isPaused;
    },
    get currentTime(): number {
      return playerState.currentTime;
    },
    get duration(): number {
      return playerState.duration;
    },
    seek(seconds: number) {
      post(iframe, "seekTo", seconds);
      playerState.currentTime = seconds;
      onSeek(seconds);
    },
    mute() {
      playerState.muted = true;
      post(iframe, "mute", true);
      onMute({ muted: true });
    },
    unmute() {
      playerState.muted = false;
      post(iframe, "mute", false);
      onMute({ muted: false });
    },
    get muted(): boolean {
      return playerState.muted;
    },
    get volume() {
      return playerState.volume;
    },
    setVolume(vol: number) {
      // TikTok does not support volume
      playerState.volume = vol;
    },
    get error() {
      return playerState.error;
    },
    destroy() {
      window.removeEventListener("message", handleMessage);
      if (iframe.parentNode) container.removeChild(iframe);
    },
  };

  return playerPromise;
};
