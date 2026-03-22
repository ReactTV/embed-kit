import React, { useRef, useEffect, useLayoutEffect, useState, useCallback } from "react";
import { mergeRefs } from "react-merge-refs";
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
  src: string;
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
    onPlay,
    onPause,
    onBuffering,
    onEnded,
    onProgress,
    onDurationChange,
    onVolumeChange,
    onMuteChange,
    playerRef,
    volume,
  } = props;
  const elementRef = useRef<EmbedPlayerRef>(null);
  const [isClient, setIsClient] = useState(false);
  const [tagReady, setTagReady] = useState(false);

  const isHtmlPlayer = src.match(AUDIO_EXTENSIONS) || src.match(VIDEO_EXTENSIONS);

  const resolved = getProviderForUrl(src) ?? {
    tagName: EMBED_TAG.YOUTUBE as EmbedTagName,
    url: src,
  };

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
      onDurationChange: (event: CustomEvent<TDispatchedEventPayloads["onDurationChange"]>) => {
        onDurationChange?.(event.detail);
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
  }, [
    onReady,
    onPlay,
    onPause,
    onBuffering,
    onEnded,
    onProgress,
    onDurationChange,
    onVolumeChange,
    onMuteChange,
  ]);

  const applyAttributesAndLoad = useCallback(
    (el: EmbedPlayerRef) => {
      if (!el || !(el instanceof HTMLElement) || !el.isConnected) return;
      const setOrRemove = (name: string, value: boolean) => {
        if (el.getAttribute(name) !== String(value)) {
          if (value) el.setAttribute(name, String(value));
          else el.removeAttribute(name);
        }
      };
      const setIfChanged = (name: string, value: string) => {
        if (el.getAttribute(name) !== value) el.setAttribute(name, value);
      };
      setIfChanged("src", resolved.url);
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

      if (isHtmlPlayer) {
        setOrRemove("controls", controls);
      } else {
        setIfChanged("controls", String(controls));
      }
    },
    [resolved.url, autoplay, muted, playing, controls, captions, annotations, volume, width, height],
  );

  // React doesn't reliably forward ref to custom elements from createElement; use a callback ref
  // so we get the element when it's attached, then set attributes and load.
  const setEmbedRef = useCallback(
    (el: EmbedPlayerRef) => {
      (elementRef as React.MutableRefObject<EmbedPlayerRef | null>).current = el;
      if (el) applyAttributesAndLoad(el);
    },
    [applyAttributesAndLoad],
  );

  // When props change, update the element (elementRef is set by the callback ref above).
  useLayoutEffect(() => {
    applyAttributesAndLoad(elementRef.current);
  }, [applyAttributesAndLoad]);

  if (!isClient || !tagReady) {
    return <div />;
  }

  if (isHtmlPlayer) {
    return <HtmlPlayer {...props} ref={mergeRefs([setEmbedRef, playerRef])} />;
  }

  return React.createElement(resolved.tagName, {
    ref: mergeRefs([setEmbedRef, playerRef]),
  });
}
