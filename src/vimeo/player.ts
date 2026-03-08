import {
  createEmbedIframeElement,
  loadScript,
  type TCreatePlayer,
  type TPlayerState,
} from "../_base/index.js";
import type {
  IVimeoErrorData,
  IVimeoPlayer,
  IVimeoTimeupdateData,
  IVimeoVolumechangeData,
  TVimeoEventData,
} from "./player.types.js";

const VIMEO_SCRIPT = "https://player.vimeo.com/api/player.js";
const EMBED_BASE = "https://player.vimeo.com/video/";

declare global {
  interface Window {
    Vimeo?: { Player: new (iframe: HTMLIFrameElement) => IVimeoPlayer };
  }
}

/**
 * Create a controllable Vimeo player in the given container.
 * Returns a normalized IEmbedPlayer (play, pause, paused, currentTime).
 */
export const createPlayer: TCreatePlayer = (container, id, options = {}) => {
  const {
    width = 560,
    height = 315,
    autoplay = false,
    onReady = () => {},
    onPlay = () => {},
    onPause = () => {},
    onBuffering = () => {},
    onEnded = () => {},
    onProgress = () => {},
    onSeek = () => {},
    onMute = () => {},
    onError = () => {},
    vimeoHash,
  } = options as typeof options & { vimeoHash?: string };
  const query = new URLSearchParams({ api: "1" });
  if (vimeoHash) query.set("h", vimeoHash);
  if (autoplay) query.set("autoplay", "1");

  const iframe = createEmbedIframeElement({
    src: `${EMBED_BASE}${id}?${query.toString()}`,
    width,
    height,
    allow: "autoplay; fullscreen; picture-in-picture",
    allowFullScreen: true,
  });
  container.appendChild(iframe);

  const playerState: TPlayerState = {
    currentTime: 0,
    duration: 0,
    isPlaying: false,
    isPaused: true,
    muted: false,
    error: null,
  };
  return loadScript(VIMEO_SCRIPT, {
    isLoaded: () => !!window.Vimeo?.Player,
    errorMessage: "Failed to load Vimeo player script",
  }).then(() => {
    onReady();

    const vimeoPlayer = new window.Vimeo!.Player(iframe);

    vimeoPlayer.on("error", (data: TVimeoEventData) => {
      const err = data as IVimeoErrorData;
      playerState.error = {
        ...(err.message != null ? { message: err.message } : {}),
        ...(err.name != null ? { code: err.name } : {}),
      };
      if (!playerState.error.message) playerState.error.message = "Vimeo playback error";
      onError(playerState.error);
    });
    vimeoPlayer.on("play", () => {
      playerState.isPlaying = true;
      playerState.isPaused = false;
      onPlay();
    });
    vimeoPlayer.on("pause", () => {
      playerState.isPlaying = false;
      playerState.isPaused = true;
      onPause();
    });
    vimeoPlayer.on("bufferstart", onBuffering);
    vimeoPlayer.on("finish", onEnded);
    vimeoPlayer.on("ended", onEnded);
    vimeoPlayer.on("timeupdate", (data: TVimeoEventData) => {
      const { seconds } = data as IVimeoTimeupdateData;
      playerState.currentTime = seconds;
      onProgress(playerState.currentTime);
    });
    vimeoPlayer.on("volumechange", (data: TVimeoEventData) => {
      const { muted } = data as IVimeoVolumechangeData;
      playerState.muted = muted;
      onMute({ muted });
    });

    return {
      play: () => vimeoPlayer.play(),
      pause: () => vimeoPlayer.pause(),
      get paused() {
        return playerState.isPaused;
      },
      get currentTime() {
        return playerState.currentTime;
      },
      get duration() {
        return playerState.duration;
      },
      seek(seconds: number) {
        return vimeoPlayer.setCurrentTime(seconds).then(() => {
          onSeek(seconds);
        });
      },
      mute() {
        return vimeoPlayer.setMuted(true).then(() => {
          onMute({ muted: true });
        });
      },
      unmute() {
        return vimeoPlayer.setMuted(false).then(() => {
          onMute({ muted: false });
        });
      },
      get muted() {
        return playerState.muted;
      },
      get error() {
        return playerState.error;
      },
      destroy() {
        vimeoPlayer.destroy();
        if (iframe.parentNode) container.removeChild(iframe);
      },
    };
  });
};
