import { useEffect, useState } from 'react';
import { PageWrapper } from '@/components/layout/PageWrapper';
import { SessionsTable } from '@/components/dashboard/SessionRow';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/shared/Modal';
import { useSocket } from '@/hooks/useSocket';
import { useSessionStore } from '@/store/sessionStore';
import { useUIStore } from '@/store/uiStore';
import api from '@/lib/api';
import type { Session, User } from '@/types';
import { Copy, Filter } from 'lucide-react';

export function LiveSessions() {
  const [statusFilter, setStatusFilter] = useState<string[]>([]);
  const [agentFilter, setAgentFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [agents, setAgents] = useState<User[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [createdSession, setCreatedSession] = useState<Session | null>(null);
  const [form, setForm] = useState({ customerName: '', customerEmail: '', agentId: '', priority: 'normal', notes: '' });
  const sessions = useSessionStore((s) => s.sessions);
  const setSessions = useSessionStore((s) => s.setSessions);
  const addToast = useUIStore((s) => s.addToast);
  useSocket();

  useEffect(() => {
    api.get('/sessions/agents/list').then(({ data }) => setAgents(data));
    fetchSessions();
  }, [statusFilter, agentFilter, dateFrom, dateTo]);

  const fetchSessions = () => {
    const params: Record<string, string | string[]> = {};
    if (statusFilter.length) params.status = statusFilter;
    if (agentFilter) params.agentId = agentFilter;
    if (dateFrom) params.dateFrom = dateFrom;
    if (dateTo) params.dateTo = dateTo;
    api.get('/sessions', { params }).then(({ data }) => setSessions(data));
  };

  const handleCreate = async () => {
    const { data } = await api.post('/sessions', form);
    setCreatedSession(data);
    addToast('success', `Session created. Invite code: ${data.inviteCode}`);
    fetchSessions();
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    addToast('info', `${label} copied to clipboard`);
  };

  const filtered = sessions.filter((s) => {
    if (statusFilter.length && !statusFilter.includes(s.status)) return false;
    if (agentFilter && s.agentId !== agentFilter) return false;
    return true;
  });

  return (
    <PageWrapper
      title="Live Sessions"
      description="Monitor and manage active support sessions"
      section="Support"
      actions={
        <Button onClick={() => { setShowCreate(true); setCreatedSession(null); setForm({ customerName: '', customerEmail: '', agentId: '', priority: 'normal', notes: '' }); }}>
          Create Session
        </Button>
      }
    >
      <div className="flex flex-wrap items-end gap-3 mb-5 p-4 card">
        <div className="flex items-center gap-2 text-[var(--muted)] mr-2">
          <Filter size={14} />
          <span className="text-xs font-medium uppercase tracking-wider">Filters</span>
        </div>
        <Input label="From" type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="w-36" />
        <Input label="To" type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="w-36" />
        <Select
          label="Agent"
          value={agentFilter}
          onChange={(e) => setAgentFilter(e.target.value)}
          options={[{ value: '', label: 'All Agents' }, ...agents.map((a) => ({ value: a.id, label: a.name }))]}
          className="w-44"
        />
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-[var(--muted)]">Status</label>
          <div className="flex gap-1.5 flex-wrap">
            {['waiting', 'connecting', 'live', 'reconnecting', 'ended'].map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter((prev) => prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s])}
                className={`px-2.5 py-1 rounded-[var(--radius-sm)] text-[11px] font-medium capitalize transition-colors ${
                  statusFilter.includes(s)
                    ? 'bg-[var(--primary-dim)] text-[var(--primary)]'
                    : 'bg-[var(--panel)] text-[var(--muted)] border border-[var(--border)] hover:text-[var(--text)]'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      </div>

      <SessionsTable sessions={filtered} onCreateSession={() => setShowCreate(true)} />

      <Modal open={showCreate} onClose={() => setShowCreate(false)} title={createdSession ? 'Session Created' : 'Create Session'}>
        {createdSession ? (
          <div className="space-y-4">
            {[
              { label: 'Session ID', value: createdSession.sessionCode },
              { label: 'Invite Code', value: createdSession.inviteCode },
              { label: 'Invite Link', value: createdSession.inviteLink },
            ].map((field) => (
              <div key={field.label}>
                <label className="text-[11px] text-[var(--muted)] uppercase tracking-wider">{field.label}</label>
                <div className="flex items-center gap-2 mt-1">
                  <code className="flex-1 px-3 py-2 bg-[var(--panel)] border border-[var(--border)] rounded-[var(--radius-sm)] font-mono text-[13px] truncate">
                    {field.value}
                  </code>
                  <Button size="sm" variant="ghost" onClick={() => copyToClipboard(field.value, field.label)}>
                    <Copy size={14} />
                  </Button>
                </div>
              </div>
            ))}
            <Button className="w-full" onClick={() => addToast('info', `Invite sent to ${createdSession.customerEmail}`)}>
              Send Invite
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <Input label="Customer name" value={form.customerName} onChange={(e) => setForm({ ...form, customerName: e.target.value })} />
            <Input label="Customer email" type="email" value={form.customerEmail} onChange={(e) => setForm({ ...form, customerEmail: e.target.value })} />
            <Select label="Assign Agent" value={form.agentId} onChange={(e) => setForm({ ...form, agentId: e.target.value })} options={[{ value: '', label: 'Auto-assign' }, ...agents.map((a) => ({ value: a.id, label: a.name }))]} />
            <Select label="Priority" value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })} options={[
              { value: 'low', label: 'Low' }, { value: 'normal', label: 'Normal' },
              { value: 'high', label: 'High' }, { value: 'critical', label: 'Critical' },
            ]} />
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-[var(--muted)]">Notes (optional)</label>
              <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="px-3 py-2 bg-[var(--panel)] border border-[var(--border)] rounded-[var(--radius)] text-[13px] text-[var(--text)] min-h-[80px] focus:outline-none focus:border-[var(--primary)]" />
            </div>
            <Button className="w-full" onClick={handleCreate} disabled={!form.customerName || !form.customerEmail}>
              Create Session
            </Button>
          </div>
        )}
      </Modal>
    </PageWrapper>
  );
}
