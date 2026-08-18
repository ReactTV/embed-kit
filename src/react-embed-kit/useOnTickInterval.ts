import { useEffect } from "react";

export const DEFAULT_TICK_RATE_MS = 100;

type TUseOnTickIntervalArgs = {
  onTick?: (() => void) | undefined;
  tickRate?: number | undefined;
  /** Restart the interval when this identity changes (e.g. src / embed URL). */
  resetKey?: string | undefined;
  enabled?: boolean;
};

export const useOnTickInterval = ({
  onTick,
  tickRate,
  resetKey,
  enabled = true,
}: TUseOnTickIntervalArgs): void => {
  useEffect(() => {
    if (!enabled || !onTick) return;

    const rate = tickRate ?? DEFAULT_TICK_RATE_MS;
    if (!Number.isFinite(rate) || rate <= 0) return;

    const id = setInterval(() => onTick(), rate);
    return () => clearInterval(id);
  }, [enabled, onTick, tickRate, resetKey]);
};
