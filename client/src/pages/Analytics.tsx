import { useEffect, useState } from 'react';
import { PageWrapper } from '@/components/layout/PageWrapper';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from 'recharts';
import api from '@/lib/api';
import type { AnalyticsData } from '@/types';
import { formatDurationLong } from '@/hooks/useSession';

const COLORS = ['var(--success)', 'var(--warning)', 'var(--danger)'];

export function Analytics() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [dateRange, setDateRange] = useState('7d');

  useEffect(() => {
    api.get('/sessions/analytics').then(({ data: d }) => setData(d));
  }, [dateRange]);

  if (!data) return null;

  const metrics = [
    { label: 'Avg Resolution Time', value: formatDurationLong(data.avgResolutionTime) },
    { label: 'Call Success Rate', value: `${data.callSuccessRate}%` },
    { label: 'Recording Usage', value: `${data.recordingUsage}%` },
    { label: 'Peak Hour', value: data.peakHour },
    { label: 'Sessions Today', value: data.sessionsToday },
  ];

  const chartTooltipStyle = {
    backgroundColor: 'var(--panel)',
    border: '1px solid var(--border-mid)',
    borderRadius: 'var(--radius-sm)',
    fontSize: 12,
  };

  return (
    <PageWrapper title="Analytics" description="Session metrics and team performance" section="Insights">
      <div className="flex gap-2 mb-6">
        {[
          { value: 'today', label: 'Today' },
          { value: '7d', label: 'Last 7 days' },
          { value: '30d', label: 'Last 30 days' },
          { value: 'custom', label: 'Custom' },
        ].map((r) => (
          <button
            key={r.value}
            onClick={() => setDateRange(r.value)}
            className={`px-3 py-1.5 rounded-[var(--radius-sm)] text-sm ${
              dateRange === r.value ? 'bg-[var(--primary-dim)] text-[var(--primary)]' : 'text-[var(--muted)] border border-[var(--border)]'
            }`}
          >
            {r.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-5 gap-4 mb-8">
        {metrics.map((m) => (
          <div key={m.label} className="bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius)] p-5">
            <p className="text-2xl font-bold">{m.value}</p>
            <p className="text-xs text-[var(--muted)] mt-1">{m.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="space-y-6">
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius)] p-5">
            <h3 className="text-sm font-semibold mb-4">Sessions per Day</h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={data.sessionsPerDay}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="date" tick={{ fill: 'var(--muted)', fontSize: 11 }} />
                <YAxis tick={{ fill: 'var(--muted)', fontSize: 11 }} />
                <Tooltip contentStyle={chartTooltipStyle} />
                <Bar dataKey="count" fill="var(--primary)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius)] p-5">
            <h3 className="text-sm font-semibold mb-4">Volume by Hour</h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={data.volumeByHour}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="hour" tick={{ fill: 'var(--muted)', fontSize: 11 }} />
                <YAxis tick={{ fill: 'var(--muted)', fontSize: 11 }} />
                <Tooltip contentStyle={chartTooltipStyle} />
                <Bar dataKey="count" fill="var(--primary)" opacity={0.7} radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius)] p-5">
            <h3 className="text-sm font-semibold mb-4">Call Outcomes</h3>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={data.successBreakdown} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={80}>
                  {data.successBreakdown.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={chartTooltipStyle} />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex justify-center gap-4 mt-2">
              {data.successBreakdown.map((item, i) => (
                <div key={item.name} className="flex items-center gap-1.5 text-xs text-[var(--muted)]">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[i] }} />
                  {item.name}
                </div>
              ))}
            </div>
          </div>

          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius)] p-5">
            <h3 className="text-sm font-semibold mb-4">Most Active Agents</h3>
            <div className="space-y-3">
              {data.topAgents.map((agent, i) => (
                <div key={agent.name} className="flex items-center gap-3">
                  <span className="text-sm w-32 truncate">{agent.name}</span>
                  <div className="flex-1 h-2 bg-[var(--panel)] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[var(--primary)] rounded-full"
                      style={{ width: `${(agent.sessions / data.topAgents[0].sessions) * 100}%`, opacity: 1 - i * 0.15 }}
                    />
                  </div>
                  <span className="text-xs text-[var(--muted)] w-8 text-right">{agent.sessions}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </PageWrapper>
  );
}
