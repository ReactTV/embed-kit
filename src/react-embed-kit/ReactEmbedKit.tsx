import React, { useRef, useEffect } from "react";
import { mergeRefs } from "react-merge-refs";
import "./embed-elements.js";
import "../elements/youtube/player.js";
import type { EmbedPlayerRef, TDispatchedEventPayloads } from "../elements/_base/player.types.js";
import { DISPATCHED_EVENTS, IDispatchedEventCallbacks } from "../elements/_base/index.js";

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
  enableCaptions?: boolean;
  showAnnotations?: boolean;
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
  enableCaptions = false,
  showAnnotations = true,
  playing,
  onReady,
  onPlay,
  onPause,
  onBuffering,
  onEnded,
  onProgress,
  playerRef,
  volume,
}: ReactEmbedKitProps): React.ReactElement {
  const elementRef = useRef<EmbedPlayerRef>(null);

  // Wire ready + other events from the custom element
  useEffect(() => {
    const el = elementRef.current;
    if (!el) return;
    const onReadyHandler = () => onReady?.();
    const onPlayHandler = () => onPlay?.();
    const onPauseHandler = () => onPause?.();
    const onBufferingHandler = () => onBuffering?.();
    const onEndedHandler = () => onEnded?.();
    const onProgressHandler = (event: CustomEvent<TDispatchedEventPayloads["onProgress"]>) => {
      onProgress?.(event.detail);
    };

    el.addEventListener(DISPATCHED_EVENTS.ready, onReadyHandler);
    el.addEventListener(DISPATCHED_EVENTS.play, onPlayHandler);
    el.addEventListener(DISPATCHED_EVENTS.pause, onPauseHandler);
    el.addEventListener(DISPATCHED_EVENTS.buffering, onBufferingHandler);
    el.addEventListener(DISPATCHED_EVENTS.ended, onEndedHandler);
    el.addEventListener(DISPATCHED_EVENTS.progress, onProgressHandler as EventListener);
    return () => {
      el.removeEventListener(DISPATCHED_EVENTS.ready, onReadyHandler);
      el.removeEventListener(DISPATCHED_EVENTS.play, onPlayHandler);
      el.removeEventListener(DISPATCHED_EVENTS.pause, onPauseHandler);
      el.removeEventListener(DISPATCHED_EVENTS.buffering, onBufferingHandler);
      el.removeEventListener(DISPATCHED_EVENTS.ended, onEndedHandler);
      el.removeEventListener(DISPATCHED_EVENTS.progress, onProgressHandler as EventListener);
    };
  }, [onReady]);

  return (
    <youtube-video
      ref={mergeRefs([elementRef, playerRef])}
      muted={muted}
      playing={playing ? "true" : "false"}
      src={url}
      width={width}
      height={height}
      controls={controls ? "true" : "false"}
      enableCaptions={enableCaptions ? "true" : "false"}
      showAnnotations={showAnnotations ? "true" : "false"}
      volume={volume}
    />
  );
}
