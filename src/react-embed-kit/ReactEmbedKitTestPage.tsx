import React, { useState, useEffect } from "react";
import type { IEmbedPlayer } from "../_base/index.js";
import { ReactEmbedKit } from "./ReactEmbedKit.js";

const PRESETS: { label: string; url: string }[] = [
  { label: "YouTube", url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ" },
  { label: "youtu.be", url: "https://youtu.be/dQw4w9WgXcQ" },
  { label: "Vimeo", url: "https://player.vimeo.com/video/148751763" },
  { label: "Twitch (video)", url: "https://www.twitch.tv/videos/2156437342" },
  { label: "TikTok", url: "https://www.tiktok.com/@user/video/1234567890" },
  { label: "Dailymotion", url: "https://www.dailymotion.com/video/x8f3k2a" },
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
      <div className="player-wrap">
        <ReactEmbedKit
          url={url}
          width="560"
          height="315"
          onReady={(p) => {
            setPlayer(p);
            console.log("Embed ready");
          }}
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
        <button
          type="button"
          disabled={!player}
          onClick={() => player?.play()}
        >
          Play
        </button>
        <button
          type="button"
          disabled={!player}
          onClick={() => player?.pause()}
        >
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
        <button
          type="button"
          disabled={!player}
          onClick={() => player?.mute()}
        >
          Mute
        </button>
        <button
          type="button"
          disabled={!player}
          onClick={() => player?.unmute()}
        >
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
