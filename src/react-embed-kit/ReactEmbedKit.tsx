import { useRef, useEffect } from "react";
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
  /** Ref set to the IEmbedPlayer when ready and cleared on unmount. Use for play/pause/seek and error (e.g. playerRef.current?.play(), playerRef.current?.error). */
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

function setRef<T>(ref: React.Ref<T> | undefined, value: T | null): void {
  if (ref == null) return;
  if (typeof ref === "function") {
    ref(value);
  } else {
    (ref as React.MutableRefObject<T | null>).current = value;
  }
}

export function ReactEmbedKit({
  url,
  playerRef: playerRefProp,
  onUnsupportedUrl,
  onError = () => {},
  onReady = () => {},
  className,
  style,
  ...playerOptions
}: ReactEmbedKitProps): React.ReactElement {
  const containerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<IEmbedPlayer | null>(null);

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
      width: playerOptions.width ?? defaultWidth,
      height: playerOptions.height ?? defaultHeight,
      ...playerOptions,
      onReady: noop,
      onError,
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
        setRef(playerRefProp, player);
        onReady(player);
      })
      .catch((err) => {
        if (!cancelled) {
          onError({ message: err?.message ?? String(err) });
        }
      });

    return () => {
      cancelled = true;
      const p = playerRef.current;
      playerRef.current = null;
      setRef(playerRefProp, null);
      try {
        p?.destroy?.();
      } finally {
        container.innerHTML = "";
      }
    };
  }, [
    url,
    playerRefProp,
    playerOptions.width,
    playerOptions.height,
    playerOptions.autoplay,
    playerOptions.controls,
    playerOptions.enableCaptions,
    playerOptions.showAnnotations,
    playerOptions.progressInterval,
  ]);

  return <div ref={containerRef} className={className} style={style} />;
}
