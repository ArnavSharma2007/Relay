import { useEffect, useState } from 'react';
import { PageWrapper } from '@/components/layout/PageWrapper';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/shared/Modal';
import { formatDurationLong } from '@/hooks/useSession';
import api, { getAssetUrl } from '@/lib/api';
import type { Recording } from '@/types';
import { Loader2 } from 'lucide-react';

export function Recordings() {
  const [recordings, setRecordings] = useState<Recording[]>([]);
  const [storage, setStorage] = useState({ used: 0, total: 10 });
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string[]>([]);
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [previewRecording, setPreviewRecording] = useState<Recording | null>(null);

  useEffect(() => {
    const params: Record<string, string | string[]> = {};
    if (search) params.search = search;
    if (statusFilter.length) params.status = statusFilter;
    api.get('/recordings', { params }).then(({ data }) => {
      setRecordings(data.recordings || []);
      setStorage(data.storage || { used: 0, total: 10 });
    });
  }, [search, statusFilter]);

  const openPreview = (recording: Recording) => {
    setPreviewRecording(recording);
    setPreviewId(recording.id);
  };

  const statusVariant: Record<Recording['status'], 'recording' | 'processing' | 'ready' | 'failed'> = {
    recording: 'recording',
    processing: 'processing',
    ready: 'ready',
    failed: 'failed',
  };

  return (
    <PageWrapper title="Recordings" description="Browse and manage session recordings" section="Support">
      <div className="flex items-center gap-4 mb-6">
        <Input placeholder="Search recordings..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-64" />
        <div className="flex gap-2">
          {['recording', 'processing', 'ready', 'failed'].map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter((prev) => (prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]))}
              className={`px-3 py-1.5 rounded-[var(--radius-sm)] text-xs font-medium capitalize ${
                statusFilter.includes(s) ? 'bg-[var(--primary-dim)] text-[var(--primary)]' : 'bg-[var(--surface)] text-[var(--muted)] border border-[var(--border)]'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
        <div className="ml-auto flex items-center gap-3">
          <span className="text-sm text-[var(--muted)]">{storage.used} GB / {storage.total} GB used</span>
          <div className="w-24 h-2 bg-[var(--panel)] rounded-full overflow-hidden">
            <div className="h-full bg-[var(--primary)] rounded-full" style={{ width: `${(storage.used / storage.total) * 100}%` }} />
          </div>
        </div>
      </div>

      {recordings.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-sm text-[var(--muted)]">Recordings will appear here after sessions with recording enabled end.</p>
        </div>
      ) : (
        <div className="border border-[var(--border)] rounded-[var(--radius)] overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-[var(--surface)] border-b border-[var(--border)]">
                {['Name', 'Session', 'Duration', 'Size', 'Date', 'Status', 'Actions'].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-[var(--muted)] uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {recordings.map((r) => (
                <tr key={r.id} className="border-b border-[var(--border)] hover:bg-[var(--surface)]/50">
                  <td className="px-4 py-3 text-sm font-medium">{r.name}</td>
                  <td className="px-4 py-3 text-sm font-mono">{r.sessionCode}</td>
                  <td className="px-4 py-3 text-sm">{formatDurationLong(r.duration)}</td>
                  <td className="px-4 py-3 text-sm">{r.size} MB</td>
                  <td className="px-4 py-3 text-sm text-[var(--muted)]">{new Date(r.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</td>
                  <td className="px-4 py-3">
                    <Badge variant={statusVariant[r.status]}>
                      {r.status === 'processing' && <Loader2 size={10} className="spinner mr-1" />}
                      {r.status}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      {r.status === 'ready' && (
                        <>
                          <Button size="sm" variant="ghost">Download</Button>
                          <Button size="sm" variant="ghost" onClick={() => openPreview(r)}>Preview</Button>
                        </>
                      )}
                      {r.status === 'failed' && <Button size="sm" variant="danger">Retry</Button>}
                      {r.status === 'recording' && <Badge variant="live">Live</Badge>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={!!previewId} onClose={() => setPreviewId(null)} title="Recording Preview" width="720px">
        {previewRecording && (
          <video
            controls
            className="w-full rounded-[var(--radius)] bg-black"
            style={{ maxHeight: '400px' }}
          >
            {previewRecording.url && <source src={getAssetUrl(previewRecording.url)} type="video/webm" />}
          </video>
        )}
      </Modal>
    </PageWrapper>
  );
}
