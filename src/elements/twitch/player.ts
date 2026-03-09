import { createEmbedIframeElement, EmbedPlayerVideoElement } from "../_base/index.js";
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
  // eslint-disable-next-line
  `${getTwitchEmbedSrc(url)}&parent=${encodeURIComponent(window.location.hostname)}&controls=${controls}&autoplay=${autoplay}`;

/**
 * Twitch embed player as a subclass of EmbedPlayerVideoElement.
 */
class TwitchEmbedPlayer extends EmbedPlayerVideoElement {
  connectedCallback(): void {
    const src = this.getAttribute("src");

    if (!src) return;

    const controls = Boolean(this.getAttribute("controls") ?? true);
    const autoplay = Boolean(this.getAttribute("autoplay") ?? false);

    const iframeSrc = generateIframeSrc({ url: src, controls, autoplay });

    const width = this.getAttribute("width") ?? 560;
    const height = this.getAttribute("height") ?? 315;
    const iframe = createEmbedIframeElement({
      src: iframeSrc,
      width: Number(width),
      height: Number(height),
      allow: "accelerometer; fullscreen; autoplay; encrypted-media; picture-in-picture",
      allowFullScreen: true,
    });

    this.appendChild(iframe);

    const send = (command: number, params?: number | boolean): void => {
      if (!iframe.contentWindow) return;
      iframe.contentWindow.postMessage(
        { eventName: command, params, namespace: NS_PLAYER_PROXY },
        EMBED_ORIGIN
      );
    };

    const handleMessage = (event: MessageEvent): void => {
      const enableCaptions = this.getAttribute("captions") === "true";
      if (event.source !== iframe.contentWindow || event.origin !== EMBED_ORIGIN) return;
      const message = event.data as TTwitchMessage;

      if (message.namespace === NS_EMBED) {
        if (message.eventName === "ready") {
          if (enableCaptions !== undefined) {
            send(enableCaptions ? PlayerCommands.ENABLE_CAPTIONS : PlayerCommands.DISABLE_CAPTIONS);
          }
          this.dispatchEvent(new Event("ready"));
        }
        if (message.eventName === "error") {
          const msg = message.params?.message ?? "Twitch embed error";
          const customError = { code: 0, message: msg } as MediaError;
          this.playerState.error = customError;
          this.dispatchEvent(new CustomEvent("error", { detail: this.playerState.error }));
        }
        if (message.eventName === "seek") {
          this.playerState.currentTime = message.params.position;
          this.dispatchEvent(new CustomEvent("seek", { detail: message.params.position }));
        }
        if (
          message.eventName === "play" ||
          message.eventName === "playing" ||
          message.eventName === "video.play"
        ) {
          this.dispatchEvent(new Event("play"));
        }
      }
      if (message.namespace === NS_PLAYER_PROXY && message.eventName === "UPDATE_STATE") {
        const p = message.params;
        const isPlaying = p.playback === PlaybackState.PLAYING;
        if (isPlaying && !this.playerState.isPlaying) this.dispatchEvent(new Event("play"));
        if (!isPlaying && this.playerState.isPlaying) this.dispatchEvent(new Event("pause"));
        if (p.playback === PlaybackState.BUFFERING) this.dispatchEvent(new Event("buffering"));
        if (p.playback === PlaybackState.ENDED) this.dispatchEvent(new Event("ended"));
        this.playerState.isPlaying = isPlaying;
        this.playerState.isPaused = !isPlaying;
        this.playerState.currentTime = p.currentTime;
        if (p.duration !== this.playerState.duration) {
          this.playerState.duration = p.duration;
          this.dispatchEvent(new CustomEvent("durationchange", { detail: p.duration }));
        }
        if (typeof p.muted === "boolean") this.playerState.muted = p.muted;
        if (typeof p.volume === "number" && !Number.isNaN(p.volume))
          this.playerState.volume = p.volume;
        this.emitProgress(p.currentTime);
      }
    };

    this.iframe = iframe;
    this.handleMessage = handleMessage;

    window.addEventListener("message", handleMessage);
  }

  override play(): Promise<void> {
    this.playerState.isPaused = false;
    if (this.iframe?.contentWindow) {
      this.iframe.contentWindow.postMessage(
        { eventName: PlayerCommands.PLAY, params: undefined, namespace: NS_PLAYER_PROXY },
        EMBED_ORIGIN
      );
    }
    this.dispatchEvent(new Event("play"));
    return Promise.resolve();
  }
  override pause(): Promise<void> {
    this.playerState.isPaused = true;
    if (this.iframe?.contentWindow) {
      this.iframe.contentWindow.postMessage(
        { eventName: PlayerCommands.PAUSE, params: undefined, namespace: NS_PLAYER_PROXY },
        EMBED_ORIGIN
      );
    }
    this.dispatchEvent(new Event("pause"));
    return Promise.resolve();
  }
  override seek(seconds: number): void {
    if (this.iframe?.contentWindow) {
      this.iframe.contentWindow.postMessage(
        { eventName: PlayerCommands.SEEK, params: seconds, namespace: NS_PLAYER_PROXY },
        EMBED_ORIGIN
      );
    }
    this.playerState.currentTime = seconds;
    this.dispatchEvent(new CustomEvent("seek", { detail: seconds }));
  }
  override mute(): void {
    this.playerState.muted = true;
    if (this.iframe?.contentWindow) {
      this.iframe.contentWindow.postMessage(
        { eventName: PlayerCommands.SET_MUTED, params: true, namespace: NS_PLAYER_PROXY },
        EMBED_ORIGIN
      );
    }
    this.dispatchEvent(new CustomEvent("mute", { detail: true }));
  }
  override unmute(): void {
    this.playerState.muted = false;
    if (this.iframe?.contentWindow) {
      this.iframe.contentWindow.postMessage(
        { eventName: PlayerCommands.SET_MUTED, params: false, namespace: NS_PLAYER_PROXY },
        EMBED_ORIGIN
      );
    }
    this.dispatchEvent(new CustomEvent("unmute", { detail: false }));
  }
  override destroy(): void {
    window.removeEventListener("message", this.handleMessage);
    if (this.iframe?.parentNode) this.iframe.remove();
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
  override get volume(): number {
    return this.playerState.volume ?? 1;
  }
  override set volume(vol: number) {
    const v = Math.max(0, Math.min(1, vol));
    this.playerState.volume = v;
    if (this.iframe?.contentWindow) {
      this.iframe.contentWindow.postMessage(
        { eventName: PlayerCommands.SET_VOLUME, params: v, namespace: NS_PLAYER_PROXY },
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
