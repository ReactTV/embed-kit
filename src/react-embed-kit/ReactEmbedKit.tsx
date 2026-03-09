import { useRef, useEffect, useState } from "react";
import type { ICreatePlayerOptions, IEmbedPlayer, IEmbedProgressEvent, IErrorData, IMuteData } from "../elements/_base/player.js";
import { getProviderForUrl, loadPlayerModule } from "./providers.js";

/** Props for ReactEmbedKit. Callbacks and options are typed explicitly so they infer correctly (no index signature). */
export interface ReactEmbedKitProps {
  url: string;
  width?: number;
  height?: number;
  className?: string;
  style?: React.CSSProperties;
  autoplay?: boolean;
  /** When set, syncs play/pause to the player (e.g. playing={true} calls play()). Undefined is treated as false. */
  playing?: boolean;
  /** When true, requests picture-in-picture when ready. Only if the provider supports it. */
  pip?: boolean;
  /** Initial volume 0–1. Not all providers support volume. */
  volume?: number;
  progressInterval?: number;
  /** Show native player controls. Default true. YouTube: playerVars.controls. */
  controls?: boolean;
  /** Load captions by default when available. YouTube: cc_load_policy. */
  enableCaptions?: boolean;
  /** Show video annotations (e.g. YouTube cards). YouTube: iv_load_policy (1 = show, 3 = hide). */
  showAnnotations?: boolean;
  /** Provider-specific config. e.g. config={{ youtube: { origin }, vimeo: { title: 0 } }}. */
  config?: {
    youtube?: Record<string, number | string | undefined>;
    vimeo?: Record<string, number | string | undefined>;
  };
  /** Ref set to the embed element (play, pause, currentTime, etc.) when ready. Cleared on unmount. */
  playerRef?: React.Ref<IEmbedPlayer | null>;
  onUnsupportedUrl?: (url: string) => void;
  onError?: (data: IErrorData) => void;
  onReady?: (player: IEmbedPlayer) => void;
  onPlay?: () => void;
  onPause?: () => void;
  onBuffering?: () => void;
  onEnded?: () => void;
  /** Fired on progress interval. event.target is the embed element (currentTime get/set); event.detail is currentTime. */
  onProgress?: (event: IEmbedProgressEvent) => void;
  /** Fired when duration is known or changes (e.g. after metadata load). */
  onDurationChange?: (duration: number) => void;
  onSeeking?: () => void;
  onSeek?: (currentTime: number) => void;
  onMute?: (data: IMuteData) => void;
  onPlaybackQualityChange?: (quality: string) => void;
  onPlaybackRateChange?: (rate: number) => void;
  onAutoplayBlocked?: () => void;
  onApiChange?: () => void;
}

const defaultWidth = 560;
const defaultHeight = 315;

