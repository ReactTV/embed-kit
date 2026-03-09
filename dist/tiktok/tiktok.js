import { REGEX_EMBED, REGEX_PLAYER, REGEX_VIDEO, REGEX_VM } from "./constants.js";
import { createPlayer as createTikTokPlayer } from "./player.js";
export class TikTokEmbed {
    name = "tiktok";
    #player = null;
    getEmbedUrl(id, _options) {
        void _options;
        return `https://www.tiktok.com/player/v1/${id}`;
    }
    async createPlayer(container, id, options) {
        const player = await createTikTokPlayer(container, id, options);
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
        const playerMatch = REGEX_PLAYER.exec(trimmed);
        if (playerMatch)
            return { id: playerMatch[1], provider: this.name };
        const vmMatch = REGEX_VM.exec(trimmed);
        if (vmMatch)
            return { id: vmMatch[1], provider: this.name };
        const videoMatch = REGEX_VIDEO.exec(trimmed);
        if (videoMatch)
            return { id: videoMatch[1], provider: this.name };
        const embedMatch = REGEX_EMBED.exec(trimmed);
        if (embedMatch)
            return { id: embedMatch[1], provider: this.name };
        return null;
    }
}
//# sourceMappingURL=tiktok.js.map