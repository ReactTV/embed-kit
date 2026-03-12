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
  ({ playing, volume, muted, controls = false, ...props }, ref) => {
    const Media = AUDIO_EXTENSIONS.test(`${props.src}`) ? "audio" : "video";
    const internalRef = useRef<HTMLMediaElement | null>(null);

    useEffect(() => {
      const el = internalRef.current;
      if (!el || !el.isConnected) return;
      if (playing) {
        const p = el.play();
        if (p !== undefined) p.catch((err: unknown) => {
          if ((err as { name?: string })?.name !== "AbortError") throw err;
        });
      } else {
        el.pause();
      }
    }, [playing]);

    useEffect(() => {
      const el = internalRef.current;
      if (!el || !el.isConnected) return;
      if (volume != null) {
        const v = Math.max(0, Math.min(1, volume / 100));
        el.volume = v;
      }
      el.muted = !!muted;
    }, [volume, muted]);

    // Apply controls on mount so initial value is respected (spread alone can show controls when false on first paint)
    useEffect(() => {
      const el = internalRef.current;
      if (!el || !el.isConnected) return;
      el.controls = !!controls;
    }, [controls]);

    return (
      <Media
        {...props}
        ref={mergeRefs([internalRef, ref]) as React.Ref<HTMLVideoElement & HTMLAudioElement>}
        controls={controls || undefined}
        onVolumeChange={
          props.onVolumeChange
            ? (e: React.SyntheticEvent<HTMLMediaElement, Event>) => {
                const currentVolume = e.currentTarget?.volume;
                if (currentVolume !== undefined) props.onVolumeChange?.(currentVolume * 100);
              }
            : undefined
        }
        onProgress={
          props.onProgress
            ? (e: React.SyntheticEvent<HTMLMediaElement, Event>) => {
                const progress = e.currentTarget?.currentTime;
                if (progress) props.onProgress?.(progress);
              }
            : undefined
        }
        onDurationChange={
          props.onDurationChange
            ? (e: React.SyntheticEvent<HTMLMediaElement, Event>) => {
                const duration = e.currentTarget?.duration;
                if (duration) props.onDurationChange?.(duration);
              }
            : undefined
        }
        onError={
          props.onError
            ? (e: React.SyntheticEvent<HTMLMediaElement, Event>) => {
                const err = e.currentTarget?.error;
                if (err) props.onError?.(err);
              }
            : undefined
        }
      />
    );
  }
);

HtmlPlayer.displayName = "HtmlPlayer";

export default HtmlPlayer;
