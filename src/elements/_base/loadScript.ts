export interface LoadScriptOptions {
  /**
   * If provided and returns true, skip loading and resolve immediately.
   */
  isLoaded?: () => boolean;
  /**
   * If provided, resolve when this promise resolves instead of on script onload.
   * Use for SDKs that signal readiness via a global callback (e.g. YouTube's onYouTubeIframeAPIReady).
   * The script is still appended; rejection on script error still applies.
   */
  ready?: () => Promise<void>;
  /** Error message when script fails to load. */
  errorMessage?: string;
}

/**
 * Load a script by URL. Resolves when the script has loaded (script.onload),
 * or when options.ready() resolves if provided. Rejects on script load error.
 * If options.isLoaded() returns true, resolves immediately without loading.
 */
export function loadScript(url: string, options: LoadScriptOptions = {}): Promise<void> {
  const { isLoaded, ready, errorMessage = "Failed to load script" } = options;

  if (isLoaded?.()) return Promise.resolve();

  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = url;
    script.async = true;
    script.onerror = () => reject(new Error(errorMessage));

    if (ready) {
      ready().then(resolve, reject);
    } else {
      script.onload = () => resolve();
    }

    document.head.appendChild(script);
  });
}
