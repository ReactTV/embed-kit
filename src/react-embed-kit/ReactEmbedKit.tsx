import React, { useRef, useEffect, useLayoutEffect, useState, useCallback } from "react";
import "./embed-elements.js";
import { getProviderForUrl, EMBED_TAG } from "./providers.js";
import type {
  EmbedPlayerRef,
  TDispatchedEventPayloads,
  IDispatchedEventCallbacks,
} from "../elements/_base/player.types.js";
import type { EmbedTagName } from "./providers.js";
import { AUDIO_EXTENSIONS, VIDEO_EXTENSIONS } from "./constants.js";
import HtmlPlayer from "./HtmlPlayer.js";

export type ReactEmbedKitProps = IDispatchedEventCallbacks & {
  src?: string;
  width?: number;
  height?: number;
  className?: string;
  style?: React.CSSProperties;
  autoplay?: boolean;
  playing?: boolean;
  pip?: boolean;
  muted?: boolean;
  volume?: number; // 0-100
  startSeconds?: number;
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

const normalizeStartSeconds = (startSeconds: number | undefined): number | undefined => {
  if (startSeconds == null || !Number.isFinite(startSeconds) || startSeconds <= 0) {
    return undefined;
  }

  return Math.floor(startSeconds);
};

function resolveUrl(url: string) {
  return getProviderForUrl(url) ?? { tagName: EMBED_TAG.YOUTUBE as EmbedTagName, url };
}

export function ReactEmbedKit(props: ReactEmbedKitProps): React.ReactElement {
  const {
    autoplay,
    muted,
    src,
    width,
    height,
    controls = true,
    captions,
    annotations,
    playing,
    onReady,
    onError,
    onPlay,
    onPlaying,
    onPause,
    onBuffering,
    onEnded,
    onProgress,
    onDurationChange,
    onVolumeChange,
    onMuteChange,
    onPlaybackRateChange,
    onPlaybackQualityChange,
    onCued,
    onVisibleFrame,
    playerRef,
    volume,
    config,
    startSeconds,
    className,
    style,
  } = props;

  const [isClient, setIsClient] = useState(false);
  const [tagReady, setTagReady] = useState(false);

  const isHtmlPlayer = !!(src && (src.match(AUDIO_EXTENSIONS) || src.match(VIDEO_EXTENSIONS)));

  const embedRef = useRef<EmbedPlayerRef>(null);

  // Derived synchronously — no extra render cycle when src changes.
  const embedUrl = isClient && tagReady ? (src ?? "") : "";
  const embedUrlRef = useRef(embedUrl);
  embedUrlRef.current = embedUrl;

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!isClient) return;
    setTagReady(false);
    import("./registerEmbedElements.js")
      .then(() => setTagReady(true))
      .catch((err) => {
        // eslint-disable-next-line no-console -- surface load failure for debugging
        console.error("[ReactEmbedKit] Failed to load embed player modules:", err);
      });
  }, [isClient]);

  // Wire consumer events to the embed element
  useEffect(() => {
    const el = embedRef.current;
    if (!el) return;

    const handlers = {
      onReady: () => onReady?.(),
      onPlay: () => onPlay?.(),
      onPlaying: () => onPlaying?.(),
      onPause: () => onPause?.(),
      onBuffering: () => onBuffering?.(),
      onEnded: () => onEnded?.(),
      onError: (event: CustomEvent<TDispatchedEventPayloads["onError"]>) => {
        onError?.(event.detail);
      },
      onProgress: (event: CustomEvent<TDispatchedEventPayloads["onProgress"]>) => {
        onProgress?.(event.detail);
      },
      onDurationChange: (event: CustomEvent<TDispatchedEventPayloads["onDurationChange"]>) => {
        onDurationChange?.(event.detail);
      },
      onVolumeChange: (event: CustomEvent<TDispatchedEventPayloads["onVolumeChange"]>) => {
        onVolumeChange?.(event.detail);
      },
      onMuteChange: (event: CustomEvent<TDispatchedEventPayloads["onMuteChange"]>) => {
        onMuteChange?.(event.detail);
      },
      onPlaybackRateChange: (
        event: CustomEvent<TDispatchedEventPayloads["onPlaybackRateChange"]>
      ) => {
        onPlaybackRateChange?.(event.detail);
      },
      onPlaybackQualityChange: (
        event: CustomEvent<TDispatchedEventPayloads["onPlaybackQualityChange"]>
      ) => {
        onPlaybackQualityChange?.(event.detail);
      },
      onCued: () => onCued?.(),
      onVisibleFrame: () => onVisibleFrame?.(),
    };

    Object.entries(handlers).forEach(([event, handler]) => {
      el.addEventListener(event, handler as EventListener);
    });

    return () => {
      Object.entries(handlers).forEach(([event, handler]) => {
        el.removeEventListener(event, handler as EventListener);
      });
    };
  }, [
    embedUrl,
    onReady,
    onPlay,
    onPlaying,
    onPause,
    onBuffering,
    onEnded,
    onError,
    onProgress,
    onDurationChange,
    onVolumeChange,
    onMuteChange,
    onPlaybackRateChange,
    onPlaybackQualityChange,
    onCued,
    onVisibleFrame,
  ]);

  const applyAttributesAndLoad = useCallback(
    (el: EmbedPlayerRef, targetUrl: string) => {
      if (!el || !(el instanceof HTMLElement) || !el.isConnected) return;
      if (!targetUrl) return;
      const targetIsHtmlPlayer = !!(
        targetUrl.match(AUDIO_EXTENSIONS) || targetUrl.match(VIDEO_EXTENSIONS)
      );
      const setOrRemove = (name: string, value: boolean) => {
        if (el.getAttribute(name) !== String(value)) {
          if (value) el.setAttribute(name, String(value));
          else el.removeAttribute(name);
        }
      };
      const setIfChanged = (name: string, value: string) => {
        if (el.getAttribute(name) !== value) el.setAttribute(name, value);
      };
      const setSerializedConfig = (
        name: string,
        value: Record<string, number | string | undefined> | undefined
      ) => {
        const serialized = JSON.stringify(value ?? {});

        if (serialized === "{}") {
          if (el.hasAttribute(name)) el.removeAttribute(name);
          return;
        }

        setIfChanged(name, serialized);
      };

      setIfChanged("autoplay", String(!!autoplay));
      setIfChanged("muted", String(!!muted));
      if (playing !== undefined) {
        setIfChanged("playing", String(!!playing));
      } else if (el.hasAttribute("playing")) {
        el.removeAttribute("playing");
      }
      setIfChanged("captions", String(!!captions));
      setIfChanged("annotations", String(!!annotations));
      if (volume != null) setIfChanged("volume", String(volume));
      if (width != null) setIfChanged("width", String(width));
      if (height != null) setIfChanged("height", String(height));
      const normalizedStartSeconds = normalizeStartSeconds(startSeconds);
      const youtubeConfig = {
        ...config?.youtube,
        ...(normalizedStartSeconds !== undefined ? { start: normalizedStartSeconds } : {}),
      };
      const dailymotionConfig = {
        ...(normalizedStartSeconds !== undefined ? { startTime: normalizedStartSeconds } : {}),
      };

      setSerializedConfig("youtube", youtubeConfig);
      setSerializedConfig("vimeo", config?.vimeo);
      setSerializedConfig("dailymotion", dailymotionConfig);
      setIfChanged("src", targetUrl);

      if (targetIsHtmlPlayer) {
        setOrRemove("controls", controls);
      } else {
        setIfChanged("controls", String(controls));
      }
    },
    [
      autoplay,
      muted,
      playing,
      controls,
      captions,
      annotations,
      volume,
      width,
      height,
      config,
      startSeconds,
    ]
  );

  const forwardPlayerRef = useCallback(
    (el: EmbedPlayerRef) => {
      if (typeof playerRef === "function") playerRef(el);
      else if (playerRef && "current" in playerRef) {
        (playerRef as { current: EmbedPlayerRef | null }).current = el;
      }
    },
    [playerRef]
  );

  const setEmbedRef = useCallback(
    (el: EmbedPlayerRef) => {
      (embedRef as { current: EmbedPlayerRef | null }).current = el;
      if (el && embedUrlRef.current) applyAttributesAndLoad(el, embedUrlRef.current);
      forwardPlayerRef(el);
    },
    // embedUrl intentionally excluded: embedUrlRef.current is always current without
    // causing the ref callback to cycle (null → el) on every URL change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [applyAttributesAndLoad, forwardPlayerRef]
  );

  useLayoutEffect(() => {
    if (embedUrl) applyAttributesAndLoad(embedRef.current, embedUrl);
  }, [applyAttributesAndLoad, embedUrl]);

  if (!isClient || !tagReady) {
    return <div />;
  }

  if (!src) return <div />;

  if (isHtmlPlayer) {
    return <HtmlPlayer {...props} ref={playerRef as React.Ref<HTMLMediaElement>} />;
  }

  const resolved = embedUrl ? resolveUrl(embedUrl) : null;

  return (
    <div
      className={className}
      style={{ position: "relative", width: "100%", ...(height != null ? { height } : {}), ...style }}
    >
      {resolved &&
        React.createElement(resolved.tagName, {
          ref: setEmbedRef,
          style: { display: "block", width: "100%", height: "100%" },
        })}
    </div>
  );
}
