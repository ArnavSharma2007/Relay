import { motion } from 'motion/react';
import type { TimelineEvent, TimelineEventType } from '@/types';

interface TimelineProps {
  events: TimelineEvent[];
  readOnly?: boolean;
}

const dotColors: Record<TimelineEventType, string> = {
  join: 'bg-[var(--success)]',
  leave: 'bg-[var(--muted)]',
  recording_start: 'bg-[var(--danger)]',
  recording_stop: 'bg-[var(--danger)]',
  file_upload: 'bg-[var(--primary)]',
  network_drop: 'bg-[var(--danger)]',
  reconnect: 'bg-[var(--warning)]',
  error: 'bg-[var(--danger)]',
  end: 'bg-[var(--muted)]',
  system: 'bg-[var(--warning)]',
};

export function Timeline({ events, readOnly: _readOnly }: TimelineProps) {
  if (events.length === 0) {
    return (
      <p className="text-[13px] text-[var(--muted)] text-center py-10 px-4">
        Session events will appear here as they occur.
      </p>
    );
  }

  return (
    <div className="px-4 py-3 overflow-y-auto h-full">
      {events.map((event, i) => (
        <motion.div
          key={event.id}
          initial={{ opacity: 0, x: -8 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.18, delay: i * 0.03 }}
          className="flex gap-3 relative pb-4"
        >
          {i < events.length - 1 && (
            <div className="absolute left-[5px] top-3 bottom-0 w-px bg-[var(--border)]" />
          )}
          <div className="flex flex-col items-center flex-shrink-0 pt-1 z-[1]">
            <div
              className={`w-2.5 h-2.5 rounded-full ${dotColors[event.type]} ${
                event.type === 'recording_start' ? 'pulse-dot' : ''
              }`}
            />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-baseline gap-2">
              <span className="text-[11px] text-[var(--muted)] font-mono w-10 flex-shrink-0 tabular-nums">
                {new Date(event.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
              <span className="text-[13px] text-[var(--text)]">{event.description}</span>
            </div>
            <div className="flex items-center gap-2 mt-1 ml-12">
              <span className="px-2 py-0.5 rounded-full bg-[var(--panel)] text-[11px] text-[var(--muted)]">
                {event.actor}
              </span>
              {event.metadata?.filename && (
                <button className="text-[11px] text-[var(--primary)] hover:underline">
                  {event.metadata.filename}
                </button>
              )}
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
