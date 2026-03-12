import React, { useState, useEffect, useMemo } from "react";
import type { EmbedPlayerRef } from "../../elements/_base/player.types.js";
import { ReactEmbedKit } from "../ReactEmbedKit.js";
import {
  SOURCE_URL as YOUTUBE_SOURCE_URL,
  VIDEO_ID as YOUTUBE_VIDEO_ID,
} from "../../elements/youtube/constants.js";
import { SOURCE_URL as VIMEO_SOURCE_URL } from "../../elements/vimeo/constants.js";
import { VIDEO_SOURCE_URL as TWITCH_VIDEO_SOURCE_URL } from "../../elements/twitch/constants.js";
import { SOURCE_URL as TIKTOK_SOURCE_URL } from "../../elements/tiktok/constants.js";
import { SOURCE_URL as DAILYMOTION_SOURCE_URL } from "../../elements/dailymotion/constants.js";

const MP4_SAMPLE_URL =
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4";

const PRESETS: { label: string; url: string }[] = [
  { label: "YouTube", url: YOUTUBE_SOURCE_URL },
  { label: "youtu.be", url: `https://youtu.be/${YOUTUBE_VIDEO_ID}` },
  { label: "Vimeo", url: VIMEO_SOURCE_URL },
  { label: "Twitch (video)", url: TWITCH_VIDEO_SOURCE_URL },
  { label: "TikTok", url: TIKTOK_SOURCE_URL },
  { label: "Dailymotion", url: DAILYMOTION_SOURCE_URL },
  { label: "MP4 (sample)", url: MP4_SAMPLE_URL },
];

