import { Fragment, useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { PageWrapper } from '@/components/layout/PageWrapper';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { ChatPanel } from '@/components/call/ChatPanel';
import { Timeline } from '@/components/call/Timeline';
import { formatDurationLong } from '@/hooks/useSession';
import api, { getAssetUrl } from '@/lib/api';
import type { Session, ChatMessage, TimelineEvent, SessionFile, Participant, Recording } from '@/types';
import { ChevronDown, FileText } from 'lucide-react';

interface SessionDetail {
  session: Session;
  chat: ChatMessage[];
  timeline: TimelineEvent[];
  files: SessionFile[];
  participants: Participant[];
  recording?: Recording | null;
}

export function SessionHistory() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<SessionDetail | null>(null);
  const [activeTab, setActiveTab] = useState('chat');
  const [filters, setFilters] = useState({
    dateFrom: '',
    dateTo: '',
    agentId: '',
    customer: '',
    durationMin: '',
    durationMax: '',
    status: [] as string[],
    recording: 'any',
  });

  const fetchSessions = useCallback(() => {
    const params: Record<string, string> = {};
    if (filters.dateFrom) params.dateFrom = filters.dateFrom;
    if (filters.dateTo) params.dateTo = filters.dateTo;
    if (filters.agentId) params.agentId = filters.agentId;
    if (filters.customer) params.search = filters.customer;
    api.get('/sessions', { params }).then(({ data }) => {
      let filtered = data as Session[];
      if (filters.status.length) {
        filtered = filtered.filter((s: Session) => filters.status.includes(s.status));
      }
      setSessions(filtered);
    });
  }, [filters]);

  useEffect(() => {
    const timer = setTimeout(fetchSessions, 300);
    return () => clearTimeout(timer);
  }, [fetchSessions]);

  const toggleExpand = async (id: string) => {
    if (expandedId === id) {
      setExpandedId(null);
      setDetail(null);
      return;
    }
    setExpandedId(id);
    const { data } = await api.get(`/sessions/${id}`);
    setDetail(data);
    setActiveTab('chat');
  };

  return (
    <PageWrapper title="Session History" description="Review past support sessions" section="Support">
      <div className="flex gap-6">
        <div className="w-56 flex-shrink-0 space-y-4">
          <Input label="From" type="date" value={filters.dateFrom} onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })} />
          <Input label="To" type="date" value={filters.dateTo} onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })} />
          <Input label="Customer" placeholder="Name or email" value={filters.customer} onChange={(e) => setFilters({ ...filters, customer: e.target.value })} />
          <Select
            label="Recording"
            value={filters.recording}
            onChange={(e) => setFilters({ ...filters, recording: e.target.value })}
            options={[
              { value: 'any', label: 'Any' },
              { value: 'yes', label: 'Yes' },
              { value: 'no', label: 'No' },
            ]}
          />
          <div>
            <label className="text-sm font-medium text-[var(--muted)] mb-2 block">Status</label>
            {['live', 'ended', 'reconnecting', 'failed'].map((s) => (
              <label key={s} className="flex items-center gap-2 text-sm text-[var(--muted)] mb-1 capitalize">
                <input
                  type="checkbox"
                  checked={filters.status.includes(s)}
                  onChange={(e) =>
                    setFilters({
                      ...filters,
                      status: e.target.checked ? [...filters.status, s] : filters.status.filter((x) => x !== s),
                    })
                  }
                  className="accent-[var(--primary)]"
                />
                {s}
              </label>
            ))}
          </div>
        </div>

        <div className="flex-1">
          {sessions.length === 0 ? (
            <p className="text-sm text-[var(--muted)] text-center py-16">
              No sessions match your filters. Try adjusting the date range or status.
            </p>
          ) : (
            <div className="border border-[var(--border)] rounded-[var(--radius)] overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="bg-[var(--surface)] border-b border-[var(--border)]">
                    {['Session ID', 'Customer', 'Agent', 'Duration', 'Status', 'Date', 'Recording', ''].map((h) => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-[var(--muted)] uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {sessions.map((session) => (
                    <Fragment key={session.id}>
                      <tr className="border-b border-[var(--border)] hover:bg-[var(--surface)]/50 cursor-pointer" onClick={() => toggleExpand(session.id)}>
                        <td className="px-4 py-3 font-mono text-sm">{session.sessionCode}</td>
                        <td className="px-4 py-3 text-sm">{session.customerName}</td>
                        <td className="px-4 py-3 text-sm">{session.agentName || '—'}</td>
                        <td className="px-4 py-3 text-sm">{formatDurationLong(session.duration)}</td>
                        <td className="px-4 py-3"><Badge variant={session.status === 'ended' ? 'ended' : 'live'}>{session.status}</Badge></td>
                        <td className="px-4 py-3 text-sm text-[var(--muted)]">{new Date(session.createdAt).toLocaleDateString()}</td>
                        <td className="px-4 py-3 text-sm">{session.isRecording ? 'Yes' : '—'}</td>
                        <td className="px-4 py-3"><ChevronDown size={16} className={`text-[var(--muted)] transition-transform ${expandedId === session.id ? 'rotate-180' : ''}`} /></td>
                      </tr>
                      <AnimatePresence>
                        {expandedId === session.id && detail && (
                          <tr key={`${session.id}-detail`}>
                            <td colSpan={8} className="p-0">
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.2 }}
                                className="overflow-hidden bg-[var(--panel)]"
                              >
                                <div className="flex border-b border-[var(--border)]">
                                  {['chat', 'files', 'timeline', 'recording', 'participants'].map((tab) => (
                                    <button
                                      key={tab}
                                      onClick={(e) => { e.stopPropagation(); setActiveTab(tab); }}
                                      className={`px-4 py-2 text-sm capitalize ${activeTab === tab ? 'text-[var(--primary)] border-b-2 border-[var(--primary)]' : 'text-[var(--muted)]'}`}
                                    >
                                      {tab === 'chat' ? 'Chat History' : tab === 'files' ? 'Files Shared' : tab}
                                    </button>
                                  ))}
                                </div>
                                <div className="h-64 overflow-y-auto">
                                  {activeTab === 'chat' && detail && (
                                    <ChatPanel
                                      sessionId={detail.session.id}
                                      messages={detail.chat}
                                      onSend={() => {}}
                                      onTyping={() => {}}
                                      readOnly
                                    />
                                  )}
                                  {activeTab === 'timeline' && <Timeline events={detail.timeline} readOnly />}
                                  {activeTab === 'files' && (
                                    <div className="p-4 space-y-2">
                                      {detail.files.map((f) => (
                                        <div key={f.id} className="flex items-center gap-2 text-sm">
                                          <FileText size={14} className="text-[var(--primary)]" />
                                          <span>{f.name}</span>
                                          <a href={getAssetUrl(f.url)} className="text-[var(--primary)] text-xs hover:underline ml-auto" download>Download</a>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                  {activeTab === 'recording' && (
                                    <div className="p-4 flex justify-center bg-black/20 rounded-xl m-4">
                                      {detail.recording?.url ? (
                                        <video
                                          src={getAssetUrl(detail.recording.url)}
                                          controls
                                          className="w-full max-w-lg rounded-[var(--radius)] bg-black"
                                          style={{ maxHeight: '360px' }}
                                        />
                                      ) : (
                                        <div className="text-sm text-[var(--muted)] py-6">No recording for this session</div>
                                      )}
                                    </div>
                                  )}
                                  {activeTab === 'participants' && (
                                    <div className="p-4 space-y-3">
                                      {detail.participants.map((p) => (
                                        <div key={p.id} className="text-sm">
                                          <span className="font-medium">{p.name}</span>
                                          <span className="text-[var(--muted)] ml-2 capitalize">{p.role}</span>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              </motion.div>
                            </td>
                          </tr>
                        )}
                      </AnimatePresence>
                    </Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </PageWrapper>
  );
}
