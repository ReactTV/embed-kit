/**
 * Load a script by URL. Resolves when the script has loaded (script.onload),
 * or when options.ready() resolves if provided. Rejects on script load error.
 * If options.isLoaded() returns true, resolves immediately without loading.
 */
export function loadScript(url, options = {}) {
    const { isLoaded, ready, errorMessage = "Failed to load script" } = options;
    if (isLoaded?.())
        return Promise.resolve();
    return new Promise((resolve, reject) => {
        const script = document.createElement("script");
        script.src = url;
        script.async = true;
        script.onerror = () => reject(new Error(errorMessage));
        if (ready) {
            ready().then(resolve, reject);
        }
        else {
            script.onload = () => resolve();
        }
        document.head.appendChild(script);
    });
}
//# sourceMappingURL=script.js.map