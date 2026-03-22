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

const HtmlPlayer = forwardRef<HTMLMediaElement, HtmlPlayerProps>(
  ({ playing, volume, muted, controls = false, autoplay, ...props }, ref) => {
    const Media = AUDIO_EXTENSIONS.test(`${props.src}`) ? "audio" : "video";
    const internalRef = useRef<HTMLMediaElement | null>(null);
    /** After src changes, skip one pause() so autoPlay is not undone while playing is still false. */
    const skipInitialPauseRef = useRef(false);
    // Omit autoplay from spread so only camelCase autoPlay is passed to the DOM element
    const { onVolumeChange, onProgress, onDurationChange, onError, ...mediaProps } =
      props as HtmlPlayerProps & { autoplay?: boolean };

    useEffect(() => {
      skipInitialPauseRef.current = !!(autoplay && playing === false);
    }, [props.src]);

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
        onVolumeChange={(e: React.SyntheticEvent<HTMLMediaElement, Event>) => {
          const currentVolume = e.currentTarget?.volume;
          if (currentVolume !== undefined) onVolumeChange?.(currentVolume * 100);
        }}
        onTimeUpdate={(e: React.SyntheticEvent<HTMLMediaElement, Event>) => {
          const progress = e.currentTarget?.currentTime;
          if (progress) onProgress?.(progress);
        }}
        onDurationChange={(e: React.SyntheticEvent<HTMLMediaElement, Event>) => {
          const duration = e.currentTarget?.duration;
          if (duration) onDurationChange?.(duration);
        }}
        onError={(e: React.SyntheticEvent<HTMLMediaElement, Event>) => {
          const err = e.currentTarget?.error;
          if (err) onError?.(err);
        }}
      />
    );
  },
);

HtmlPlayer.displayName = "HtmlPlayer";

export default HtmlPlayer;
