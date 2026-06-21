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
import { useDoubleBuffer } from "./useDoubleBuffer.js";

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

const ACTIVE_SLOT_STYLE: React.CSSProperties = {
  display: "block",
  width: "100%",
  height: "100%",
};

const HIDDEN_SLOT_STYLE: React.CSSProperties = {
  position: "absolute",
  top: 0,
  left: 0,
  width: "100%",
  height: "100%",
  visibility: "hidden",
};

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

  const { slot0Url, slot1Url, activeSlot, triggerSwap } = useDoubleBuffer({
    src,
    isClient,
    tagReady,
    isHtmlPlayer,
  });

  const slot0Ref = useRef<EmbedPlayerRef>(null);
  const slot1Ref = useRef<EmbedPlayerRef>(null);

  const inactiveSlot = activeSlot === 0 ? 1 : 0;
  const inactiveUrl = inactiveSlot === 0 ? slot0Url : slot1Url;

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

  // Swap when the inactive (loading) slot reports ready
  useEffect(() => {
    const el = inactiveSlot === 0 ? slot0Ref.current : slot1Ref.current;
    if (!el || !inactiveUrl) return;
    el.addEventListener("onReady", triggerSwap);
    return () => el.removeEventListener("onReady", triggerSwap);
  }, [inactiveSlot, inactiveUrl, triggerSwap]);

  // Wire consumer events to the active element; re-wires after each swap
  useEffect(() => {
    const el = activeSlot === 0 ? slot0Ref.current : slot1Ref.current;
    if (!el) return;

    const handlers = {
      onReady: () => onReady?.(),
      onPlay: () => onPlay?.(),
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
    activeSlot,
    onReady,
    onPlay,
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
  ]);

  // Apply attributes to a given element for a given URL
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

  // Forward playerRef to whichever slot is active
  const forwardPlayerRef = useCallback(
    (el: EmbedPlayerRef) => {
      if (typeof playerRef === "function") playerRef(el);
      else if (playerRef && "current" in playerRef) {
        (playerRef as { current: EmbedPlayerRef | null }).current = el;
      }
    },
    [playerRef]
  );

  // Callback refs: set internal ref, apply attributes on mount, forward playerRef if active
  const setSlot0Ref = useCallback(
    (el: EmbedPlayerRef) => {
      (slot0Ref as { current: EmbedPlayerRef | null }).current = el;
      if (el && slot0Url) applyAttributesAndLoad(el, slot0Url);
      if (activeSlot === 0) forwardPlayerRef(el);
    },
    [applyAttributesAndLoad, slot0Url, activeSlot, forwardPlayerRef]
  );

  const setSlot1Ref = useCallback(
    (el: EmbedPlayerRef) => {
      (slot1Ref as { current: EmbedPlayerRef | null }).current = el;
      if (el && slot1Url) applyAttributesAndLoad(el, slot1Url);
      if (activeSlot === 1) forwardPlayerRef(el);
    },
    [applyAttributesAndLoad, slot1Url, activeSlot, forwardPlayerRef]
  );

  // Sync prop changes to both mounted elements
  useLayoutEffect(() => {
    if (slot0Url) applyAttributesAndLoad(slot0Ref.current, slot0Url);
  }, [applyAttributesAndLoad, slot0Url]);

  useLayoutEffect(() => {
    if (slot1Url) applyAttributesAndLoad(slot1Ref.current, slot1Url);
  }, [applyAttributesAndLoad, slot1Url]);

  if (!isClient || !tagReady) {
    return <div />;
  }

  if (!src) return <div />;

  if (isHtmlPlayer) {
    return <HtmlPlayer {...props} ref={playerRef as React.Ref<HTMLMediaElement>} />;
  }

  const slot0Resolved = slot0Url ? resolveUrl(slot0Url) : null;
  const slot1Resolved = slot1Url ? resolveUrl(slot1Url) : null;

  // width/height props are forwarded as CSS on the wrapper so it matches the footprint the
  // original bare custom element would have had. The active slot fills it; the inactive
  // slot overlays it hidden without affecting document flow.
  return (
    <div
      className={className}
      style={{ position: "relative", width: "100%", ...(height != null ? { height } : {}), ...style }}
    >
      {slot0Resolved &&
        React.createElement(slot0Resolved.tagName, {
          ref: setSlot0Ref,
          style: activeSlot !== 0 ? HIDDEN_SLOT_STYLE : ACTIVE_SLOT_STYLE,
        })}
      {slot1Resolved &&
        React.createElement(slot1Resolved.tagName, {
          ref: setSlot1Ref,
          style: activeSlot !== 1 ? HIDDEN_SLOT_STYLE : ACTIVE_SLOT_STYLE,
        })}
    </div>
  );
}
