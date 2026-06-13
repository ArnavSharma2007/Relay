import { useEffect, useState } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import { PageWrapper } from '@/components/layout/PageWrapper';
import { Badge } from '@/components/ui/Badge';
import api from '@/lib/api';
import { getSocket } from '@/lib/socket';
import type { AdminMetrics, AdminEvent, User } from '@/types';
import { connectSocket } from '@/lib/socket';

export function Admin() {
  const [metrics, setMetrics] = useState<AdminMetrics | null>(null);
  const [history, setHistory] = useState<{ time: string; sessions: number; networkIn: number; networkOut: number }[]>([]);
  const [agents, setAgents] = useState<User[]>([]);
  const [events, setEvents] = useState<AdminEvent[]>([]);
  const [failedSessions, setFailedSessions] = useState<{ sessionCode: string; customerName: string }[]>([]);

  useEffect(() => {
    connectSocket();
    api.get('/admin/metrics').then(({ data }) => {
      setMetrics(data.metrics);
      setHistory(data.history);
      setAgents(data.agents);
      setEvents(data.events);
      setFailedSessions(data.failedSessions);
    });

    const socket = getSocket();
    socket.on('admin:metrics', (m: AdminMetrics) => setMetrics(m));
    socket.on('admin:agents', (a: User[]) => setAgents(a));
    socket.on('admin:events', (e: AdminEvent[]) => setEvents(e));

    return () => {
      socket.off('admin:metrics');
      socket.off('admin:agents');
      socket.off('admin:events');
    };
  }, []);

  const chartData = history.map((h) => ({
    time: new Date(h.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    sessions: h.sessions,
    networkIn: Math.round(h.networkIn * 10) / 10,
    networkOut: Math.round(h.networkOut * 10) / 10,
  }));

  const tooltipStyle = {
    backgroundColor: 'var(--panel)',
    border: '1px solid var(--border-mid)',
    borderRadius: 'var(--radius-sm)',
    fontSize: 12,
  };

  const statCards = metrics
    ? [
        { label: 'Active Sessions', value: metrics.activeSessions, trend: metrics.activeSessionsTrend },
        { label: 'CPU %', value: `${metrics.cpu}%`, trend: metrics.cpuTrend },
        { label: 'Memory %', value: `${metrics.memory}%`, trend: metrics.memoryTrend },
        { label: 'Network Throughput', value: `${metrics.networkIn} MB/s`, trend: metrics.networkTrend },
        { label: 'Error Rate (5m)', value: `${metrics.errorRate}%`, trend: metrics.errorRateTrend },
      ]
    : [];

  const severityColors = {
    info: 'text-[var(--primary)]',
    warning: 'text-[var(--warning)]',
    error: 'text-[var(--danger)]',
  };

  return (
    <PageWrapper title="Admin Command Center" description="System health and operational monitoring" section="Insights">
      <div className="grid grid-cols-5 gap-4 mb-6">
        {statCards.map((card) => (
          <div key={card.label} className="bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius)] p-4">
            <p className="text-xl font-bold">{card.value}</p>
            <div className="flex items-center justify-between mt-1">
              <p className="text-xs text-[var(--muted)]">{card.label}</p>
              <span className={`text-xs ${card.trend >= 0 ? 'text-[var(--success)]' : 'text-[var(--danger)]'}`}>
                {card.trend >= 0 ? '+' : ''}{card.trend}%
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-6 mb-6">
        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius)] p-5">
          <h3 className="text-sm font-semibold mb-4">Active Sessions (60 min)</h3>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="time" tick={{ fill: 'var(--muted)', fontSize: 10 }} interval="preserveStartEnd" />
              <YAxis tick={{ fill: 'var(--muted)', fontSize: 11 }} />
              <Tooltip contentStyle={tooltipStyle} />
              <Line type="monotone" dataKey="sessions" stroke="var(--primary)" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius)] p-5">
          <h3 className="text-sm font-semibold mb-4">Network Throughput</h3>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="time" tick={{ fill: 'var(--muted)', fontSize: 10 }} interval="preserveStartEnd" />
              <YAxis tick={{ fill: 'var(--muted)', fontSize: 11 }} />
              <Tooltip contentStyle={tooltipStyle} />
              <Line type="monotone" dataKey="networkIn" stroke="var(--primary)" strokeWidth={2} dot={false} name="In" />
              <Line type="monotone" dataKey="networkOut" stroke="var(--success)" strokeWidth={2} dot={false} name="Out" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius)] p-5">
          <h3 className="text-sm font-semibold mb-4">Agent Status</h3>
          <div className="space-y-3">
            {agents.map((agent) => (
              <div key={agent.id} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-[var(--panel)] flex items-center justify-center text-[10px] font-semibold">
                    {agent.name.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                  </div>
                  <span className="text-sm">{agent.name}</span>
                </div>
                <Badge variant={agent.status === 'online' ? 'live' : agent.status === 'away' ? 'waiting' : 'offline'}>
                  {agent.status}
                </Badge>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius)] p-5">
          <h3 className="text-sm font-semibold mb-4">Live Event Log</h3>
          <div className="max-h-64 overflow-y-auto space-y-2">
            {events.length === 0 ? (
              <p className="text-sm text-[var(--muted)]">No events in the last 5 minutes. System is quiet.</p>
            ) : (
              events.map((event) => (
                <div key={event.id} className="text-sm border-b border-[var(--border)] pb-2 last:border-0">
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-medium uppercase ${severityColors[event.severity]}`}>{event.severity}</span>
                    <span className="text-xs text-[var(--muted)] font-mono">
                      {new Date(event.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  <p className="mt-0.5">{event.message}</p>
                  <p className="text-xs text-[var(--subtle)]">{event.source}</p>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius)] p-5">
          <h3 className="text-sm font-semibold mb-4">Failed Calls & Reconnects</h3>
          <p className="text-2xl font-bold mb-4">{failedSessions.length}</p>
          <div className="space-y-2">
            {failedSessions.map((s, i) => (
              <div key={i} className="flex items-center justify-between text-sm">
                <span className="font-mono">{s.sessionCode}</span>
                <span className="text-[var(--muted)]">{s.customerName}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </PageWrapper>
  );
}
