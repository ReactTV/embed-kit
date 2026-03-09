import { REGEX_EMBED, REGEX_SHORT, REGEX_WATCH } from "./constants.js";
import { createPlayer as createYouTubePlayer } from "./player.js";
export class YouTubeEmbed {
    name = "youtube";
    #player = null;
    getEmbedUrl(id, _options) {
        void _options;
        return `https://www.youtube.com/embed/${id}`;
    }
    async createPlayer(container, id, options) {
        const player = await createYouTubePlayer(container, id, options);
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
        const watchMatch = REGEX_WATCH.exec(trimmed);
        if (watchMatch)
            return { id: watchMatch[1], provider: this.name };
        const shortMatch = REGEX_SHORT.exec(trimmed);
        if (shortMatch)
            return { id: shortMatch[1], provider: this.name };
        const embedMatch = REGEX_EMBED.exec(trimmed);
        if (embedMatch)
            return { id: embedMatch[1], provider: this.name };
        return null;
    }
}
//# sourceMappingURL=youtube.js.map