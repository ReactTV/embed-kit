import {
  createEmbedIframeElement,
  EmbedPlayerVideoElement,
  wrapOptionsForEventTarget,
  type IEmbedPlayer,
  type TCreatePlayer,
  type TPlayerState,
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
 * Returns an EmbedPlayerVideoElement that mimics HTMLVideoElement.
 */
export const createPlayer: TCreatePlayer = (container, id, options = {}) => {
  const embedUrl =
    (options as typeof options & { twitchType?: string }).twitchType === "clip"
      ? `https://clips.twitch.tv/embed?clip=${encodeURIComponent(id)}`
      : `https://player.twitch.tv/?video=${encodeURIComponent(id)}`;
  const element = new EmbedPlayerVideoElement(options.url ?? embedUrl);
  const wrappedOptions = wrapOptionsForEventTarget(element, options);

  const {
    width = 560,
    height = 315,
    autoplay = false,
    controls = true,
    enableCaptions,
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
  } = wrappedOptions;
  const { twitchType } = options as typeof options & { twitchType?: string };
  const isChannel = twitchType === "channel";

  const mediaParam = isChannel ? "channel" : "video";
  const iframeSrc =
    twitchType === "clip"
      ? `https://clips.twitch.tv/embed?clip=${encodeURIComponent(id)}&parent=${encodeURIComponent(window.location.hostname)}`
      : `${EMBED_ORIGIN}/?${mediaParam}=${encodeURIComponent(id)}&parent=${encodeURIComponent(window.location.hostname)}&controls=${controls}${autoplay ? "&autoplay=true" : ""}`;

  const iframe = createEmbedIframeElement({
    src: iframeSrc,
    width,
    height,
    allow: "accelerometer; fullscreen; autoplay; encrypted-media; picture-in-picture",
    allowFullScreen: true,
  });
  container.appendChild(iframe);

  interface TwitchPlayerState extends TPlayerState {
    isPlaying: boolean;
  }
  const playerState: TwitchPlayerState = {
    isPaused: true,
    currentTime: 0,
    duration: 0,
    muted: false,
    error: null,
    isPlaying: false,
  };

  const onMessage = (event: MessageEvent): void => {
    if (event.source !== iframe.contentWindow || event.origin !== EMBED_ORIGIN) return;
    const message = event.data as TTwitchMessage;

    if (message.namespace === NS_EMBED) {
      if (message.eventName === "ready") {
        if (enableCaptions !== undefined) {
          send(enableCaptions ? PlayerCommands.ENABLE_CAPTIONS : PlayerCommands.DISABLE_CAPTIONS);
        }
        onReady();
      }

      if (message.eventName === "error") {
        const msg = message.params?.message ?? "Twitch embed error";
        playerState.error = { message: msg };
        onError(playerState.error);
      }

      if (message.eventName === "seek") {
        playerState.currentTime = message.params.position;
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
      const isPlaying = p.playback === PlaybackState.PLAYING;
      if (isPlaying && !playerState.isPlaying) onPlay();
      if (!isPlaying && playerState.isPlaying) onPause();

      if (p.playback === PlaybackState.BUFFERING) onBuffering();
      if (p.playback === PlaybackState.ENDED) onEnded();

      playerState.isPlaying = isPlaying;
      playerState.isPaused = !isPlaying;
      playerState.currentTime = p.currentTime;
      if (p.duration !== playerState.duration) {
        playerState.duration = p.duration;
        onDurationChange(p.duration);
      }
      if (typeof p.muted === "boolean") playerState.muted = p.muted;
      if (typeof p.volume === "number" && !Number.isNaN(p.volume)) playerState.volume = p.volume;
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
  const inner: IEmbedPlayer = {
    play() {
      playerState.isPaused = false;
      send(PlayerCommands.PLAY);
      onPlay();
    },
    pause() {
      playerState.isPaused = true;
      send(PlayerCommands.PAUSE);
      onPause();
    },
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
      send(PlayerCommands.SEEK, seconds);
      playerState.currentTime = seconds;
      onSeek(seconds);
    },
    mute() {
      playerState.muted = true;
      send(PlayerCommands.SET_MUTED, true);
      onMute({ muted: true });
    },
    unmute() {
      playerState.muted = false;
      send(PlayerCommands.SET_MUTED, false);
      onMute({ muted: false });
    },
    get muted() {
      return playerState.muted;
    },
    get volume() {
      return playerState.volume;
    },
    setVolume(vol: number) {
      const v = Math.max(0, Math.min(1, vol));
      playerState.volume = v;
      send(PlayerCommands.SET_VOLUME, v);
    },
    get error() {
      return playerState.error;
    },
    destroy() {
      window.removeEventListener("message", onMessage);
      if (iframe.parentNode) iframe.remove();
    },
  };

  element.setPlayer(inner);
  return Promise.resolve(element);
};
