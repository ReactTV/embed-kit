import type { IEmbedPlayer, TCreatePlayer, TPlayerState } from "../_base/index.js";
import { createPlayerContainer, loadScript } from "../_base/index.js";

const YT_SCRIPT = "https://www.youtube.com/iframe_api";

declare global {
  interface Window {
    YT?: {
      Player: new (el: string | HTMLElement, opts: YTOptions) => YTPlayer;
      PlayerState: { ENDED: 0; PLAYING: 1; PAUSED: 2; BUFFERING: 3; CUED: 5 };
    };
    onYouTubeIframeAPIReady?: () => void;
  }
}

interface YTOptions {
  videoId: string;
  width?: number;
  height?: number;
  playerVars?: Record<string, number | string>;
  events?: {
    onReady?: (ev: { target: YTPlayer }) => void;
    onStateChange?: (ev: { data: number }) => void;
    onError?: (ev: { data: number }) => void;
    onPlaybackQualityChange?: (ev: { data: string }) => void;
    onPlaybackRateChange?: (ev: { data: number }) => void;
    onAutoplayBlocked?: () => void;
    onApiChange?: () => void;
  };
}

interface YTPlayer {
  playVideo: () => void;
  pauseVideo: () => void;
  getPlayerState: () => number; // 1=playing, 2=paused, etc.
  getCurrentTime: () => number; // seconds
  getDuration: () => number; // seconds (0 until metadata loaded)
  seekTo: (seconds: number, allowSeekAhead: boolean) => void;
  mute: () => void;
  unMute: () => void;
  isMuted: () => boolean;
  getVolume: () => number; // 0-100
  setVolume: (volume: number) => void; // 0-100
}

function loadYTScript(): Promise<void> {
  return loadScript(YT_SCRIPT, {
    isLoaded: () => !!window.YT?.Player,
    ready: () =>
      new Promise((resolve) => {
        const prev = window.onYouTubeIframeAPIReady;
        window.onYouTubeIframeAPIReady = () => {
          prev?.();
          resolve();
        };
      }),
    errorMessage: "Failed to load YouTube iframe API",
  });
}

/**
 * Create a controllable YouTube player in the given container.
 * Returns a normalized IEmbedPlayer (play, pause, getPaused).
 */
export const createPlayer: TCreatePlayer = (container, id, options = {}): Promise<IEmbedPlayer> => {
  const {
    width = 560,
    height = 315,
    autoplay = false,
    volume: initialVolume,
    controls = true,
    enableCaptions,
    showAnnotations,
    config,
    onReady = () => {},
    onPlay = () => {},
    onPause = () => {},
    onBuffering = () => {},
    onEnded = () => {},
    onProgress = () => {},
    onSeek = () => {},
    onMute = () => {},
    onError = () => {},
    onPlaybackQualityChange = () => {},
    onPlaybackRateChange = () => {},
    onAutoplayBlocked = () => {},
    onApiChange = () => {},
    progressInterval = 50,
  } = options;

  const youtubeConfig = config?.youtube ?? {};
  const playerVars: Record<string, number | string> = {
    autoplay: autoplay ? 1 : 0,
    ...youtubeConfig,
  };
  if (controls !== undefined) playerVars.controls = controls ? 1 : 0;
  if (enableCaptions !== undefined) playerVars.cc_load_policy = enableCaptions ? 1 : 0;
  if (showAnnotations !== undefined) playerVars.iv_load_policy = showAnnotations ? 1 : 3;

  const playerState: TPlayerState = {
    currentTime: 0,
    duration: 0,
    isPlaying: false,
    isPaused: true,
    muted: false,
    ...(typeof initialVolume === "number" &&
      initialVolume >= 0 &&
      initialVolume <= 1 && { volume: initialVolume }),
    error: null,
  };

  return loadYTScript().then(() => {
    const { element: div } = createPlayerContainer(container, "yt-player");
    const YT = window.YT!;
    const { PlayerState } = YT;

    let player: YTPlayer | null = null;

    const readyState = {
      progressIntervalId: undefined as ReturnType<typeof setInterval> | undefined,
      destroyed: false,
    };

    new YT.Player(div, {
      videoId: id,
      width,
      height,
      playerVars,
      events: {
        onError(ev: { data: number }) {
          playerState.error = { code: ev.data };
          onError(playerState.error);
        },
        onReady(ev: { target: YTPlayer }) {
          if (readyState.destroyed) return;
          player = ev.target;
          if (typeof initialVolume === "number" && initialVolume >= 0 && initialVolume <= 1) {
            player.setVolume(Math.round(initialVolume * 100));
            playerState.volume = initialVolume;
          } else {
            playerState.volume = player.getVolume() / 100;
          }
          onReady();

          // YouTube IFrame API has no timeupdate/progress event and no volume/mute event; polling required.
          if (readyState.destroyed) return;
          readyState.progressIntervalId = setInterval(() => {
            if (readyState.destroyed || !player) return;

            playerState.currentTime = player.getCurrentTime();
            onProgress(playerState.currentTime);

            const isMuted = player.isMuted();
            if (playerState.muted !== isMuted) {
              playerState.muted = isMuted;
              onMute({ muted: isMuted });
            }
            playerState.volume = player.getVolume() / 100;

            playerState.isPlaying = player.getPlayerState() === PlayerState.PLAYING;
            playerState.isPaused = player.getPlayerState() === PlayerState.PAUSED;
            playerState.duration = player.getDuration();
            playerState.currentTime = player.getCurrentTime();
            playerState.error = null;
          }, progressInterval);
        },
        onStateChange(ev: { data: number }) {
          if (ev.data === PlayerState.PLAYING) onPlay();
          if (ev.data === PlayerState.PAUSED) onPause();
          if (ev.data === PlayerState.BUFFERING) onBuffering();
          if (ev.data === PlayerState.ENDED) onEnded();
        },
        onPlaybackQualityChange(ev: { data: string }) {
          onPlaybackQualityChange(ev.data);
        },
        onPlaybackRateChange(ev: { data: number }) {
          onPlaybackRateChange(ev.data);
        },
        onAutoplayBlocked() {
          onAutoplayBlocked();
        },
        onApiChange() {
          onApiChange();
        },
      },
    });

    return {
      play: () => player!.playVideo(),
      pause: () => player!.pauseVideo(),
      get paused() {
        return playerState.isPaused;
      },
      get currentTime() {
        return playerState.currentTime;
      },
      get duration() {
        return playerState.duration;
      },
      seek(seconds: number) {
        player!.seekTo(seconds, true);
        onSeek(seconds);
      },
      mute: () => {
        player!.mute();
        playerState.muted = true;
        onMute({ muted: true });
      },
      unmute: () => {
        player!.unMute();
        playerState.muted = false;
        onMute({ muted: false });
      },
      get muted() {
        return playerState.muted;
      },
      get volume() {
        return playerState.volume;
      },
      setVolume(vol: number) {
        const v = Math.max(0, Math.min(1, vol));
        player!.setVolume(Math.round(v * 100));
        playerState.volume = v;
      },
      get error() {
        return playerState.error;
      },
      destroy() {
        readyState.destroyed = true;
        if (readyState.progressIntervalId) clearInterval(readyState.progressIntervalId);
        if (div.parentNode) div.remove();
      },
    };
  });
};
