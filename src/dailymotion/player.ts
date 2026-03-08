import type { TCreatePlayer, TPlayerState } from "../_base/index.js";
import type { DailymotionPlayerState } from "./player.types.js";
import { createPlayerContainer, loadScript } from "../_base/index.js";

const DAILYMOTION_LIB = "https://geo.dailymotion.com/libs/player.js";

/**
 * Create a controllable Dailymotion player. The SDK finds the mount element by id via
 * document.getElementById. The container must be in the light DOM (e.g. a direct child
 * of the host element) so the SDK can find it; the base controllable element mounts there.
 */
export const createPlayer: TCreatePlayer = (container, id, options = {}) => {
  const {
    width = 560,
    height = 315,
    autoplay = false,
    onReady = () => {},
    onPlay = () => {},
    onPause = () => {},
    onBuffering = () => {},
    onEnded = () => {},
    onProgress = () => {},
    onSeek = () => {},
    onMute = () => {},
    onError = () => {},
  } = options;

  const { element: wrapper, id: containerId } = createPlayerContainer(
    container,
    "dailymotion-player",
    {
      width,
      height,
    }
  );

  return loadScript(DAILYMOTION_LIB, {
    isLoaded: () => !!window.dailymotion?.createPlayer,
    errorMessage: "Failed to load Dailymotion player script",
  })
    .then(() => {
      if (!window.dailymotion?.createPlayer) {
        wrapper.remove();
        return Promise.reject(new Error("Dailymotion player API not available"));
      }
      return window.dailymotion.createPlayer(containerId, {
        video: id,
        ...(autoplay ? { params: { autoplay: true } } : {}),
      });
    })
    .then((dmPlayer) => {
      onReady();
      const playerState: TPlayerState = {
        currentTime: 0,
        duration: 0,
        isPaused: true,
        muted: false,
        error: null,
      };

      const { events } = window.dailymotion!;

      dmPlayer.on(events.VIDEO_PLAY, onPlay);
      dmPlayer.on(events.VIDEO_PAUSE, onPause);
      dmPlayer.on(events.VIDEO_BUFFERING, onBuffering);
      dmPlayer.on(events.VIDEO_END, onEnded);

      const handleError = (): void => {
        playerState.error = { message: "Dailymotion playback error" };
        onError(playerState.error);
      };
      dmPlayer.on(events.PLAYER_ERROR, handleError);
      if (events.VIDEO_ERROR) dmPlayer.on(events.VIDEO_ERROR, handleError);

      dmPlayer.on(events.VIDEO_TIMECHANGE, (state?: DailymotionPlayerState) => {
        playerState.currentTime = state?.videoTime ?? 0;
        onProgress(playerState.currentTime);
      });

      return {
        get currentTime() {
          return dmPlayer.getState().then(async (state) => {
            if (typeof state.videoTime === "number" && !Number.isNaN(state.videoTime)) {
              return state.videoTime;
            }
            if (typeof dmPlayer.getPosition === "function") {
              return dmPlayer.getPosition!();
            }
            return 0;
          });
        },
        destroy() {
          dmPlayer.destroy();
          wrapper.remove();
        },
        get duration() {
          if (typeof dmPlayer.getDuration === "function") {
            return dmPlayer.getDuration();
          }
          return dmPlayer
            .getState()
            .then((state) =>
              typeof state.videoDuration === "number" && !Number.isNaN(state.videoDuration)
                ? state.videoDuration
                : 0
            );
        },
        get error() {
          return playerState.error;
        },
        get muted() {
          return Promise.resolve(playerState.muted);
        },
        mute() {
          if (typeof dmPlayer.setMute === "function") {
            dmPlayer.setMute(true);
            playerState.muted = true;
            onMute(true);
          }
        },
        pause() {
          dmPlayer.pause();
        },
        get paused() {
          return dmPlayer.getState().then((state) => state.playerIsPlaying === false);
        },
        play() {
          dmPlayer.play();
        },
        seek(seconds: number) {
          if (typeof dmPlayer.seek === "function") {
            dmPlayer.seek(seconds);
            onSeek(seconds);
          }
        },
        unmute() {
          if (typeof dmPlayer.setMute === "function") {
            dmPlayer.setMute(false);
            playerState.muted = false;
            onMute(false);
          }
        },
      };
    })
    .catch((err) => {
      wrapper.remove();
      throw err;
    });
};
