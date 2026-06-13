import { useRef, useEffect } from 'react';
import { Pin, Signal } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { formatDuration } from '@/hooks/useSession';

interface VideoTileProps {
  stream?: MediaStream | null;
  name: string;
  isSelf?: boolean;
  isPrimary?: boolean;
  isRecording?: boolean;
  networkQuality?: 'hd' | 'sd' | 'degraded';
  duration?: number;
  onPin?: () => void;
  onClick?: () => void;
  className?: string;
}

const qualityLabels = { hd: 'HD', sd: 'SD', degraded: 'Degraded' };
const qualityColors = {
  hd: 'text-[var(--success)]',
  sd: 'text-[var(--warning)]',
  degraded: 'text-[var(--danger)]',
};

export function VideoTile({
  stream,
  name,
  isSelf,
  isPrimary,
  isRecording,
  networkQuality = 'hd',
  duration = 0,
  onPin,
  onClick,
  className = '',
}: VideoTileProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hasVideo = stream?.getVideoTracks().some((t) => t.enabled);
  console.log(`[VideoTile] Render: name=${name}, isSelf=${isSelf}, streamId=${stream?.id || 'none'}, hasVideo=${hasVideo}, videoTracksCount=${stream?.getVideoTracks().length || 0}`);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
      videoRef.current.play().catch((e) => console.error('Video play error:', e));
    }
  }, [stream]);

  const initials = name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <div
      className={`relative bg-black rounded-[var(--radius)] border border-[var(--border-mid)] overflow-hidden group ${onClick ? 'cursor-pointer' : ''} ${className}`}
      onClick={onClick}
    >
      {hasVideo ? (
        <video ref={videoRef} autoPlay playsInline muted={isSelf} className="w-full h-full object-cover" />
      ) : (
        <div className="w-full h-full flex flex-col items-center justify-center bg-[var(--panel)]">
          <div className="w-16 h-16 rounded-full bg-[var(--surface)] flex items-center justify-center text-xl font-semibold text-[var(--muted)]">
            {initials}
          </div>
          <span className="text-sm text-[var(--muted)] mt-2">Camera off</span>
        </div>
      )}

      {isRecording && (
        <div className="absolute top-3 left-3">
          <Badge variant="recording">REC</Badge>
        </div>
      )}

      {isPrimary && onPin && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onPin();
          }}
          className="absolute top-3 left-3 w-8 h-8 rounded-[var(--radius-sm)] bg-black/50 text-white opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
        >
          <Pin size={14} />
        </button>
      )}

      {isPrimary && (
        <div className="absolute top-3 right-3 flex items-center gap-2">
          <span className="px-2 py-1 rounded-[var(--radius-sm)] bg-black/60 text-xs font-mono">
            {formatDuration(duration)}
          </span>
          <span className={`flex items-center gap-1 px-2 py-1 rounded-[var(--radius-sm)] bg-black/60 text-xs ${qualityColors[networkQuality]}`}>
            <Signal size={12} />
            {qualityLabels[networkQuality]}
          </span>
        </div>
      )}

      <div className="absolute bottom-3 left-3">
        <span className="px-2 py-1 rounded-[var(--radius-sm)] bg-black/60 text-xs font-medium">
          {isSelf ? 'You' : name}
        </span>
      </div>
    </div>
  );
}