export function ReactEmbedKit({
  url,
  playerRef: playerRefProp,
  onUnsupportedUrl,
  onError = () => {},
  onReady = () => {},
  className,
  style,
  width = defaultWidth,
  height = defaultHeight,
  playing,
  pip,
  autoplay,
  volume,
  progressInterval,
  controls,
  enableCaptions,
  showAnnotations,
  config,
  onPlay,
  onPause,
  onBuffering,
  onEnded,
  onProgress,
  onDurationChange,
  onSeeking,
  onSeek,
  onMute,
  onPlaybackQualityChange,
  onPlaybackRateChange,
  onAutoplayBlocked,
  onApiChange,
}: ReactEmbedKitProps): React.ReactElement {
  const containerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<IEmbedPlayer | null>(null);
  const playerRefPropRef = useRef(playerRefProp);
  playerRefPropRef.current = playerRefProp;
  const [playerReady, setPlayerReady] = useState<IEmbedPlayer | null>(null);

  const optionsRef = useRef({
    onReady,
    onError,
    onPlay,
    onPause,
    onBuffering,
    onEnded,
    onProgress,
    onDurationChange,
    onSeeking,
    onSeek,
    onMute,
    onPlaybackQualityChange,
    onPlaybackRateChange,
    onAutoplayBlocked,
    onApiChange,
  });
  optionsRef.current = {
    onReady,
    onError,
    onPlay,
    onPause,
    onBuffering,
    onEnded,
    onProgress,
    onDurationChange,
    onSeeking,
    onSeek,
    onMute,
    onPlaybackQualityChange,
    onPlaybackRateChange,
    onAutoplayBlocked,
    onApiChange,
  };

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const resolved = getProviderForUrl(url);
    if (!resolved) {
      onUnsupportedUrl?.(url);
      return;
    }

    const { tagName, url: embedUrl } = resolved;
    let cancelled = false;
    let element: HTMLElement & IEmbedPlayer | null = null;

    const opts: ICreatePlayerOptions = {
      width,
      height,
      ...(autoplay !== undefined && { autoplay }),
      ...(volume !== undefined && { volume }),
      ...(progressInterval !== undefined && { progressInterval }),
      ...(controls !== undefined && { controls }),
      ...(enableCaptions !== undefined && { enableCaptions }),
      ...(showAnnotations !== undefined && { showAnnotations }),
      ...(config !== undefined && { config }),
    };

    loadPlayerModule(tagName)
      .then(() => {
        if (cancelled) return;
        container.innerHTML = "";
        const el = document.createElement(tagName) as HTMLElement & IEmbedPlayer;
        element = el;

        (el as unknown as { options: ICreatePlayerOptions }).options = opts;
        (el as unknown as { optionsRef: typeof optionsRef }).optionsRef = optionsRef;
        el.setAttribute("src", embedUrl);
        el.setAttribute("width", String(width));
        el.setAttribute("height", String(height));
        el.setAttribute("title", "Embed");

        el.addEventListener("error", (e: Event) => {
          const detail = (e as CustomEvent).detail as IErrorData | undefined;
          optionsRef.current.onError?.(detail ?? { message: "Unknown error" });
        });
        el.addEventListener("ready", () => {
          if (cancelled) return;
          playerRef.current = el;
          setPlayerReady(el);
          const ref = playerRefPropRef.current;
          if (ref != null) {
            if (typeof ref === "function") ref(el);
            else (ref as React.MutableRefObject<IEmbedPlayer | null>).current = el;
          }
          optionsRef.current.onReady?.(el);
        });
        el.addEventListener("play", () => optionsRef.current.onPlay?.());
        el.addEventListener("pause", () => optionsRef.current.onPause?.());
        el.addEventListener("buffering", () => optionsRef.current.onBuffering?.());
        el.addEventListener("ended", () => optionsRef.current.onEnded?.());
        el.addEventListener("durationchange", (e: Event) => {
          const d = (e as CustomEvent).detail as number | undefined;
          if (typeof d === "number") optionsRef.current.onDurationChange?.(d);
        });
        el.addEventListener("seeking", () => optionsRef.current.onSeeking?.());
        el.addEventListener("seek", (e: Event) => {
          const t = (e as CustomEvent).detail as number | undefined;
          if (typeof t === "number") optionsRef.current.onSeek?.(t);
        });
        el.addEventListener("mute", (e: Event) => {
          const detail = (e as CustomEvent).detail;
          const muted = typeof detail === "boolean" ? detail : (detail as IMuteData)?.muted ?? false;
          optionsRef.current.onMute?.({ muted });
        });
        el.addEventListener("playbackqualitychange", (e: Event) => {
          const q = (e as CustomEvent).detail as string | undefined;
          if (q != null) optionsRef.current.onPlaybackQualityChange?.(q);
        });
        el.addEventListener("playbackratechange", (e: Event) => {
          const r = (e as CustomEvent).detail as number | undefined;
          if (typeof r === "number") optionsRef.current.onPlaybackRateChange?.(r);
        });
        el.addEventListener("autoplayblocked", () => optionsRef.current.onAutoplayBlocked?.());
        el.addEventListener("apichange", () => optionsRef.current.onApiChange?.());

        container.appendChild(el);
      })
      .catch((err) => {
        if (!cancelled) {
          optionsRef.current.onError?.({ message: err?.message ?? String(err) });
        }
      });

    return () => {
      cancelled = true;
      setPlayerReady(null);
      playerRef.current = null;
      const ref = playerRefPropRef.current;
      if (ref != null) {
        if (typeof ref === "function") ref(null);
        else (ref as React.MutableRefObject<IEmbedPlayer | null>).current = null;
      }
      try {
        element?.destroy?.();
      } finally {
        container.innerHTML = "";
      }
    };
  }, [
    url,
    width,
    height,
    autoplay,
    controls,
    enableCaptions,
    showAnnotations,
    progressInterval,
  ]);

  // Sync controlled playing state to the player when it or the player changes.
  useEffect(() => {
    if (!playerReady) return;
    if (playing) {
      void playerReady.play();
    } else {
      playerReady.pause();
    }
  }, [playing, playerReady]);

  // Request pip when player is ready, if pip prop is true.
  useEffect(() => {
    if (!pip || !playerReady) return;
    playerReady.requestPictureInPicture?.();
  }, [pip, playerReady]);

  return <div ref={containerRef} className={className} style={style} />;
}
