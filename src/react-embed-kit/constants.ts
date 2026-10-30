export const AUDIO_EXTENSIONS =
  /\.(m4a|m4b|mp4a|mpga|mp2|mp2a|mp3|m2a|m3a|wav|weba|aac|oga|spx)($|\?)/i;
export const VIDEO_EXTENSIONS = /\.(mp4|og[gv]|webm|mov|m4v)(#t=[,\d+]+)?($|\?)/i;
/** Internet Archive file downloads, whose names don't always end in a media extension (e.g. `.mp4.~1~` revisions). */
export const ARCHIVE_FILE_URL =
  /^https?:\/\/([a-z0-9-]+\.)*archive\.org\/(download|\d+\/items)\/[^/]+\/./i;

/** Whether `url` is a direct audio/video file for the HTML player rather than a provider embed. */
export const isMediaFileUrl = (url: string): boolean =>
  AUDIO_EXTENSIONS.test(url) || VIDEO_EXTENSIONS.test(url) || ARCHIVE_FILE_URL.test(url);
