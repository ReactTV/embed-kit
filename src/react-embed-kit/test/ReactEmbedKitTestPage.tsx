import React, { useState, useEffect, useMemo } from "react";
import type { EmbedPlayerRef } from "../../elements/_base/player.types.js";
import { ReactEmbedKit } from "../ReactEmbedKit.js";
import { SOURCE_URL as YOUTUBE_SOURCE_URL } from "../../elements/youtube/constants.js";
import { SOURCE_URL as VIMEO_SOURCE_URL } from "../../elements/vimeo/constants.js";
import {
  VIDEO_SOURCE_URL as TWITCH_VIDEO_SOURCE_URL,
  CLIP_SOURCE_URL as TWITCH_CLIP_SOURCE_URL,
  CHANNEL_CLIP_SOURCE_URL as TWITCH_CHANNEL_CLIP_SOURCE_URL,
  CHANNEL_SOURCE_URL as TWITCH_CHANNEL_SOURCE_URL,
} from "../../elements/twitch/constants.js";
import { SOURCE_URL as TIKTOK_SOURCE_URL } from "../../elements/tiktok/constants.js";
import { SOURCE_URL as DAILYMOTION_SOURCE_URL } from "../../elements/dailymotion/constants.js";

const MP4_SAMPLE_URL =
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4";

const PRESETS: { label: string; urls: string[] }[] = [
  {
    label: "YouTube",
    urls: [
      YOUTUBE_SOURCE_URL,
      "https://www.youtube.com/watch?v=Q8ZjLYesvqo",
      "https://www.youtube.com/watch?v=H_rlThh2ze8",
      "https://www.youtube.com/watch?v=HURVox6rE6g",
      "https://www.youtube.com/watch?v=8ob1Q7xJSYc",
    ],
  },
  {
    label: "Vimeo",
    urls: [VIMEO_SOURCE_URL, "https://vimeo.com/107433577"],
  },
  {
    label: "Twitch",
    urls: [
      TWITCH_VIDEO_SOURCE_URL,
      TWITCH_CLIP_SOURCE_URL,
      TWITCH_CHANNEL_CLIP_SOURCE_URL,
      TWITCH_CHANNEL_SOURCE_URL,
    ],
  },
  {
    label: "TikTok",
    urls: [TIKTOK_SOURCE_URL],
  },
  {
    label: "Dailymotion",
    urls: [DAILYMOTION_SOURCE_URL],
  },
  {
    label: "MP4",
    urls: [MP4_SAMPLE_URL],
  },
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
  const [selectedPresetIdx, setSelectedPresetIdx] = useState(0);
  const [urlIdx, setUrlIdx] = useState(0);
  const [url, setUrl] = useState<string>(PRESETS[0]?.urls[0] ?? "");
  const [player, setPlayer] = useState<NonNullable<EmbedPlayerRef> | null>(null);
  const [buffering, setBuffering] = useState(false);
  const [controls, setControls] = useState(false);
  const [captions, setCaptions] = useState(false);
  const [annotations, setAnnotations] = useState(false);
  const [autoplay, setAutoplay] = useState(false);
  const [startSeconds, setStartSeconds] = useState<number>(60);
  const [progress, setProgress] = useState<number | null>(null);
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

  const isYouTube = /youtube\.com|youtu\.be/.test(url);

  const currentPreset = selectedPresetIdx >= 0 ? PRESETS[selectedPresetIdx] : null;
  const canCycle = currentPreset != null && currentPreset.urls.length > 1;

  const cycleUrl = () => {
    if (!currentPreset) return;
    const nextIdx = (urlIdx + 1) % currentPreset.urls.length;
    setUrlIdx(nextIdx);
    setUrl(currentPreset.urls[nextIdx] ?? "");
  };

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
        value={selectedPresetIdx >= 0 ? String(selectedPresetIdx) : ""}
        onChange={(e) => {
          if (!e.target.value) {
            setSelectedPresetIdx(-1);
            return;
          }
          const idx = Number(e.target.value);
          const preset = PRESETS[idx];
          if (!preset) return;
          setSelectedPresetIdx(idx);
          setUrlIdx(0);
          setUrl(preset.urls[0] ?? "");
        }}
        aria-label="Choose a provider to autofill URL"
      >
        <option value="">Custom / paste URL below</option>
        {PRESETS.map((p, i) => (
          <option key={p.label} value={i}>
            {p.label}
          </option>
        ))}
      </select>
      <label htmlFor="url">Video URL</label>
      <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
        <input
          id="url"
          type="url"
          value={url}
          onChange={(e) => {
            setUrl(e.target.value);
            setSelectedPresetIdx(-1);
            setUrlIdx(0);
          }}
          placeholder="https://www.youtube.com/watch?v=..."
          style={{ flex: 1 }}
        />
        {canCycle && (
          <button type="button" onClick={cycleUrl}>
            Next URL ({urlIdx + 1}/{currentPreset.urls.length})
          </button>
        )}
      </div>
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
        <label
          style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginRight: "1rem" }}
        >
          <input
            type="checkbox"
            checked={annotations}
            onChange={(e) => setAnnotations(e.target.checked)}
          />
          Show annotations
        </label>
        <label
          style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginRight: "1rem" }}
        >
          <input
            type="checkbox"
            checked={autoplay}
            onChange={(e) => setAutoplay(e.target.checked)}
          />
          Autoplay
        </label>
        <label style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <input type="checkbox" checked={!muted} onChange={(e) => setMuted(!e.target.checked)} />
          Unmute
        </label>
        {isYouTube && (
          <label
            style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginLeft: "1rem" }}
          >
            <span style={{ whiteSpace: "nowrap", fontSize: "0.9rem" }}>Start (s)</span>
            <input
              type="number"
              min={0}
              step={1}
              value={startSeconds}
              onChange={(e) => setStartSeconds(Number(e.target.value))}
              style={{ width: "70px" }}
              aria-label="Start time in seconds"
            />
          </label>
        )}
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
          autoplay={autoplay}
          {...(isYouTube ? { startSeconds } : {})}
          config={embedConfig}
          onReady={() => {}}
          onBuffering={() => setBuffering(true)}
          onPlay={() => {
            setBuffering(false);
            setPlaying(true);
          }}
          onProgress={(p) => setProgress(p)}
          onPause={() => setPlaying(false)}
          // eslint-disable-next-line no-console
          onError={(d) => console.warn("Embed error:", d)}
          onVolumeChange={(v) => setVolume(v)}
          onMuteChange={(m) => setMuted(m)}
          onUnsupportedUrl={(u) => {
            setPlayer(null);
            // eslint-disable-next-line no-console
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
      <div className="progress-panel">
        <p>Progress: {progress != null ? formatTime(progress) : "—"}</p>
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
