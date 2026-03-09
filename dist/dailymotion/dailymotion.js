import { REGEX_EMBED, REGEX_SHORT, REGEX_VIDEO } from "./constants.js";
import { createPlayer as createDailymotionPlayer } from "./player.js";
export class DailymotionEmbed {
    name = "dailymotion";
    #player = null;
    getEmbedUrl(id, _options) {
        void _options;
        return `https://www.dailymotion.com/embed/video/${id}`;
    }
    async createPlayer(container, id, options) {
        const player = await createDailymotionPlayer(container, id, options);
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
        return this.#player?.paused ?? false;
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
        const shortMatch = REGEX_SHORT.exec(trimmed);
        if (shortMatch)
            return { id: shortMatch[1], provider: this.name };
        const embedMatch = REGEX_EMBED.exec(trimmed);
        if (embedMatch)
            return { id: embedMatch[1], provider: this.name };
        return null;
    }
}
//# sourceMappingURL=dailymotion.js.map