import { REGEX_WATCH, REGEX_SHORT, REGEX_EMBED } from "../constants.js";

export function parseYouTubeUrl(url: string): { videoId: string | undefined } {
  const videoId =
    url.match(REGEX_WATCH)?.[1] ?? url.match(REGEX_SHORT)?.[1] ?? url.match(REGEX_EMBED)?.[1];

  return {
    videoId,
  };
}
