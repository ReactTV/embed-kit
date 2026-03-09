import React, { useState, useEffect, useMemo } from "react";
import type { IEmbedPlayer } from "../../elements/_base/index.js";
import { ReactEmbedKit } from "../ReactEmbedKit.js";
import {
  SOURCE_URL as YOUTUBE_SOURCE_URL,
  VIDEO_ID as YOUTUBE_VIDEO_ID,
} from "../youtube/constants.js";
import { SOURCE_URL as VIMEO_SOURCE_URL } from "../vimeo/constants.js";
import { VIDEO_SOURCE_URL as TWITCH_VIDEO_SOURCE_URL } from "../twitch/constants.js";
import { SOURCE_URL as TIKTOK_SOURCE_URL } from "../tiktok/constants.js";
import { SOURCE_URL as DAILYMOTION_SOURCE_URL } from "../dailymotion/constants.js";

const PRESETS: { label: string; url: string }[] = [
  { label: "YouTube", url: YOUTUBE_SOURCE_URL },
  { label: "youtu.be", url: `https://youtu.be/${YOUTUBE_VIDEO_ID}` },
  { label: "Vimeo", url: VIMEO_SOURCE_URL },
  { label: "Twitch (video)", url: TWITCH_VIDEO_SOURCE_URL },
  { label: "TikTok", url: TIKTOK_SOURCE_URL },
  { label: "Dailymotion", url: DAILYMOTION_SOURCE_URL },
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
}

/**
 * Test page component for ReactEmbedKit: URL input, embed, play/pause/seek/mute
 * controls, and a data panel showing currentTime, duration, paused, muted,
 * isBuffering, isSeeking.
 */
export function ReactEmbedKitTestPage(): React.ReactElement {
  const [url, setUrl] = useState<string>(PRESETS[0]?.url ?? "");
  const [player, setPlayer] = useState<IEmbedPlayer | null>(null);
  const [buffering, setBuffering] = useState(false);
  const [seeking, setSeeking] = useState(false);
  const [controls, setControls] = useState(true);
  const [enableCaptions, setEnableCaptions] = useState(false);
  const [showAnnotations, setShowAnnotations] = useState(true);
  const [data, setData] = useState<PollData>({
    currentTime: null,
    duration: null,
    paused: null,
    muted: null,
  });

  useEffect(() => {
    setPlayer(null);
    setBuffering(false);
    setSeeking(false);
  }, [url]);

  useEffect(() => {
    if (!player) {
      setData({ currentTime: null, duration: null, paused: null, muted: null });
      return;
    }
    let cancelled = false;
    const poll = async (): Promise<void> => {
      if (cancelled) return;
      try {
        const [currentTime, duration, paused, muted] = await Promise.all([
          player.currentTime,
          player.duration,
          player.paused,
          player.muted,
        ]);
        if (!cancelled) setData({ currentTime, duration, paused, muted });
      } catch {
        // ignore
      }
    };
    void poll();
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
        ["isBuffering", String(buffering)],
        ["isSeeking", String(seeking)],
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
        Try: YouTube, youtu.be, Vimeo, Twitch videos/clips/channel, TikTok, Dailymotion
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
            checked={enableCaptions}
            onChange={(e) => setEnableCaptions(e.target.checked)}
          />
          Enable captions
        </label>
        <label style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <input
            type="checkbox"
            checked={showAnnotations}
            onChange={(e) => setShowAnnotations(e.target.checked)}
          />
          Show annotations
        </label>
      </div>
      <div className="player-wrap">
        <ReactEmbedKit
          url={url}
          width={560}
          height={315}
          controls={controls}
          enableCaptions={enableCaptions}
          showAnnotations={showAnnotations}
          config={embedConfig}
          onReady={(p) => setPlayer(p)}
          onBuffering={() => setBuffering(true)}
          onPlay={() => setBuffering(false)}
          onSeeking={() => setSeeking(true)}
          onSeek={() => setSeeking(false)}
          onError={(d) => console.warn("Embed error:", d)}
          onUnsupportedUrl={(u) => {
            setPlayer(null);
            console.warn("Unsupported URL:", u);
          }}
        />
      </div>
      <div className="controls">
        <button type="button" disabled={!player} onClick={() => player?.play()}>
          Play
        </button>
        <button type="button" disabled={!player} onClick={() => player?.pause()}>
          Pause
        </button>
        <button
          type="button"
          disabled={!player}
          onClick={() => {
            setSeeking(true);
            player?.seek(0);
          }}
        >
          Seek to 0:00
        </button>
        <button
          type="button"
          disabled={!player}
          onClick={() => {
            setSeeking(true);
            player?.seek(30);
          }}
        >
          Seek to 0:30
        </button>
        <button type="button" disabled={!player} onClick={() => player?.mute()}>
          Mute
        </button>
        <button type="button" disabled={!player} onClick={() => player?.unmute()}>
          Unmute
        </button>
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
