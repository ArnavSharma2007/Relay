import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  MonitorUp,
  Circle,
  PhoneOff,
  AlertTriangle,
} from 'lucide-react';
import { useCallStore } from '@/store/callStore';

interface ControlBarProps {
  onToggleMute: () => void;
  onToggleCamera: () => void;
  onToggleScreenShare: () => void;
  onToggleRecording: () => void;
  onLeave: () => void;
  onRaiseIssue?: () => void;
  isAgent?: boolean;
  isMonitor?: boolean;
}

export function ControlBar({
  onToggleMute,
  onToggleCamera,
  onToggleScreenShare,
  onToggleRecording,
  onLeave,
  onRaiseIssue,
  isAgent = true,
  isMonitor = false,
}: ControlBarProps) {
  const isMuted       = useCallStore((s) => s.isMuted);
  const isCameraOff   = useCallStore((s) => s.isCameraOff);
  const isScreenSharing = useCallStore((s) => s.isScreenSharing);
  const isRecording   = useCallStore((s) => s.isRecording);

  const controls: {
    icon: typeof Mic;
    label: string;
    onClick: () => void;
    active?: boolean;
    highlight?: boolean;
  }[] = isMonitor ? [] : [
    {
      icon:   isMuted ? MicOff : Mic,
      label:  isMuted ? 'Unmute' : 'Mute',
      onClick: onToggleMute,
      active: isMuted,
    },
    {
      icon:   isCameraOff ? VideoOff : Video,
      label:  isCameraOff ? 'Start Cam' : 'Camera',
      onClick: onToggleCamera,
      active: isCameraOff,
    },
    {
      icon:      MonitorUp,
      label:     'Share',
      onClick:   onToggleScreenShare,
      active:    isScreenSharing,
      highlight: isScreenSharing,
    },
  ];

  if (isAgent) {
    controls.push({
      icon:      Circle,
      label:     isRecording ? 'Recording' : 'Record',
      onClick:   onToggleRecording,
      active:    isRecording,
      highlight: isRecording,
    });
  }

  return (
    <div
      className="absolute bottom-0 left-0 right-0 h-[72px] flex items-center justify-center gap-1.5 px-6"
      style={{
        background: 'rgba(5, 6, 10, 0.88)',
        backdropFilter: 'blur(16px)',
        borderTop: '1px solid rgba(124,92,252,0.12)',
      }}
    >
      {controls.map((ctrl) => (
        <button
          key={ctrl.label}
          onClick={ctrl.onClick}
          className="flex flex-col items-center justify-center gap-0.5 rounded-xl transition-all"
          style={{
            width: '52px',
            height: '44px',
            background: ctrl.highlight
              ? 'rgba(124,92,252,0.22)'
              : ctrl.active
                ? 'rgba(244,63,94,0.15)'
                : 'rgba(255,255,255,0.04)',
            border: ctrl.highlight
              ? '1px solid rgba(124,92,252,0.45)'
              : ctrl.active
                ? '1px solid rgba(244,63,94,0.35)'
                : '1px solid rgba(255,255,255,0.07)',
            color: ctrl.highlight
              ? '#9d80ff'
              : ctrl.active
                ? 'var(--danger)'
                : 'var(--muted)',
          }}
          onMouseEnter={(e) => {
            if (!ctrl.active && !ctrl.highlight) {
              (e.currentTarget as HTMLElement).style.background = 'rgba(124,92,252,0.12)';
              (e.currentTarget as HTMLElement).style.color = 'white';
            }
          }}
          onMouseLeave={(e) => {
            if (!ctrl.active && !ctrl.highlight) {
              (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.04)';
              (e.currentTarget as HTMLElement).style.color = 'var(--muted)';
            }
          }}
        >
          <ctrl.icon
            size={17}
            style={
              ctrl.label === 'Recording' && isRecording
                ? { fill: 'var(--danger)', color: 'var(--danger)' }
                : {}
            }
          />
          <span style={{ fontSize: '9px', letterSpacing: '0.03em' }}>{ctrl.label}</span>
        </button>
      ))}

      {/* Divider */}
      <div
        className="mx-2"
        style={{ width: '1px', height: '28px', background: 'rgba(124,92,252,0.2)' }}
      />

      {/* Leave button */}
      <button
        onClick={onLeave}
        className="flex flex-col items-center justify-center gap-0.5 rounded-xl transition-all"
        style={{
          width: '52px',
          height: '44px',
          background: 'rgba(244,63,94,0.18)',
          border: '1px solid rgba(244,63,94,0.4)',
          color: 'var(--danger)',
          boxShadow: '0 0 14px rgba(244,63,94,0.18)',
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLElement).style.background = 'rgba(244,63,94,0.32)';
          (e.currentTarget as HTMLElement).style.boxShadow = '0 0 20px rgba(244,63,94,0.3)';
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLElement).style.background = 'rgba(244,63,94,0.18)';
          (e.currentTarget as HTMLElement).style.boxShadow = '0 0 14px rgba(244,63,94,0.18)';
        }}
      >
        <PhoneOff size={17} />
        <span style={{ fontSize: '9px', letterSpacing: '0.03em' }}>Leave</span>
      </button>

      {/* Raise Issue button */}
      {isAgent && onRaiseIssue && (
        <button
          onClick={onRaiseIssue}
          className="flex flex-col items-center justify-center gap-0.5 rounded-xl transition-all ml-1"
          style={{
            width: '52px',
            height: '44px',
            background: 'rgba(251,191,36,0.12)',
            border: '1px solid rgba(251,191,36,0.3)',
            color: 'var(--warning)',
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.background = 'rgba(251,191,36,0.22)';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.background = 'rgba(251,191,36,0.12)';
          }}
        >
          <AlertTriangle size={17} />
          <span style={{ fontSize: '9px', letterSpacing: '0.03em' }}>Issue</span>
        </button>
      )}
    </div>
  );
}
