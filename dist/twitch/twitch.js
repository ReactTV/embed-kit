import { REGEX_CHANNEL, REGEX_CLIP, REGEX_CLIPS_HOST, REGEX_VIDEO, } from "./constants.js";
import { createPlayer as createTwitchPlayer } from "./player.js";
export class TwitchEmbed {
    name = "twitch";
    #player = null;
    getEmbedUrl(id, options) {
        const twitchType = options?.twitchType;
        const isClip = twitchType === "clip";
        const isChannel = twitchType === "channel";
        const parent = options?.twitchParent ??
            options?.parent ??
            (typeof window !== "undefined" && window.location?.hostname) ??
            "localhost";
        const parentParam = parent === "localhost" || parent === "127.0.0.1"
            ? "parent=localhost&parent=127.0.0.1"
            : `parent=${encodeURIComponent(parent)}`;
        if (isClip) {
            return `https://clips.twitch.tv/embed?clip=${encodeURIComponent(id)}&${parentParam}`;
        }
        if (isChannel) {
            return `https://player.twitch.tv/?channel=${encodeURIComponent(id)}&${parentParam}`;
        }
        return `https://player.twitch.tv/?video=${id}&${parentParam}`;
    }
    async createPlayer(container, id, options) {
        const player = await createTwitchPlayer(container, id, options);
        this.#player = player;
        return player;
    }
    play() {
        this.#player?.play();
    }
    pause() {
        this.#player?.pause();
    }
    get paused() {
        return this.#player?.paused ?? true;
    }
    get currentTime() {
        return this.#player?.currentTime ?? 0;
    }
    seek(seconds) {
        this.#player?.seek(seconds);
    }
    mute() {
        this.#player?.mute();
    }
    unmute() {
        this.#player?.unmute();
    }
    get muted() {
        return this.#player?.muted ?? false;
    }
    get volume() {
        return this.#player?.volume;
    }
    setVolume(volume) {
        return this.#player?.setVolume?.(volume);
    }
    parseSourceUrl(url) {
        const trimmed = url.trim();
        const videoMatch = REGEX_VIDEO.exec(trimmed);
        if (videoMatch)
            return { id: videoMatch[1], provider: this.name };
        const clipsHostMatch = REGEX_CLIPS_HOST.exec(trimmed);
        if (clipsHostMatch)
            return { id: clipsHostMatch[1], provider: this.name, options: { twitchType: "clip" } };
        const clipMatch = REGEX_CLIP.exec(trimmed);
        if (clipMatch)
            return { id: clipMatch[1], provider: this.name, options: { twitchType: "clip" } };
        const channelMatch = REGEX_CHANNEL.exec(trimmed);
        if (channelMatch)
            return { id: channelMatch[1], provider: this.name, options: { twitchType: "channel" } };
        return null;
    }
}
//# sourceMappingURL=twitch.js.map