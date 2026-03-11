import React, { useRef, useEffect } from "react";
import { mergeRefs } from "react-merge-refs";
import "./embed-elements.js";
import "../elements/youtube/player.js";
import type { EmbedPlayerRef, TDispatchedEventPayloads } from "../elements/_base/player.types.js";
import { IDispatchedEventCallbacks } from "../elements/_base/index.js";

export type ReactEmbedKitProps = IDispatchedEventCallbacks & {
  url: string;
  width?: number;
  height?: number;
  className?: string;
  style?: React.CSSProperties;
  autoplay?: boolean;
  playing?: boolean;
  pip?: boolean;
  muted?: boolean;
  volume?: number; // 0-100
  seekTo?: number | null;
  progressInterval?: number;
  controls?: boolean;
  captions?: boolean;
  annotations?: boolean;
  config?: {
    youtube?: Record<string, number | string | undefined>;
    vimeo?: Record<string, number | string | undefined>;
  };
  playerRef?: React.Ref<EmbedPlayerRef>;
  onUnsupportedUrl?: (url: string) => void;
};

export function ReactEmbedKit({
  muted,
  url,
  width,
  height,
  controls = true,
  captions,
  annotations,
  playing,
  onReady,
  onPlay,
  onPause,
  onBuffering,
  onEnded,
  onProgress,
  onVolumeChange,
  onMuteChange,
  playerRef,
  volume,
}: ReactEmbedKitProps): React.ReactElement {
  const elementRef = useRef<EmbedPlayerRef>(null);

  // Wire ready + other events from the custom element
  useEffect(() => {
    const el = elementRef.current;
    if (!el) return;

    const handlers = {
      onReady: () => onReady?.(),
      onPlay: () => onPlay?.(),
      onPause: () => onPause?.(),
      onBuffering: () => onBuffering?.(),
      onEnded: () => onEnded?.(),
      onProgress: (event: CustomEvent<TDispatchedEventPayloads["onProgress"]>) => {
        onProgress?.(event.detail);
      },
      onVolumeChange: (event: CustomEvent<TDispatchedEventPayloads["onVolumeChange"]>) => {
        onVolumeChange?.(event.detail);
      },
      onMuteChange: (event: CustomEvent<TDispatchedEventPayloads["onMuteChange"]>) => {
        onMuteChange?.(event.detail);
      },
    };

    Object.entries(handlers).forEach(([event, handler]) => {
      el.addEventListener(event, handler as EventListener);
    });

    return () => {
      Object.entries(handlers).forEach(([event, handler]) => {
        el.removeEventListener(event, handler as EventListener);
      });
    };
  }, [onReady, onPlay, onPause, onBuffering, onEnded, onProgress, onVolumeChange, onMuteChange]);

  return (
    <youtube-video
      ref={mergeRefs([elementRef, playerRef])}
      muted={muted}
      playing={playing?.toString()}
      src={url}
      width={width}
      height={height}
      controls={controls.toString()}
      captions={captions?.toString()}
      annotations={annotations?.toString()}
      volume={volume}
    />
  );
}
