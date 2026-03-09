import { createPlayer as createInternetArchivePlayer } from "./player.js";
export class InternetArchiveEmbed {
    name = "internet-archive";
    #player = null;
    getEmbedUrl(id, _options) {
        void _options;
        return `https://archive.org/embed/${id}`;
    }
    async createPlayer(container, id, options) {
        const player = await createInternetArchivePlayer(container, id, options);
        this.#player = player;
        return player;
    }
    play() {
        this.#player?.play();
    }
    pause() {
        this.#player?.pause();
    }
    getPaused() {
        return this.#player?.getPaused() ?? Promise.resolve(true);
    }
    parseSourceUrl(url) {
        const trimmed = url.trim();
        const detailsMatch = /archive\.org\/details\/([^/?#]+)/.exec(trimmed);
        if (detailsMatch)
            return { id: detailsMatch[1], provider: this.name };
        const embedMatch = /archive\.org\/embed\/([^/?#]+)/.exec(trimmed);
        if (embedMatch)
            return { id: embedMatch[1], provider: this.name };
        return null;
    }
}
//# sourceMappingURL=internet-archive.js.map