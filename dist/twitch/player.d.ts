import { type TCreatePlayer } from "../_base/index.js";
/**
 * Create a Twitch player in the given container (video by id, channel by name, or clip by slug).
 * Uses player.twitch.tv for VOD/channel (postMessage API) or clips.twitch.tv/embed for clips (no control API).
 * Same player interface; clip embeds do not respond to play/pause/seek/mute.
 */
export declare const createPlayer: TCreatePlayer;
//# sourceMappingURL=player.d.ts.map