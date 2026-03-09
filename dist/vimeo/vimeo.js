import { REGEX_CHANNELS, REGEX_DIRECT, REGEX_GROUPS, REGEX_HASH, REGEX_PLAYER, } from "./constants.js";
import { createPlayer as createVimeoPlayer } from "./player.js";
export class VimeoEmbed {
    name = "vimeo";
    #player = null;
    getEmbedUrl(id, options) {
        const base = `https://player.vimeo.com/video/${id}`;
        const hash = options?.vimeoHash;
        if (hash)
            return `${base}?h=${encodeURIComponent(hash)}`;
        return base;
    }
    async createPlayer(container, id, options) {
        const player = await createVimeoPlayer(container, id, options);
        this.#player = player;
        return player;
    }
    play() {
        return this.#player?.play();
    }
    pause() {
        return this.#player?.pause();
    }
    get paused() {
        return this.#player?.paused ?? true;
    }
    get currentTime() {
        return this.#player?.currentTime ?? 0;
    }
    seek(seconds) {
        return this.#player?.seek(seconds);
    }
    mute() {
        return this.#player?.mute();
    }
    unmute() {
        return this.#player?.unmute();
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
        if (playerMatch) {
            const id = playerMatch[1];
            const hashMatch = REGEX_HASH.exec(trimmed);
            return hashMatch
                ? { id, provider: this.name, options: { vimeoHash: decodeURIComponent(hashMatch[1]) } }
                : { id, provider: this.name };
        }
        const directMatch = REGEX_DIRECT.exec(trimmed);
        if (directMatch) {
            const id = directMatch[1];
            const hashMatch = REGEX_HASH.exec(trimmed);
            return hashMatch
                ? { id, provider: this.name, options: { vimeoHash: decodeURIComponent(hashMatch[1]) } }
                : { id, provider: this.name };
        }
        const channelsMatch = REGEX_CHANNELS.exec(trimmed);
        if (channelsMatch)
            return { id: channelsMatch[1], provider: this.name };
        const groupsMatch = REGEX_GROUPS.exec(trimmed);
        if (groupsMatch)
            return { id: groupsMatch[1], provider: this.name };
        return null;
    }
}
//# sourceMappingURL=vimeo.js.map