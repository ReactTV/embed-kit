const DEFAULT_WIDTH = 560;
const DEFAULT_HEIGHT = 315;
export function createEmbedElement(provider) {
    return class extends HTMLElement {
        static get observedAttributes() {
            return ["src", "video-id", "width", "height", "title", "autoplay", "volume"];
        }
        #playerPromise = null;
        #player = null;
        #container = null;
        #lastError = null;
        #renderId = 0;
        /** Resolves to the current player, or null if no video/id or not yet created. */
        get player() {
            if (this.#player)
                return Promise.resolve(this.#player);
            if (this.#playerPromise)
                return this.#playerPromise;
            return Promise.resolve(null);
        }
        #destroyPlayer() {
            try {
                this.#player?.destroy?.();
            }
            finally {
                this.#player = null;
                this.#playerPromise = null;
                if (this.#container?.parentNode)
                    this.#container.remove();
                this.#container = null;
            }
        }
        connectedCallback() {
            this.#render();
        }
        disconnectedCallback() {
            this.#destroyPlayer();
            this.#lastError = null;
        }
        attributeChangedCallback() {
            this.#render();
        }
        async play() {
            (await this.player)?.play();
        }
        async pause() {
            (await this.player)?.pause();
        }
        get paused() {
            return this.player.then((p) => p?.paused ?? Promise.resolve(true));
        }
        get currentTime() {
            return this.player.then((p) => p?.currentTime ?? Promise.resolve(0));
        }
        get duration() {
            return this.player.then((p) => p?.duration ?? Promise.resolve(0));
        }
        async seek(seconds) {
            (await this.player)?.seek(seconds);
        }
        async mute() {
            (await this.player)?.mute();
        }
        async unmute() {
            (await this.player)?.unmute();
        }
        get muted() {
            return this.player.then((p) => p?.muted ?? Promise.resolve(false));
        }
        /** Volume 0–1 when supported by the provider. */
        get volume() {
            return this.player.then((p) => p?.volume);
        }
        async setVolume(volume) {
            (await this.player)?.setVolume?.(volume);
        }
        /** Last error from the player, if any. Cleared when the embed is recreated (e.g. video-id change). */
        get lastError() {
            return this.#lastError;
        }
        #render() {
            const srcAttr = this.getAttribute("src");
            const idAttr = this.getAttribute("video-id");
            let id = null;
            let options;
            if (srcAttr) {
                const parsed = provider.parseSourceUrl(srcAttr);
                if (parsed) {
                    id = parsed.id;
                    options = parsed.options;
                }
            }
            else if (idAttr) {
                id = idAttr;
            }
            if (!id) {
                this.#destroyPlayer();
                this.#lastError = null;
                return;
            }
            const width = parseInt(this.getAttribute("width") ?? String(DEFAULT_WIDTH), 10) || DEFAULT_WIDTH;
            const height = parseInt(this.getAttribute("height") ?? String(DEFAULT_HEIGHT), 10) || DEFAULT_HEIGHT;
            this.style.display = "block";
            this.style.width = `${width}px`;
            this.style.height = `${height}px`;
            // Only mount and create the player when the element is in the document.
            // Otherwise (e.g. attributes set before appendChild), the iframe is never
            // in the DOM and providers like Vimeo never fire ready().
            if (!this.isConnected) {
                this.#destroyPlayer();
                this.#lastError = null;
                return;
            }
            this.#destroyPlayer();
            const renderId = ++this.#renderId;
            const container = document.createElement("div");
            container.style.display = "block";
            container.style.width = `${width}px`;
            container.style.height = `${height}px`;
            container.style.minWidth = `${width}px`;
            container.style.minHeight = `${height}px`;
            container.style.overflow = "hidden";
            this.appendChild(container);
            this.#container = container;
            const autoplayAttr = this.getAttribute("autoplay");
            const autoplay = autoplayAttr !== null && autoplayAttr !== "false";
            const volumeAttr = this.getAttribute("volume");
            const volume = volumeAttr !== null ? parseFloat(volumeAttr) : undefined;
            const noop = () => { };
            const userOnError = this.onError ?? noop;
            this.#playerPromise = provider.createPlayer(container, id, {
                width,
                height,
                autoplay,
                ...(typeof volume === "number" && !Number.isNaN(volume) && { volume }),
                onReady: this.onReady ?? noop,
                onPlay: this.onPlay ?? noop,
                onPause: this.onPause ?? noop,
                onBuffering: this.onBuffering ?? noop,
                onEnded: this.onEnded ?? noop,
                onProgress: this.onProgress ?? noop,
                onDurationChange: this.onDurationChange ?? noop,
                onSeeking: this.onSeeking ?? noop,
                onSeek: this.onSeek ?? noop,
                onMute: this.onMute ?? noop,
                onError: (data) => {
                    this.#lastError = data;
                    userOnError(data);
                },
                ...options,
            }).then((player) => {
                if (this.#renderId !== renderId) {
                    player.destroy?.();
                    return player;
                }
                this.#player = player;
                return player;
            });
        }
    };
}
//# sourceMappingURL=element.js.map