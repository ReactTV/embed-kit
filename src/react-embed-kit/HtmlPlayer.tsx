import React, { forwardRef, MediaHTMLAttributes, useEffect, useRef } from "react";
import { mergeRefs } from "react-merge-refs";
import { AUDIO_EXTENSIONS } from "./constants.js";
import type { ReactEmbedKitProps } from "./ReactEmbedKit.js";

interface VideoHTMLAttributes<T> extends MediaHTMLAttributes<T> {
  height?: number | string | undefined;
  playsInline?: boolean | undefined;
  poster?: string | undefined;
  width?: number | string | undefined;
  disablePictureInPicture?: boolean | undefined;
  disableRemotePlayback?: boolean | undefined;
  onEnterPictureInPicture?: ((this: HTMLVideoElement, ev: Event) => void) | undefined;
  onLeavePictureInPicture?: ((this: HTMLVideoElement, ev: Event) => void) | undefined;
}

export interface VideoElementProps extends React.DetailedHTMLProps<
  VideoHTMLAttributes<HTMLVideoElement>,
  HTMLVideoElement
> {
  playbackRate?: number;
  volume?: number;
  config?: Record<string, number | string | undefined>;
}

export type HtmlPlayerProps = Omit<ReactEmbedKitProps, "ref">;

const normalizeStartSeconds = (startSeconds: number | undefined): number | undefined => {
  if (startSeconds == null || !Number.isFinite(startSeconds) || startSeconds <= 0) {
    return undefined;
  }

  return Math.floor(startSeconds);
};

const seekToStartSeconds = (el: HTMLMediaElement, target: number) => {
  if (el.readyState === 0) return;
  if (Math.abs(el.currentTime - target) < 0.25) return;

  try {
    el.currentTime = target;
  } catch {
    // Seeking may fail until the media is seekable.
  }
};

const hasRenderableFrame = (el: HTMLMediaElement) =>
  !el.paused && el.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA;

const scheduleVisibleFrame = (
  el: HTMLMediaElement,
  dispatchedRef: React.MutableRefObject<boolean>,
  onVisibleFrame: () => void
) => {
  if (dispatchedRef.current) return;

  const dispatch = () => {
    if (dispatchedRef.current) return;
    dispatchedRef.current = true;
    onVisibleFrame();
  };

  const tryFallback = () => {
    if (!hasRenderableFrame(el)) return false;
    dispatch();
    return true;
  };

  if ("requestVideoFrameCallback" in el && typeof el.requestVideoFrameCallback === "function") {
    el.requestVideoFrameCallback(() => dispatch());
    return;
  }

  if (!tryFallback()) {
    const onCanPlay = () => {
      tryFallback();
      el.removeEventListener("canplay", onCanPlay);
    };
    el.addEventListener("canplay", onCanPlay);
  }
};

const HtmlPlayer = forwardRef<HTMLMediaElement, HtmlPlayerProps>(
  ({ playing, volume, muted, controls = false, autoplay, startSeconds, ...props }, ref) => {
    const Media = AUDIO_EXTENSIONS.test(`${props.src}`) ? "audio" : "video";
    const internalRef = useRef<HTMLMediaElement | null>(null);
    const visibleFrameDispatchedRef = useRef(false);
    /** After src changes, skip one pause() so autoPlay is not undone while playing is still false. */
    const skipInitialPauseRef = useRef(false);
    // Omit autoplay from spread so only camelCase autoPlay is passed to the DOM element
    const {
      onVolumeChange,
      onProgress,
      onDurationChange,
      onError,
      onReady,
      onPlaybackRateChange,
      onCued,
      onPlay,
      onPlaying,
      onPause,
      onEnded,
      onBuffering,
      onVisibleFrame,
      ...mediaProps
    } = props as HtmlPlayerProps & { autoplay?: boolean };
    const normalizedStartSeconds = normalizeStartSeconds(startSeconds);

    useEffect(() => {
      skipInitialPauseRef.current = !!(autoplay && playing === false);
      visibleFrameDispatchedRef.current = false;
    }, [props.src]);

    useEffect(() => {
      const el = internalRef.current;
      if (!el || normalizedStartSeconds == null) return;

      const seek = () => seekToStartSeconds(el, normalizedStartSeconds);

      el.addEventListener("loadedmetadata", seek);
      // Fallback when metadata is ready but the target time is not seekable yet.
      el.addEventListener("canplay", seek, { once: true });
      if (el.readyState >= 1) seek();

      return () => {
        el.removeEventListener("loadedmetadata", seek);
        el.removeEventListener("canplay", seek);
      };
    }, [props.src, normalizedStartSeconds]);

    useEffect(() => {
      if (!internalRef.current) return;

      if (playing) {
        internalRef.current.play();
        skipInitialPauseRef.current = false;
      } else {
        if (skipInitialPauseRef.current) {
          skipInitialPauseRef.current = false;
          return;
        }
        internalRef.current.pause();
      }
    }, [playing, autoplay, props.src]);

    useEffect(() => {
      const el = internalRef.current;
      if (!el) return;
      if (volume != null) {
        const v = Math.max(0, Math.min(1, volume / 100));
        el.volume = v;
      }
      el.muted = !!muted;
    }, [volume, muted]);

    // Apply controls on mount so initial value is respected (spread alone can show controls when false on first paint)
    useEffect(() => {
      const el = internalRef.current;
      if (!el) return;
      el.controls = !!controls;
    }, [controls]);

    return (
      <Media
        {...mediaProps}
        autoPlay={!!autoplay}
        ref={mergeRefs([internalRef, ref]) as React.Ref<HTMLVideoElement & HTMLAudioElement>}
        controls={controls || undefined}
        onLoadedData={() => {
          onReady?.();
        }}
        onPlay={() => {
          onPlay?.();
        }}
        onPlaying={(e: React.SyntheticEvent<HTMLMediaElement, Event>) => {
          onPlaying?.();
          if (onVisibleFrame) {
            scheduleVisibleFrame(e.currentTarget, visibleFrameDispatchedRef, onVisibleFrame);
          }
        }}
        onWaiting={() => {
          onBuffering?.();
        }}
        onPause={() => {
          onPause?.();
        }}
        onEnded={() => {
          onEnded?.();
        }}
        onVolumeChange={(e: React.SyntheticEvent<HTMLMediaElement, Event>) => {
          const currentVolume = e.currentTarget?.volume;
          if (currentVolume !== undefined) onVolumeChange?.(currentVolume * 100);
        }}
        onTimeUpdate={(e: React.SyntheticEvent<HTMLMediaElement, Event>) => {
          const progress = e.currentTarget?.currentTime;
          if (progress != null && Number.isFinite(progress)) onProgress?.(progress);
        }}
        onDurationChange={(e: React.SyntheticEvent<HTMLMediaElement, Event>) => {
          const duration = e.currentTarget?.duration;
          if (duration != null && Number.isFinite(duration)) onDurationChange?.(duration);
        }}
        onError={(e: React.SyntheticEvent<HTMLMediaElement, Event>) => {
          const err = e.currentTarget?.error;
          if (err) onError?.(err);
        }}
        onRateChange={(e: React.SyntheticEvent<HTMLMediaElement, Event>) => {
          onPlaybackRateChange?.(e.currentTarget.playbackRate);
        }}
        onLoadedMetadata={() => {
          onCued?.();
        }}
      />
    );
  }
);

HtmlPlayer.displayName = "HtmlPlayer";

export default HtmlPlayer;
