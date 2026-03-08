import { useRef, useEffect } from "react";
import type {
  ICreatePlayerOptions,
  IEmbedPlayer,
  IErrorData,
  IMuteData,
  IProgressData,
  ISeekData,
} from "../_base/index.js";
import { getProviderForUrl } from "./providers.js";

export interface ReactEmbedKitProps extends Omit<ICreatePlayerOptions, "onError" | "onReady"> {
  url: string;
  onUnsupportedUrl?: (url: string) => void;
  onError?: (data: IErrorData) => void;
  onReady?: (player: IEmbedPlayer) => void;
  width?: number;
  height?: number;
  className?: string;
  style?: React.CSSProperties;
}

const defaultWidth = 560;
const defaultHeight = 315;

export function ReactEmbedKit({
  url,
  width,
  height,
  autoplay,
  onReady = () => {},
  onPlay,
  onPause,
  onBuffering,
  onEnded,
  onProgress,
  onSeeking,
  onSeek,
  onMute,
  onError = () => {},
  onUnsupportedUrl = () => {},
  className,
  style,
  ...restOptions
}: ReactEmbedKitProps): React.ReactElement {
  const containerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<IEmbedPlayer | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const resolved = getProviderForUrl(url);
    if (!resolved) {
      onUnsupportedUrl(url);
      return;
    }

    // Clear any previous player DOM so the new embed isn't covered (handles URL change
    // before the previous createPlayer promise resolved, so destroy() was never called).
    container.innerHTML = "";
    const { provider, id, options: providerOptions } = resolved;
    const mergedOptions: ICreatePlayerOptions = {
      width: width ?? defaultWidth,
      height: height ?? defaultHeight,
      autoplay: Boolean(autoplay),
      onError,
      ...providerOptions,
      ...restOptions,
    };
    if (typeof onPlay === "function") mergedOptions.onPlay = onPlay as () => void;
    if (typeof onPause === "function") mergedOptions.onPause = onPause as () => void;
    if (typeof onBuffering === "function") mergedOptions.onBuffering = onBuffering as () => void;
    if (typeof onEnded === "function") mergedOptions.onEnded = onEnded as () => void;
    if (typeof onProgress === "function")
      mergedOptions.onProgress = onProgress as (data: IProgressData) => void;
    if (typeof onSeeking === "function") mergedOptions.onSeeking = onSeeking as () => void;
    if (typeof onSeek === "function") mergedOptions.onSeek = onSeek as (data: ISeekData) => void;
    if (typeof onMute === "function") mergedOptions.onMute = onMute as (data: IMuteData) => void;

    let cancelled = false;
    const promise = provider.createPlayer(container, id, mergedOptions);

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
  }, [url, width, height, autoplay]);

  return <div ref={containerRef} className={className} style={style} />;
}
