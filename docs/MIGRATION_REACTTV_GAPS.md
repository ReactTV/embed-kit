# Logic Gaps: react-player → embed-kit (for ReactTV migration)

This doc lists **behavior or data** that the ReactTV repo currently gets from react-player and that embed-kit does not yet provide. You can either add this logic in embed-kit or adjust ReactTV to work without it.

---

## 1. **Volume get/set** ✅ Implemented

- **ReactTV usage:** `useChannelVolumeController` passes the player ref to `syncPlayerVolume(player)`, which reads `player.volume` and `player.muted` and syncs them with channel/global volume state. It also relies on being able to set volume on the player.
- **embed-kit:** `IEmbedPlayer` now has optional `readonly volume?: number | undefined` (0–1) and `setVolume?(volume: number)`. `ICreatePlayerOptions` accepts optional `volume?: number` for initial volume. Implemented for **YouTube** and **Vimeo**; other providers leave `volume` / `setVolume` undefined. Custom element exposes `volume` getter, `setVolume(volume)`, and `volume` attribute. ReactEmbedKit accepts `volume` prop.
- **Migration options:**
  - In ReactTV: drive volume only via mute/unmute and track “desired volume” in app state; when unmuting, you can’t restore a specific 0–1 level unless embed-kit adds volume.
  - Or add in embed-kit: optional `volume` (read) and `setVolume(volume: number)` on `IEmbedPlayer`, and pass initial `volume` in options where the provider supports it.

---

## 2. **Player API latency (provider-specific)**

c

- **ReactTV usage:** `getPlayerApiLatency(player)` uses:
  - YouTube: `player?.playerInfo?.mediaReferenceTime` → `Date.now()/1000 - mediaReferenceTime`
  - Twitch: `player?.getPlaybackStats?.().hlsLatencyBroadcaster`
- **embed-kit:** No latency API; the normalized player doesn’t expose provider-specific objects.
- **Migration options:**
  - In ReactTV: remove or replace latency-based features (e.g. use a different sync strategy).
  - Or add in embed-kit: optional `getLatency?(): number | Promise<number>` on `IEmbedPlayer`, implemented only by providers that can report it (e.g. YouTube, Twitch).

---

## 3. **Ref = player instance (play/pause/seek from ref)** ✅ Implemented

- **ReactTV usage:** `playerRef` is passed to the embed; code calls `playerRef.current?.play()`, `playerRef.current?.currentTime` (read and write for seeking), and `playerRef.current?.error` (for `onDetailedError`). The ref is typed as `HTMLVideoElement | null` but in practice it’s the react-player instance (or its internal player), which is used like a controllable handle.
- **embed-kit:** `ReactEmbedKit` accepts an optional `playerRef?: React.Ref<IEmbedPlayer | null>`. When the player is ready, the ref is set to the `IEmbedPlayer`; on unmount or when the URL changes it is set to `null`. Use `playerRef.current?.play()`, `playerRef.current?.pause()`, `playerRef.current?.seek(seconds)`, `playerRef.current?.currentTime`, `playerRef.current?.error`, etc. The custom element also exposes `play()`, `pause()`, `seek()`, `lastError`, etc. on the element itself.
- **Migration:** Pass `playerRef={playerRef}` to `ReactEmbedKit` and use it for play/pause/seek and `playerRef.current?.error` (e.g. for `onDetailedError`-style handling). For seeking, use `player.seek(seconds)` rather than writing to `currentTime`.

---

## 4. **onDetailedError with raw MediaError / embed-disabled codes**

- **ReactTV usage:** `onDetailedError?.(playerRef?.current?.error)` and checks for `mediaError?.code` in `[150, 101, 100]` to detect “embed disabled” and call `reportBrokenMedia` / show the right UI.
- **embed-kit:** `onError(data: IErrorData)` with `IErrorData = { code?: number | string; message?: string }`. Providers map their errors into this; e.g. YouTube can map 150/101/100 to `code`.
- **Migration options:**
  - In ReactTV: use `onError` and treat `data.code === 150 | 101 | 100` the same as today’s `onDetailedError(mediaError)`.
  - Ensure in embed-kit that the YouTube (and any other) provider maps those embed-disabled codes into `onError({ code: 150 })` etc. so no extra API is needed.

---

## 5. **Progress callback and seeking from inside progress**

- **ReactTV usage:** In `MediaPlayer` and `useChannelLocalPlaybackController`, `onProgress` receives an event and uses `event.target` as the player, then sets `player.currentTime = ...` to correct position (playable ranges, schedule sync).
- **embed-kit:** `onProgress(currentTime: number)` and `player.seek(seconds)`. No event and no direct `currentTime` setter; seeking is done via `seek()`.
- **Migration options:**
  - In ReactTV: in `onProgress(currentTime)`, compute the desired time and call `playerRef.current?.seek(desiredTime)` (where `playerRef` is the `IEmbedPlayer` from `onReady`). No API change needed in embed-kit.

---

## 6. **Custom element: onProgress / onEnded**

- **ReactTV usage:** Uses `onProgress` and `onEnded` on the embed.
- **embed-kit:** `createEmbedElement` does not declare or forward `onProgress` or `onEnded` to `createPlayer`. Only the React wrapper (`ReactEmbedKit`) passes them when using `createPlayer` directly.
- **Migration options:**
  - If ReactTV uses only `ReactEmbedKit` (or direct `createPlayer`), this is already covered.
  - If ReactTV ever uses the custom element, it would need `onEnded` and `onProgress` to be forwarded in the element’s options to `createPlayer` (logic only; the base API already has these callbacks).

---

## 7. **Controls / URL config (e.g. YouTube captions)** ✅ Implemented

- **ReactTV usage:** `BaseVideoEmbed` passes `config={{ youtube: { iv_load_policy: 1, cc_load_policy: enableCaptions ? 1 : 0, origin: ... } }}` and `controls={true}`.
- **embed-kit:** `ICreatePlayerOptions` and `ReactEmbedKit` support: **`controls`** (boolean, default true), **`enableCaptions`** (boolean), **`showAnnotations`** (boolean), **`config.youtube`** (object, merged into YouTube `playerVars` for e.g. `origin`). See [YouTube player parameters](https://developers.google.com/youtube/player_parameters).
- **Migration:** Pass `controls`, `enableCaptions`, `showAnnotations`, and/or `config={{ youtube: { ... } }}` to `ReactEmbedKit` or to `createPlayer` options. The YouTube provider applies these in `playerVars`.

---

## Summary table

| Gap                           | Where it’s used                    | Fix in ReactTV vs embed-kit                                        |
| ----------------------------- | ---------------------------------- | ------------------------------------------------------------------ |
| Volume get/set                | `syncPlayerVolume`, volume UI      | ReactTV: mute-only + state, or embed-kit: add volume               |
| Latency (YouTube/Twitch)      | `getPlayerApiLatency`              | ReactTV: remove/replace, or embed-kit: optional getLatency         |
| Ref = player instance         | play/pause/seek, error, volume     | ReactTV: store player in ref in onReady, or embed-kit: ref support |
| Embed-disabled error codes    | onDetailedError, reportBrokenMedia | Use onError + ensure 150/101/100 in IErrorData.code                |
| Seek from progress            | Playable ranges, sync              | ReactTV: call player.seek() in onProgress                          |
| onProgress/onEnded on element | If using custom element            | embed-kit: forward in createEmbedElement                           |
| Controls / captions config    | YouTube (and similar)              | embed-kit: controls, enableCaptions, showAnnotations, config.youtube |
