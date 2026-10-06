/**
 * Provider constants: test URLs and patterns for Facebook video embeds.
 * @see https://developers.facebook.com/docs/plugins/embedded-video-player/
 */

/** facebook.com/{page}/videos/{numericId} */
export const REGEX_VIDEOS =
  /(?:https?:\/\/)?(?:www\.|m\.)?facebook\.com\/[^/?#]+\/videos\/(\d+)/i;

/** facebook.com/{page}/posts/{numericId} (video posts) */
export const REGEX_POSTS = /(?:https?:\/\/)?(?:www\.|m\.)?facebook\.com\/[^/?#]+\/posts\/(\d+)/i;

/** facebook.com/video.php?v={numericId} */
export const REGEX_VIDEO_PHP =
  /(?:https?:\/\/)?(?:www\.|m\.)?facebook\.com\/video\.php\?(?:[^#]*&)?v=(\d+)/i;

/** fb.watch short links */
export const REGEX_FB_WATCH = /(?:https?:\/\/)?(?:www\.)?fb\.watch\/([a-zA-Z0-9_-]+)/i;

/** facebook.com/reel/{numericId} (Reels permalink) */
export const REGEX_REEL = /(?:https?:\/\/)?(?:www\.|m\.)?facebook\.com\/reel\/(\d+)/i;

export const VIDEO_ID = "10153231379946729";

/** Classic page video URL (Meta docs example). */
export const CLASSIC_VIDEO_SOURCE_URL = `https://www.facebook.com/facebook/videos/${VIDEO_ID}/`;

/** Portrait reel frame: width / height (9:16). */
export const REEL_ASPECT_WIDTH = 9;
export const REEL_ASPECT_HEIGHT = 16;

export const REEL_ID = "1093894635842790";

/** Default test URL: public Reel permalink. */
export const SOURCE_URL = `https://www.facebook.com/reel/${REEL_ID}`;

export function isFacebookVideoUrl(src: string): boolean {
  const trimmed = src?.trim();
  if (!trimmed) return false;
  return (
    REGEX_VIDEOS.test(trimmed) ||
    REGEX_POSTS.test(trimmed) ||
    REGEX_VIDEO_PHP.test(trimmed) ||
    REGEX_FB_WATCH.test(trimmed) ||
    REGEX_REEL.test(trimmed)
  );
}

export function isFacebookReelUrl(src: string): boolean {
  const trimmed = src?.trim();
  if (!trimmed) return false;
  return REGEX_REEL.test(trimmed);
}

export function normalizeFacebookVideoHref(src: string): string | undefined {
  if (!isFacebookVideoUrl(src)) return undefined;
  const trimmed = src.trim();
  return trimmed.startsWith("http") ? trimmed : `https://${trimmed}`;
}

export function getFacebookStartSeconds(
  config: Record<string, number | string | undefined> | undefined
): number | undefined {
  const raw = config?.start ?? config?.startTime ?? config?.startSeconds;
  if (raw == null || raw === "") return undefined;
  const start = Math.floor(Number(raw));
  if (!Number.isFinite(start) || start <= 0) return undefined;
  return start;
}

/** Facebook permalink timestamps use `t` (seconds), e.g. `.../videos/123/?t=49`. */
export function isFacebookTruthyConfig(value: unknown): boolean {
  return value === true || value === "true" || value === 1 || value === "1";
}

export function applyStartTimeToFacebookHref(href: string, startSeconds: number): string {
  const start = Math.floor(startSeconds);
  if (start <= 0) return href;
  try {
    const url = new URL(href);
    url.searchParams.set("t", String(start));
    return url.toString();
  } catch {
    const sep = href.includes("?") ? "&" : "?";
    return `${href}${sep}t=${start}`;
  }
}
