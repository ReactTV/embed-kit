import type { CreatePlayerOptions, EmbedPlayer } from "../_base/index.js";

const VIMEO_SCRIPT = "https://player.vimeo.com/api/player.js";
const EMBED_BASE = "https://player.vimeo.com/video/";

declare global {
  interface Window {
    Vimeo?: { Player: new (iframe: HTMLIFrameElement) => VimeoPlayer };
  }
}

interface VimeoPlayer {
  play: () => Promise<void>;
  pause: () => Promise<void>;
  getPaused: () => Promise<boolean>;
  getCurrentTime: () => Promise<number>;
  setCurrentTime: (seconds: number) => Promise<number>;
  destroy: () => void;
}

function loadVimeoScript(): Promise<void> {
  if (window.Vimeo?.Player) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = VIMEO_SCRIPT;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load Vimeo player script"));
    document.head.appendChild(script);
  });
}

/**
 * Create a controllable Vimeo player in the given container.
 * Returns a normalized EmbedPlayer (play, pause, paused, currentTime).
 */
export function createPlayer(
  container: HTMLElement,
  videoId: string,
  options: CreatePlayerOptions = {}
): Promise<EmbedPlayer> {
  const width = options.width ?? 560;
  const height = options.height ?? 315;
  const autoplay = Boolean((options as { autoplay?: boolean }).autoplay);

  const vimeoHash = (options as { vimeoHash?: string }).vimeoHash;
  const query = new URLSearchParams({ api: "1" });
  if (vimeoHash) query.set("h", vimeoHash);
  if (autoplay) query.set("autoplay", "1");

  const iframe = document.createElement("iframe");
  iframe.src = `${EMBED_BASE}${videoId}?${query.toString()}`;
  iframe.width = String(width);
  iframe.height = String(height);
  iframe.setAttribute("frameborder", "0");
  iframe.allow = "autoplay; fullscreen; picture-in-picture";
  iframe.allowFullscreen = true;
  container.appendChild(iframe);

  return loadVimeoScript().then(() => {
    const vimeoPlayer = new window.Vimeo!.Player(iframe);
    return {
      play: () => vimeoPlayer.play(),
      pause: () => vimeoPlayer.pause(),
      get paused() {
        return vimeoPlayer.getPaused();
      },
      get currentTime() {
        return vimeoPlayer.getCurrentTime();
      },
      seek(seconds: number) {
        return vimeoPlayer.setCurrentTime(seconds).then(() => {});
      },
      get autoplay() {
        return Promise.resolve(autoplay);
      },
      destroy() {
        vimeoPlayer.destroy();
        if (iframe.parentNode) container.removeChild(iframe);
      },
    };
  });
}
