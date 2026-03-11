import { createIframe, EmbedVideoElement } from "../_base/index.js";
import {
  EMBED_ORIGIN,
  NS_EMBED,
  NS_PLAYER_PROXY,
  PlaybackState,
  PlayerCommands,
  REGEX_CHANNEL,
  REGEX_CLIPS_HOST,
  REGEX_CLIP,
  REGEX_VIDEO,
} from "./constants.js";
import type { TTwitchMessage } from "./player.types.js";

const parseTwitchUrl = (url: string) => {
  const videoId = url.match(REGEX_VIDEO)?.[1];
  const clipSlug = url.match(REGEX_CLIPS_HOST)?.[1] || url.match(REGEX_CLIP)?.[1];
  const channelName = url.match(REGEX_CHANNEL)?.[1];
  return { videoId, clipSlug, channelName };
};

const getTwitchEmbedSrc = (url: string) => {
  const { videoId, clipSlug, channelName } = parseTwitchUrl(url);

  if (videoId) {
    return `https://player.twitch.tv/?video=${encodeURIComponent(videoId)}`;
  }
  if (channelName) {
    return `https://player.twitch.tv/?channel=${encodeURIComponent(channelName)}`;
  }
  if (clipSlug) {
    return `https://clips.twitch.tv/embed?clip=${encodeURIComponent(clipSlug)}`;
  }
  return "";
};

type TGenerateIframeSrcProps = {
  url: string;
  controls: boolean;
  autoplay: boolean;
};

const generateIframeSrc = ({ url, controls, autoplay }: TGenerateIframeSrcProps) =>
  `${getTwitchEmbedSrc(url)}&parent=${encodeURIComponent(window.location.hostname)}&controls=${controls}&autoplay=${autoplay}`;

/**
 * Twitch embed player as a subclass of EmbedVideoElement.
 */
class TwitchEmbedPlayer extends EmbedVideoElement {
  protected twitchPlayerState: { destroyed: boolean } = { destroyed: false };

  override load(): void {
    if (this.iframe?.parentNode) {
      this.iframe.remove();
      this.iframe = null;
    }
    window.removeEventListener("message", this.handleMessage);
    this.handleMessage = () => {};

    const attributes = this.getAttributes();
    const embedSrc = getTwitchEmbedSrc(attributes.src ?? "");

    if (!embedSrc) return;

    const iframeSrc = generateIframeSrc({
      url: attributes.src!,
      controls: this.options.controls,
      autoplay: this.options.autoplay,
    });

    const iframe = createIframe(iframeSrc);

    const send = (command: number, params?: number | boolean): void => {
      if (this.twitchPlayerState.destroyed || !iframe.contentWindow) return;
      iframe.contentWindow.postMessage(
        { eventName: command, params, namespace: NS_PLAYER_PROXY },
        EMBED_ORIGIN
      );
    };

    const handleMessage = (event: MessageEvent): void => {
      if (this.twitchPlayerState.destroyed) return;
      if (event.source !== iframe.contentWindow || event.origin !== EMBED_ORIGIN) return;

      const message = event.data as TTwitchMessage;

      if (message.namespace === NS_EMBED) {
        if (message.eventName === "ready") {
          if (this.options.captions) {
            send(PlayerCommands.ENABLE_CAPTIONS);
          } else {
            send(PlayerCommands.DISABLE_CAPTIONS);
          }
          this.setInitialPlayerState();
          this.dispatchReadyEvent();
        }
        if (message.eventName === "error") {
          const msg = message.params?.message ?? "Twitch embed error";
          this.playerState.error = { code: 0, message: msg } as MediaError;
          this.dispatchErrorEvent(this.playerState.error);
        }
        if (message.eventName === "seek") {
          this.playerState.currentTime = message.params.position;
          this.dispatchProgressEvent(message.params.position);
        }
        if (
          message.eventName === "play" ||
          message.eventName === "playing" ||
          message.eventName === "video.play"
        ) {
          this.playerState.isPaused = false;
          this.dispatchPlayEvent();
        }
      }

      if (message.namespace === NS_PLAYER_PROXY && message.eventName === "UPDATE_STATE") {
        const p = message.params;
        const isPaused = p.playback === PlaybackState.PAUSED;

        if (isPaused && !this.playerState.isPaused) {
          this.playerState.isPaused = true;
          this.dispatchPauseEvent();
        } else if (!isPaused && this.playerState.isPaused) {
          this.playerState.isPaused = false;
          this.dispatchPlayEvent();
        }

        if (p.playback === PlaybackState.BUFFERING) {
          this.dispatchBufferingEvent();
        }
        if (p.playback === PlaybackState.ENDED) {
          this.dispatchEndedEvent();
        }

        this.playerState.currentTime = p.currentTime;

        if (p.duration !== this.playerState.duration) {
          this.playerState.duration = p.duration;
          this.dispatchDurationChangeEvent(p.duration);
        }

        if (typeof p.muted === "boolean") {
          if (p.muted !== this.playerState.muted) {
            this.playerState.muted = p.muted;
            this.dispatchMuteChangeEvent(p.muted);
          }
        }
        if (typeof p.volume === "number" && !Number.isNaN(p.volume)) {
          if (p.volume !== this.playerState.volume) {
            this.playerState.volume = p.volume;
            this.dispatchVolumeChangeEvent(p.volume);
          }
        }

        this.dispatchProgressEvent(p.currentTime);
      }
    };

    this.iframe = iframe;
    this.handleMessage = handleMessage;
    this.getEmbedContainer().appendChild(iframe);
    window.addEventListener("message", handleMessage);
  }

