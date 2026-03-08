import { useRef, useEffect, useState } from "react";
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
  /** Full URL to the video (e.g. YouTube watch link, Twitch video URL, TikTok URL). The correct embed provider is chosen automatically. */
  url: string;
  /** Optional callback when the URL could not be matched to any supported provider. */
  onUnsupportedUrl?: (url: string) => void;
  /** Called when the embed reports an error. */
  onError?: (data: IErrorData) => void;
  /** Called with the player instance when the embed is ready (use for play, pause, seek, mute, etc.). */
  onReady?: (player: IEmbedPlayer) => void;
  /** Width in pixels (default 560). */
  width?: number;
  /** Height in pixels (default 315). */
  height?: number;
  /** Root element class name. */
  className?: string;
  /** Inline styles for the root element. */
  style?: React.CSSProperties;
}

const defaultWidth = 560;
const defaultHeight = 315;

/**
 * React wrapper for embed-kit: pass a video URL and the correct provider (YouTube, Twitch, TikTok, Dailymotion, Vimeo) is chosen automatically.
 * Renders a single div that hosts the embed; play/pause and other controls are available via the embed's callbacks or by using a ref and calling the player API.
 */
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
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const resolved = getProviderForUrl(url);
    if (!resolved) {
      setError(`Unsupported URL: ${url}`);
      onUnsupportedUrl(url);
      return;
    }

    setError(null);
    // Clear any previous player DOM so the new embed isn't covered (handles URL change
    // before the previous createPlayer promise resolved, so destroy() was never called).
    container.innerHTML = "";
    const { provider, id, options: providerOptions } = resolved;
    const mergedOptions: ICreatePlayerOptions = {
      width: width ?? defaultWidth,
      height: height ?? defaultHeight,
      autoplay: Boolean(autoplay),
      onError: (data: IErrorData) => {
        setError(data.message ?? String(data.code ?? "Unknown error"));
        onError(data);
      },
      ...providerOptions,
      ...restOptions,
    };
    if (typeof onPlay === "function") mergedOptions.onPlay = onPlay as () => void;
    if (typeof onPause === "function") mergedOptions.onPause = onPause as () => void;
    if (typeof onBuffering === "function") mergedOptions.onBuffering = onBuffering as () => void;
    if (typeof onEnded === "function") mergedOptions.onEnded = onEnded as () => void;
    if (typeof onProgress === "function") mergedOptions.onProgress = onProgress as (data: IProgressData) => void;
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
          setError(err?.message ?? String(err));
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

  const w = `${width ?? defaultWidth}px`;
  const h = `${height ?? defaultHeight}px`;

  return (
    <div
      className={className}
      style={{
        position: "relative",
        width: w,
        height: h,
        minWidth: w,
        minHeight: h,
        ...style,
      }}
    >
      <div
        ref={containerRef}
        style={{
          width: "100%",
          height: "100%",
          overflow: "hidden",
        }}
      />
      {error !== null ? (
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "#f5f5f5",
            color: "#666",
            fontSize: "14px",
          }}
        >
          {error}
        </div>
      ) : null}
    </div>
  );
}
