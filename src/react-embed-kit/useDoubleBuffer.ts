import { useState, useEffect, useRef, useCallback } from "react";

const SWAP_TIMEOUT_MS = 5000;

interface UseDoubleBufferOptions {
  src: string | undefined;
  isClient: boolean;
  tagReady: boolean;
  isHtmlPlayer: boolean;
}

interface UseDoubleBufferResult {
  slot0Url: string;
  slot1Url: string;
  activeSlot: 0 | 1;
  triggerSwap: () => void;
}

/**
 * Manages a two-slot double-buffer for embed URL transitions.
 *
 * One slot is visible, one loads the next URL hidden in the background. On swap the
 * previously active slot is destroyed (URL cleared → element unmounts) so only one
 * iframe is alive at a time. HtmlPlayer bypasses buffering entirely.
 */
export function useDoubleBuffer({
  src,
  isClient,
  tagReady,
  isHtmlPlayer,
}: UseDoubleBufferOptions): UseDoubleBufferResult {
  const [slot0Url, setSlot0Url] = useState("");
  const [slot1Url, setSlot1Url] = useState("");
  const [activeSlot, setActiveSlot] = useState<0 | 1>(0);
  const swapTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Keep a ref so triggerSwap can read the current activeSlot without being recreated on every change
  const activeSlotRef = useRef<0 | 1>(0);
  activeSlotRef.current = activeSlot;

  const triggerSwap = useCallback(() => {
    if (swapTimeoutRef.current) clearTimeout(swapTimeoutRef.current);
    const prev = activeSlotRef.current;
    // Destroy the slot that's becoming inactive
    if (prev === 0) setSlot0Url("");
    else setSlot1Url("");
    setActiveSlot(prev === 0 ? 1 : 0);
  }, []);

  useEffect(() => {
    if (!isClient || !tagReady || !src) return;

    const currentActiveUrl = activeSlot === 0 ? slot0Url : slot1Url;
    const setActiveUrl = activeSlot === 0 ? setSlot0Url : setSlot1Url;
    const setInactiveUrl = activeSlot === 0 ? setSlot1Url : setSlot0Url;

    if (isHtmlPlayer || !currentActiveUrl || src === currentActiveUrl) {
      setActiveUrl(src);
      return;
    }

    // Something is already showing — load the next URL in the inactive slot
    setInactiveUrl(src);
    if (swapTimeoutRef.current) clearTimeout(swapTimeoutRef.current);
    swapTimeoutRef.current = setTimeout(triggerSwap, SWAP_TIMEOUT_MS);
  }, [src, isClient, tagReady, isHtmlPlayer, activeSlot, slot0Url, slot1Url, triggerSwap]);

  useEffect(
    () => () => {
      if (swapTimeoutRef.current) clearTimeout(swapTimeoutRef.current);
    },
    []
  );

  return { slot0Url, slot1Url, activeSlot, triggerSwap };
}
