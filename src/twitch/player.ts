import {
  createEmbedIframeElement,
  type IEmbedPlayer,
  type IErrorData,
  type TCreatePlayer,
} from "../_base/index.js";
import {
  EMBED_ORIGIN,
  NS_EMBED,
  NS_PLAYER_PROXY,
  PlaybackState,
  PlayerCommands,
} from "./constants.js";
import type { TTwitchMessage } from "./player.types.js";

/**
 * Create a Twitch player in the given container (video by id, channel by name, or clip by slug).
 * Uses player.twitch.tv for VOD/channel (postMessage API) or clips.twitch.tv/embed for clips (no control API).
 * Same player interface; clip embeds do not respond to play/pause/seek/mute.
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
  } = options;
  const { twitchType } = options as typeof options & { twitchType?: string };
  const isClip = twitchType === "clip";
  const isChannel = twitchType === "channel";

  const mediaParam = isChannel ? "channel" : "video";
  const embedUrl = isClip
    ? `https://clips.twitch.tv/embed?clip=${encodeURIComponent(id)}&parent=${encodeURIComponent(window.location.hostname)}`
    : `${EMBED_ORIGIN}/?${mediaParam}=${encodeURIComponent(id)}&parent=${encodeURIComponent(window.location.hostname)}${autoplay ? "&autoplay=true" : ""}`;

  const iframe = createEmbedIframeElement({
    src: embedUrl,
    width,
    height,
    ...(isClip
      ? {}
      : {
          allow: "accelerometer; fullscreen; autoplay; encrypted-media; picture-in-picture",
        }),
    allowFullScreen: true,
  });
  container.appendChild(iframe);

  let isPaused = true;
  let currentTime = 0;
  let duration = 0;
  let muted = false;
  let error: IErrorData | null = null;
  let lastPlayback: string | undefined;

  const onMessage = (event: MessageEvent): void => {
    if (event.source !== iframe.contentWindow || event.origin !== EMBED_ORIGIN) return;
    const message = event.data as TTwitchMessage;

    if (message.namespace === NS_EMBED) {
      if (message.eventName === "ready") {
        onReady();
      }

      if (message.eventName === "error") {
        const msg = message.params?.message ?? "Twitch embed error";
        error = { message: msg };
        onError(error);
      }

      if (message.eventName === "seek") {
        currentTime = message.params.position;
        onSeek(message.params.position);
      }

      if (
        message.eventName === "play" ||
        message.eventName === "playing" ||
        message.eventName === "video.play"
      ) {
        onPlay();
      }
    }

    if (message.namespace === NS_PLAYER_PROXY && message.eventName === "UPDATE_STATE") {
      const p = message.params;
      if (p.playback === PlaybackState.PLAYING && lastPlayback !== PlaybackState.PLAYING) {
        onPlay();
      }

      if (
        (p.playback === PlaybackState.PAUSED ||
          p.playback === PlaybackState.READY ||
          p.playback === PlaybackState.IDLE) &&
        lastPlayback === PlaybackState.PLAYING
      ) {
        onPause();
      }

      if (p.playback === PlaybackState.BUFFERING) onBuffering();
      if (p.playback === PlaybackState.ENDED) onEnded();

      lastPlayback = p.playback;
      isPaused = p.playback !== PlaybackState.PLAYING;
      currentTime = p.currentTime;
      duration = p.duration;
      if (typeof p.muted === "boolean") muted = p.muted;
      onProgress(p.currentTime);
    }
  };

  window.addEventListener("message", onMessage);

  const send = (command: number, params?: number | boolean): void => {
    if (!iframe.contentWindow) return;
    iframe.contentWindow.postMessage(
      { eventName: command, params, namespace: NS_PLAYER_PROXY },
      EMBED_ORIGIN
    );
  };

  const player: IEmbedPlayer = {
    play() {
      isPaused = false;
      send(PlayerCommands.PLAY);
      onPlay();
    },
    pause() {
      isPaused = true;
      send(PlayerCommands.PAUSE);
      onPause();
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
      send(PlayerCommands.SEEK, seconds);
      currentTime = seconds;
      onSeek(seconds);
    },
    mute() {
      muted = true;
      send(PlayerCommands.SET_MUTED, true);
      onMute(true);
    },
    unmute() {
      muted = false;
      send(PlayerCommands.SET_MUTED, false);
      onMute(false);
    },
    get muted() {
      return muted;
    },
    get error() {
      return error;
    },
    destroy() {
      window.removeEventListener("message", onMessage);
      if (iframe.parentNode) iframe.remove();
    },
  };

  return Promise.resolve(player);
};