  setInitialPlayerState(): void {
    const attributes = this.getAttributes();

    if (attributes.volume) {
      this.volume = parseFloat(attributes.volume);
    }

    if (attributes.muted) {
      this.muted = attributes.muted === "true";
    }

    if (attributes.playing) {
      this.playing = attributes.playing === "true";
    }
  }

  connectedCallback(): void {
    this.loadInitialOptions();

    const src = this.getAttribute("src");
    if (!src) return;

    if (!getTwitchEmbedSrc(src)) return;

    this.load();
  }

  override play(): Promise<void> {
    if (this.iframe?.contentWindow) {
      this.iframe.contentWindow.postMessage(
        {
          eventName: PlayerCommands.PLAY,
          params: undefined,
          namespace: NS_PLAYER_PROXY,
        },
        EMBED_ORIGIN
      );
    }
    return Promise.resolve();
  }

  override pause(): Promise<void> {
    if (this.iframe?.contentWindow) {
      this.iframe.contentWindow.postMessage(
        {
          eventName: PlayerCommands.PAUSE,
          params: undefined,
          namespace: NS_PLAYER_PROXY,
        },
        EMBED_ORIGIN
      );
    }
    return Promise.resolve();
  }

  override destroy(): void {
    this.twitchPlayerState.destroyed = true;
    window.removeEventListener("message", this.handleMessage);
    if (this.iframe?.parentNode) this.iframe.remove();
    this.iframe = null;
  }

  override get playing(): boolean {
    return !this.paused;
  }

  override set playing(value: boolean) {
    if (value) {
      this.play();
    } else {
      this.pause();
    }
  }

  override set controls(value: boolean) {
    this.options.controls = value;
    this.load();
  }

  override seek(seconds: number): void {
    if (this.iframe?.contentWindow) {
      this.iframe.contentWindow.postMessage(
        {
          eventName: PlayerCommands.SEEK,
          params: seconds,
          namespace: NS_PLAYER_PROXY,
        },
        EMBED_ORIGIN
      );
    }
    this.playerState.currentTime = seconds;
  }

  override mute(): void {
    this.playerState.muted = true;
    if (this.iframe?.contentWindow) {
      this.iframe.contentWindow.postMessage(
        {
          eventName: PlayerCommands.SET_MUTED,
          params: true,
          namespace: NS_PLAYER_PROXY,
        },
        EMBED_ORIGIN
      );
    }
  }

  override unmute(): void {
    this.playerState.muted = false;
    if (this.iframe?.contentWindow) {
      this.iframe.contentWindow.postMessage(
        {
          eventName: PlayerCommands.SET_MUTED,
          params: false,
          namespace: NS_PLAYER_PROXY,
        },
        EMBED_ORIGIN
      );
    }
  }

  override get paused(): boolean {
    return this.playerState.isPaused;
  }

  override get currentTime(): number {
    return this.playerState.currentTime;
  }

  override set currentTime(seconds: number) {
    this.seek(seconds);
  }

  override get duration(): number {
    return this.playerState.duration;
  }

  override get muted(): boolean {
    return this.playerState.muted;
  }

  override set muted(value: boolean) {
    if (value) {
      this.mute();
    } else {
      this.unmute();
    }
  }

  override get volume(): number {
    return this.playerState.volume ?? 1;
  }

  override set volume(vol: number) {
    const v = Math.max(0, Math.min(1, vol));
    this.playerState.volume = v;
    if (this.iframe?.contentWindow) {
      this.iframe.contentWindow.postMessage(
        {
          eventName: PlayerCommands.SET_VOLUME,
          params: v,
          namespace: NS_PLAYER_PROXY,
        },
        EMBED_ORIGIN
      );
    }
  }

  override get error() {
    return this.playerState.error;
  }
}

if (globalThis.customElements && !globalThis.customElements.get("twitch-video")) {
  globalThis.customElements.define("twitch-video", TwitchEmbedPlayer);
}
