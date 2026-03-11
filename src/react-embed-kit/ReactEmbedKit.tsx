import React, { useRef, useEffect, useState } from "react";
import { mergeRefs } from "react-merge-refs";
import "./embed-elements.js";
import { getProviderForUrl, loadPlayerModule, EMBED_TAG } from "./providers.js";
import type { EmbedPlayerRef, TDispatchedEventPayloads, IDispatchedEventCallbacks } from "../elements/_base/player.types.js";
import type { EmbedTagName } from "./providers.js";

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
  const [isClient, setIsClient] = useState(false);
  const [tagReady, setTagReady] = useState(false);

  const resolved = getProviderForUrl(url) ?? {
    tagName: EMBED_TAG.YOUTUBE as EmbedTagName,
    url,
  };

  // Only run in browser so custom element code (HTMLElement) is never evaluated on the server
  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!isClient) return;
    setTagReady(false);
    loadPlayerModule(resolved.tagName).then(() => setTagReady(true));
  }, [isClient, resolved.tagName]);

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

  if (!isClient || !tagReady) {
    return <div style={{ width: width ?? "100%", height: height ?? "100%", minHeight: 200 }} />;
  }

  const embedProps = {
    ref: mergeRefs([elementRef, playerRef]),
    muted,
    playing: playing?.toString(),
    src: resolved.url,
    width,
    height,
    controls: controls.toString(),
    captions: captions?.toString(),
    annotations: annotations?.toString(),
    volume,
  };

  return React.createElement(resolved.tagName, embedProps);
}
