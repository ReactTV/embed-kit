/**
 * Side-effect only: imports all embed player modules so their custom elements
 * are defined. Dynamic-import this only in the browser so that code extending
 * HTMLElement never runs on the server.
 */
import "../elements/youtube/player.js";
import "../elements/twitch/player.js";
import "../elements/vimeo/player.js";
import "../elements/tiktok/player.js";
import "../elements/dailymotion/player.js";