function formatTime(seconds: number | null | undefined): string {
  if (seconds == null || Number.isNaN(seconds)) return "—";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

interface PollData {
  currentTime: number | null;
  duration: number | null;
  paused: boolean | null;
  muted: boolean | null;
  volume: number | null;
}

/**
 * Test page component for ReactEmbedKit: URL input, embed, play/pause/seek/mute
 * controls, and a data panel showing currentTime, duration, paused, muted,
 * isBuffering, isSeeking.
 */
export function ReactEmbedKitTestPage(): React.ReactElement {
  const [muted, setMuted] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [volume, setVolume] = useState(50);
  const [url, setUrl] = useState<string>(PRESETS[0]?.url ?? "");
  const [player, setPlayer] = useState<NonNullable<EmbedPlayerRef> | null>(null);
  const [buffering, setBuffering] = useState(false);
  const [controls, setControls] = useState(false);
  const [captions, setCaptions] = useState(false);
  const [annotations, setAnnotations] = useState(false);
  const [data, setData] = useState<PollData>({
    currentTime: null,
    duration: null,
    paused: null,
    muted: null,
    volume: null,
  });

  useEffect(() => {
    setPlayer(null);
    setBuffering(false);
  }, [url]);

  useEffect(() => {
    if (!player) {
      setData({ currentTime: null, duration: null, paused: null, muted: null, volume: null });
      return;
    }
    let cancelled = false;
    const poll = (): void => {
      if (cancelled) return;
      try {
        const currentTime = player.currentTime;
        const duration = player.duration;
        const paused = player.paused;
        const mutedVal = player.muted;
        const volumeVal = player.volume;
        if (!cancelled) {
          setData({
            currentTime: typeof currentTime === "number" ? currentTime : null,
            duration: typeof duration === "number" ? duration : null,
            paused: typeof paused === "boolean" ? paused : null,
            muted: typeof mutedVal === "boolean" ? mutedVal : null,
            volume: typeof volumeVal === "number" ? volumeVal : null,
          });
        }
      } catch {
        // ignore
      }
    };
    poll();
    const id = setInterval(poll, 500);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [player]);

  const dataRows: [string, string][] = player
    ? [
        ["currentTime", formatTime(data.currentTime)],
        ["duration", formatTime(data.duration)],
        ["paused", String(data.paused)],
        ["muted", String(data.muted)],
        ["volume", data.volume != null ? `${Math.round(data.volume)}%` : "—"],
        ["isBuffering", String(buffering)],
      ]
    : [];

  const selectedPreset = PRESETS.find((p) => p.url === url)?.url ?? "";

  const embedConfig = useMemo(
    () => ({
      youtube: {
        origin: typeof window !== "undefined" ? window.location.origin : undefined,
      },
    }),
    []
  );

  return (
    <div className="section">
      <label htmlFor="provider">Provider</label>
      <select
        id="provider"
        value={selectedPreset}
        onChange={(e) => {
          const value = e.target.value;
          if (value) setUrl(value);
        }}
        aria-label="Choose a provider to autofill URL"
      >
        <option value="">Custom / paste URL below</option>
        {PRESETS.map((p) => (
          <option key={p.url} value={p.url}>
            {p.label}
          </option>
        ))}
      </select>
      <label htmlFor="url">Video URL</label>
      <input
        id="url"
        type="url"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        placeholder="https://www.youtube.com/watch?v=..."
      />
      <p className="hint">
        Try: YouTube, youtu.be, Vimeo, Twitch videos/clips/channel, TikTok, Dailymotion, or MP4 URL
      </p>
      <div className="player-options" style={{ marginBottom: "0.75rem" }}>
        <label
          style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginRight: "1rem" }}
        >
          <input
            type="checkbox"
            checked={controls}
            onChange={(e) => setControls(e.target.checked)}
          />
          Show native controls
        </label>
        <label
          style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginRight: "1rem" }}
        >
          <input
            type="checkbox"
            checked={captions}
            onChange={(e) => setCaptions(e.target.checked)}
          />
          Enable captions
        </label>
        <label style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <input
            type="checkbox"
            checked={annotations}
            onChange={(e) => setAnnotations(e.target.checked)}
          />
          Show annotations
        </label>
      </div>
      <div className="player-wrap">
        <ReactEmbedKit
          playerRef={setPlayer}
          muted={muted}
          playing={playing}
          volume={volume}
          src={url}
          width={560}
          height={315}
          controls={controls}
          captions={captions}
          annotations={annotations}
          config={embedConfig}
          onReady={() => {}}
          onBuffering={() => setBuffering(true)}
          onPlay={() => {
            setBuffering(false);
            setPlaying(true);
          }}
          onPause={() => setPlaying(false)}
          onError={(d) => console.warn("Embed error:", d)}
          onProgress={() => {}}
          onVolumeChange={(v) => setVolume(v)}
          onMuteChange={(m) => setMuted(m)}
          onUnsupportedUrl={(u) => {
            setPlayer(null);
            console.warn("Unsupported URL:", u);
          }}
        />
      </div>
      <div className="controls">
        <button type="button" onClick={() => setPlaying(!playing)}>
          {playing ? "Pause" : "Play"}
        </button>
        <button
          type="button"
          onClick={() => {
            if (player) player.currentTime = 0;
          }}
        >
          Seek to 0:00
        </button>
        <button
          type="button"
          onClick={() => {
            if (player) player.currentTime = 30;
          }}
        >
          Seek to 0:30
        </button>
        <button type="button" onClick={() => setMuted(!muted)}>
          [{muted ? "Muted" : "Unmuted"}]
        </button>
        <label
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            marginLeft: "1rem",
            minWidth: "140px",
          }}
        >
          <span style={{ whiteSpace: "nowrap", fontSize: "0.9rem" }}>Volume</span>
          <input
            type="range"
            min={0}
            max={100}
            step={1}
            value={volume}
            onChange={(e) => setVolume(Number(e.target.value))}
            style={{ flex: 1, minWidth: 0 }}
            aria-label="Volume"
          />
        </label>
      </div>
      <div className="data-panel">
        {dataRows.length > 0 ? (
          <dl>
            {dataRows.map(([label, value]) => (
              <React.Fragment key={label}>
                <dt>{label}</dt>
                <dd>{value}</dd>
              </React.Fragment>
            ))}
          </dl>
        ) : (
          <p className="no-player">Load a supported URL to see live data.</p>
        )}
      </div>
    </div>
  );
}
