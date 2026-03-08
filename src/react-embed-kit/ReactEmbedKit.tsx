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
  onUnsupportedUrl?: (url: string) => void;
  onError?: (data: IErrorData) => void;
  onReady?: (player: IEmbedPlayer) => void;
  onPlay?: () => void;
  onPause?: () => void;
  onBuffering?: () => void;
  onEnded?: () => void;
  onProgress?: (currentTime: number) => void;
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
      p?.destroy?.();
    };
  }, [url, playerOptions.width, playerOptions.height, playerOptions.autoplay]);

  return <div ref={containerRef} className={className} style={style} />;
}
