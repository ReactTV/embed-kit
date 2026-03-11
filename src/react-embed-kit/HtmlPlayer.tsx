import React, { MediaHTMLAttributes, useCallback, useEffect, useRef } from "react";
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

type HtmlPlayerProps = ReactEmbedKitProps & { ref?: React.Ref<HTMLVideoElement> };

function HtmlPlayer({ ref, playing, volume, muted, ...props }: HtmlPlayerProps) {
  const Media = AUDIO_EXTENSIONS.test(`${props.src}`) ? "audio" : "video";
  const internalRef = useRef<HTMLVideoElement | null>(null);

  const setRef = useCallback(
    (el: HTMLVideoElement | null) => {
      internalRef.current = el;
      if (typeof ref === "function") ref(el);
      else if (ref && typeof ref === "object" && "current" in ref) {
        const refObj = ref as { current: HTMLVideoElement | null };
        refObj.current = el;
      }
    },
    [ref]
  );

  useEffect(() => {
    if (playing) {
      internalRef.current?.play();
    } else {
      internalRef.current?.pause();
    }
  }, [playing]);

  useEffect(() => {
    const el = internalRef.current;
    if (!el) return;
    if (volume != null) {
      const v = Math.max(0, Math.min(1, volume / 100));
      el.volume = v;
    }
    el.muted = !!muted;
  }, [volume, muted]);

  return (
    <Media
      {...props}
      ref={setRef}
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

export default HtmlPlayer;
