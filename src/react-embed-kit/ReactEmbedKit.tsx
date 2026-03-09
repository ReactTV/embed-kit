import { useRef, useEffect, useState } from "react";
import type { IEmbedPlayer, IErrorData, IMuteData } from "../_base/index.js";
import { getProviderForUrl } from "./providers.js";

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
  /** Ref set to EmbedPlayerVideoElement when ready (play, pause, currentTime, addEventListener). Cleared on unmount. */
  playerRef?: React.Ref<IEmbedPlayer | null>;
  onUnsupportedUrl?: (url: string) => void;
  onError?: (data: IErrorData) => void;
  onReady?: (player: IEmbedPlayer) => void;
  onPlay?: () => void;
  onPause?: () => void;
  onBuffering?: () => void;
  onEnded?: () => void;
  onProgress?: (currentTime: number) => void;
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

const noop = () => {};

export function ReactEmbedKit({
  url,
  playerRef: playerRefProp,
  onUnsupportedUrl,
  onError = () => {},
  onReady = () => {},
  className,
  style,
  playing,
  pip,
  ...playerOptions
}: ReactEmbedKitProps): React.ReactElement {
  const containerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<IEmbedPlayer | null>(null);
  const playerRefPropRef = useRef(playerRefProp);
  playerRefPropRef.current = playerRefProp;
  const optionsRef = useRef({ ...playerOptions, onReady, onError });
  optionsRef.current = { ...playerOptions, onReady, onError };
  const [playerReady, setPlayerReady] = useState<IEmbedPlayer | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const resolved = getProviderForUrl(url);
    if (!resolved) {
      onUnsupportedUrl?.(url);
      return;
    }

    container.innerHTML = "";
    const { provider, id } = resolved;

    let cancelled = false;
    const promise = provider.createPlayer(container, id, {
      ...playerOptions,
      url,
      width: playerOptions.width ?? defaultWidth,
      height: playerOptions.height ?? defaultHeight,
      onReady: noop,
      onError: (data) => optionsRef.current.onError?.(data),
      onPlay: () => optionsRef.current.onPlay?.(),
      onPause: () => optionsRef.current.onPause?.(),
      onBuffering: () => optionsRef.current.onBuffering?.(),
      onEnded: () => optionsRef.current.onEnded?.(),
      onProgress: (t) => optionsRef.current.onProgress?.(t),
      onDurationChange: (d) => optionsRef.current.onDurationChange?.(d),
      onSeeking: () => optionsRef.current.onSeeking?.(),
      onSeek: (t) => optionsRef.current.onSeek?.(t),
      onMute: (data) => optionsRef.current.onMute?.(data),
      onPlaybackQualityChange: (q) => optionsRef.current.onPlaybackQualityChange?.(q),
      onPlaybackRateChange: (r) => optionsRef.current.onPlaybackRateChange?.(r),
      onAutoplayBlocked: () => optionsRef.current.onAutoplayBlocked?.(),
      onApiChange: () => optionsRef.current.onApiChange?.(),
    });

    promise
      .then((player) => {
        if (cancelled) {
          try {
            player.destroy?.();
          } catch {
            // Container may already have been cleared when URL changed
          }
          return;
        }
        playerRef.current = player;
        const ref = playerRefPropRef.current;
        if (ref != null) {
          if (typeof ref === "function") ref(player);
          else (ref as React.RefObject<IEmbedPlayer | null>).current = player;
        }
        setPlayerReady(player);
        optionsRef.current.onReady?.(player);
      })
      .catch((err) => {
        if (!cancelled) {
          optionsRef.current.onError?.({ message: err?.message ?? String(err) });
        }
      });

    return () => {
      cancelled = true;
      setPlayerReady(null);
      const p = playerRef.current;
      playerRef.current = null;
      const ref = playerRefPropRef.current;
      if (ref != null) {
        if (typeof ref === "function") ref(null);
        else (ref as React.RefObject<IEmbedPlayer | null>).current = null;
      }
      try {
        p?.destroy?.();
      } finally {
        container.innerHTML = "";
      }
    };
  }, [
    url,
    playerOptions.width,
    playerOptions.height,
    playerOptions.autoplay,
    playerOptions.controls,
    playerOptions.enableCaptions,
    playerOptions.showAnnotations,
    playerOptions.progressInterval,
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
