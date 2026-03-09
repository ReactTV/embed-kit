import { describe, it, expect, vi } from "vitest";
/**
 * Fake player that implements IEmbedPlayer for testing the play/pause flow
 * without real embed SDKs.
 */
function createFakePlayer(options = {}) {
    const { onReady = () => { }, onPlay = () => { }, onPause = () => { }, } = options;
    let paused = true;
    let currentTime = 0;
    const duration = 100;
    let muted = false;
    let error = null;
    const player = {
        play() {
            if (paused) {
                paused = false;
                onPlay();
            }
        },
        pause() {
            if (!paused) {
                paused = true;
                onPause();
            }
        },
        seek(seconds) {
            currentTime = Math.max(0, Math.min(seconds, duration));
        },
        mute() {
            muted = true;
        },
        unmute() {
            muted = false;
        },
        get paused() {
            return paused;
        },
        get currentTime() {
            return currentTime;
        },
        get duration() {
            return duration;
        },
        get muted() {
            return muted;
        },
        get error() {
            return error;
        },
    };
    onReady();
    return Promise.resolve(player);
}
describe("play/pause flow", () => {
    describe("IEmbedPlayer contract", () => {
        it("starts paused", async () => {
            const player = await createFakePlayer();
            expect(player.paused).toBe(true);
        });
        it("play() sets paused to false and invokes onPlay", async () => {
            const onPlay = vi.fn();
            const player = await createFakePlayer({ onPlay });
            expect(player.paused).toBe(true);
            expect(onPlay).not.toHaveBeenCalled();
            player.play();
            expect(player.paused).toBe(false);
            expect(onPlay).toHaveBeenCalledTimes(1);
        });
        it("pause() sets paused to true and invokes onPause", async () => {
            const onPause = vi.fn();
            const player = await createFakePlayer({ onPause });
            player.play();
            expect(player.paused).toBe(false);
            expect(onPause).not.toHaveBeenCalled();
            player.pause();
            expect(player.paused).toBe(true);
            expect(onPause).toHaveBeenCalledTimes(1);
        });
        it("play() then pause() toggles state and fires both callbacks", async () => {
            const onPlay = vi.fn();
            const onPause = vi.fn();
            const player = await createFakePlayer({ onPlay, onPause });
            player.play();
            expect(player.paused).toBe(false);
            expect(onPlay).toHaveBeenCalledTimes(1);
            expect(onPause).not.toHaveBeenCalled();
            player.pause();
            expect(player.paused).toBe(true);
            expect(onPause).toHaveBeenCalledTimes(1);
            player.play();
            expect(player.paused).toBe(false);
            expect(onPlay).toHaveBeenCalledTimes(2);
        });
        it("calling play() when already playing does not fire onPlay again", async () => {
            const onPlay = vi.fn();
            const player = await createFakePlayer({ onPlay });
            player.play();
            player.play();
            player.play();
            expect(player.paused).toBe(false);
            expect(onPlay).toHaveBeenCalledTimes(1);
        });
        it("calling pause() when already paused does not fire onPause again", async () => {
            const onPause = vi.fn();
            const player = await createFakePlayer({ onPause });
            player.pause();
            player.pause();
            expect(player.paused).toBe(true);
            expect(onPause).not.toHaveBeenCalled();
        });
    });
    describe("createPlayer (TCreatePlayer) play/pause flow", () => {
        it("resolved player supports play/pause and reports paused correctly", async () => {
            const createPlayer = (container, id, options = {}) => createFakePlayer(options);
            const container = document.createElement("div");
            document.body.appendChild(container);
            const player = await createPlayer(container, "fake-id", {
                onPlay: () => { },
                onPause: () => { },
            });
            expect(player).toBeDefined();
            expect(player.paused).toBe(true);
            player.play();
            expect(player.paused).toBe(false);
            player.pause();
            expect(player.paused).toBe(true);
            document.body.removeChild(container);
        });
        it("callbacks passed to createPlayer are invoked on play/pause", async () => {
            const onPlay = vi.fn();
            const onPause = vi.fn();
            const createPlayer = (container, id, options = {}) => createFakePlayer(options);
            const container = document.createElement("div");
            document.body.appendChild(container);
            const player = await createPlayer(container, "fake-id", {
                onPlay,
                onPause,
            });
            player.play();
            expect(onPlay).toHaveBeenCalledTimes(1);
            player.pause();
            expect(onPause).toHaveBeenCalledTimes(1);
            document.body.removeChild(container);
        });
    });
});
//# sourceMappingURL=player.test.js.map