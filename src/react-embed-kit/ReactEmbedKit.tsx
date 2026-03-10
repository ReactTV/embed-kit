import "./embed-elements.js";
import "../elements/youtube/player.js";
import type {
  EmbedPlayerRef,
  IEmbedProgressEvent,
  IErrorData,
  IMuteData,
} from "../elements/_base/player.types.js";

export interface ReactEmbedKitProps {
  url: string;
  width?: number;
  height?: number;
  className?: string;
  style?: React.CSSProperties;
  autoplay?: boolean;
  playing?: boolean;
  pip?: boolean;
  muted?: boolean;
  volume?: number;
  progressInterval?: number;
  controls?: boolean;
  enableCaptions?: boolean;
  showAnnotations?: boolean;
  config?: {
    youtube?: Record<string, number | string | undefined>;
    vimeo?: Record<string, number | string | undefined>;
  };
  playerRef?: React.Ref<EmbedPlayerRef>;
  onUnsupportedUrl?: (url: string) => void;
  onError?: (data: IErrorData) => void;
  onReady?: (player: NonNullable<EmbedPlayerRef>) => void;
  onPlay?: () => void;
  onPause?: () => void;
  onBuffering?: () => void;
  onEnded?: () => void;
  onProgress?: (event: IEmbedProgressEvent) => void;
  onDurationChange?: (duration: number) => void;
  onSeeking?: () => void;
  onSeek?: (currentTime: number) => void;
  onMute?: (data: IMuteData) => void;
  onPlaybackQualityChange?: (quality: string) => void;
  onPlaybackRateChange?: (rate: number) => void;
  onAutoplayBlocked?: () => void;
  onApiChange?: () => void;
}

export function ReactEmbedKit({ muted, url }: ReactEmbedKitProps): React.ReactElement {
  return <youtube-video muted={muted ?? false} src={url} />;
}
