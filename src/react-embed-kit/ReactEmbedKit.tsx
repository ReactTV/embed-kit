import { useRef, useEffect, useState } from "react";
import type {
  EmbedPlayerRef,
  ICreatePlayerOptions,
  IEmbedProgressEvent,
  IErrorData,
  IMuteData,
} from "../elements/_base/player.js";
import { getProviderForUrl, loadPlayerModule } from "./providers.js";

export interface ReactEmbedKitProps {
  url: string;
  width?: number;
  height?: number;
  className?: string;
  style?: React.CSSProperties;
  autoplay?: boolean;
  playing?: boolean;
  pip?: boolean;
  muted?: boolean;
  volume?: number;
  progressInterval?: number;
  controls?: boolean;
  enableCaptions?: boolean;
  showAnnotations?: boolean;
  config?: {
    youtube?: Record<string, number | string | undefined>;
    vimeo?: Record<string, number | string | undefined>;
  };
  playerRef?: React.Ref<EmbedPlayerRef>;
  onUnsupportedUrl?: (url: string) => void;
  onError?: (data: IErrorData) => void;
  onReady?: (player: NonNullable<EmbedPlayerRef>) => void;
  onPlay?: () => void;
  onPause?: () => void;
  onBuffering?: () => void;
  onEnded?: () => void;
  onProgress?: (event: IEmbedProgressEvent) => void;
  onDurationChange?: (duration: number) => void;
  onSeeking?: () => void;
  onSeek?: (currentTime: number) => void;
  onMute?: (data: IMuteData) => void;
  onPlaybackQualityChange?: (quality: string) => void;
  onPlaybackRateChange?: (rate: number) => void;
  onAutoplayBlocked?: () => void;
  onApiChange?: () => void;
}

export function ReactEmbedKit({
  url,
  playerRef: playerRefProp,
  onUnsupportedUrl,
  onError = () => {},
  onReady = () => {},
  className,
  style,
  width,
  height,
  playing,
  pip,
  autoplay,
  muted,
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
  const playerRef = useRef<NonNullable<EmbedPlayerRef> | null>(null);
  const playerRefPropRef = useRef(playerRefProp);
  playerRefPropRef.current = playerRefProp;
  const [playerReady, setPlayerReady] = useState<NonNullable<EmbedPlayerRef> | null>(null);

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
    let element: NonNullable<EmbedPlayerRef> | null = null;

    const opts: ICreatePlayerOptions = {
      width,
      height,
      ...(autoplay !== undefined && { autoplay }),
      ...(muted !== undefined && { muted }),
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
        const el = document.createElement(tagName) as unknown as NonNullable<EmbedPlayerRef>;
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
          const elAsVideo = el as unknown as NonNullable<EmbedPlayerRef>;
          playerRef.current = elAsVideo;
          setPlayerReady(el);
          const ref = playerRefPropRef.current;
          if (ref != null) {
            if (typeof ref === "function") ref(elAsVideo);
            else (ref as { current: EmbedPlayerRef }).current = elAsVideo;
          }
          optionsRef.current.onReady?.(elAsVideo);
          // Report initial muted state so the parent app can sync its UI
          optionsRef.current.onMute?.({ muted: elAsVideo.muted });
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
          const isMuted =
            typeof detail === "boolean" ? detail : ((detail as IMuteData)?.muted ?? false);
          optionsRef.current.onMute?.({ muted: isMuted });
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
        else (ref as { current: EmbedPlayerRef }).current = null;
      }
      try {
        (element as { destroy?: () => void })?.destroy?.();
      } finally {
        container.innerHTML = "";
      }
    };
  }, [url, width, height, autoplay, controls, enableCaptions, showAnnotations, progressInterval]);

  // Sync controlled playing state to the player when it or the player changes.
  useEffect(() => {
    if (!playerReady) return;
    if (playing) {
      void playerReady.play();
    } else {
      playerReady.pause();
    }
  }, [playing, playerReady]);

  // Sync volume prop to the player when it or the player changes.
  useEffect(() => {
    if (!playerReady || volume === undefined) return;
    const v = Math.max(0, Math.min(1, volume));
    playerReady.volume = v;
  }, [volume, playerReady]);

  // Sync muted prop to the player when it or the player changes (avoids remounting when parent updates muted/volume).
  useEffect(() => {
    if (!playerReady || muted === undefined) return;
    playerReady.muted = muted;
  }, [muted, playerReady]);

  // Request pip when player is ready, if pip prop is true.
  useEffect(() => {
    if (!pip || !playerReady) return;
    playerReady.requestPictureInPicture?.();
  }, [pip, playerReady]);

  return <div ref={containerRef} className={className} style={style} />;
}
