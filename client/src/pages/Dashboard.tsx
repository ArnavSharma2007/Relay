import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { Phone, Users, Monitor, Calendar, Clock, HardDrive, ArrowRight } from 'lucide-react';
import { PageWrapper } from '@/components/layout/PageWrapper';
import { MetricCard } from '@/components/dashboard/MetricCard';
import { SessionsTable } from '@/components/dashboard/SessionRow';
import { useSocket } from '@/hooks/useSocket';
import api from '@/lib/api';
import type { DashboardMetrics, ActivityEvent, Session } from '@/types';
import { connectSocket } from '@/lib/socket';

const metricConfig = [
  { key: 'activeCalls' as const, label: 'Active Calls', icon: Phone, color: 'var(--primary)' },
  { key: 'agentsOnline' as const, label: 'Agents Online', icon: Users, color: 'var(--success)' },
  { key: 'customersConnected' as const, label: 'Customers Connected', icon: Monitor, color: 'var(--warning)' },
  { key: 'todaysSessions' as const, label: "Today's Sessions", icon: Calendar, color: 'var(--muted)' },
  { key: 'avgCallDuration' as const, label: 'Avg Call Duration', icon: Clock, color: 'var(--muted)', format: 'duration' as const },
  { key: 'recordingStorage' as const, label: 'Recording Storage', icon: HardDrive, color: 'var(--muted)', format: 'storage' as const },
];

export function Dashboard() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [activities, setActivities] = useState<ActivityEvent[]>([]);
  const [liveSessions, setLiveSessions] = useState<Session[]>([]);
  useSocket();

  useEffect(() => {
    connectSocket();
    api.get('/sessions/dashboard').then(({ data }) => {
      setMetrics(data.metrics);
      setActivities(data.activities);
      setLiveSessions(data.liveSessions);
    });
  }, []);

  const activityColors: Record<ActivityEvent['type'], string> = {
    session: 'bg-[var(--primary)]',
    recording: 'bg-[var(--danger)]',
    agent: 'bg-[var(--success)]',
    system: 'bg-[var(--muted)]',
    error: 'bg-[var(--danger)]',
  };

  return (
    <PageWrapper
      title="Dashboard"
      description="Real-time overview of support operations"
      section="Support"
    >
      {metrics && (
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3 mb-8">
          {metricConfig.map((m, i) => (
            <MetricCard
              key={m.key}
              label={m.label}
              value={metrics[m.key] as number}
              trend={metrics.trends[m.key]}
              sparkData={metrics.sparklines[m.key]}
              color={m.color}
              icon={m.icon}
              format={m.format}
              index={i}
            />
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <h2 className="text-base font-semibold">Active Sessions</h2>
              <span className="px-2 py-0.5 rounded-full bg-[var(--primary-dim)] text-[var(--primary)] text-[11px] font-semibold tabular-nums">
                {liveSessions.length}
              </span>
            </div>
            <Link
              to="/live-sessions"
              className="flex items-center gap-1 text-[13px] text-[var(--primary)] hover:underline"
            >
              View All
              <ArrowRight size={13} />
            </Link>
          </div>
          <SessionsTable sessions={liveSessions} compact />
        </div>

        <div>
          <h2 className="text-base font-semibold mb-4">Recent Activity</h2>
          <div className="card max-h-[320px] overflow-y-auto">
            {activities.map((activity, i) => (
              <motion.div
                key={activity.id}
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.18, delay: i * 0.03 }}
                className="flex items-start gap-3 px-4 py-3 border-b border-[var(--border)] last:border-0"
              >
                <div className={`w-1.5 h-1.5 rounded-full mt-2 flex-shrink-0 ${activityColors[activity.type]}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] leading-snug">{activity.text}</p>
                  <div className="flex items-center gap-2 mt-1.5">
                    <span className="text-[11px] text-[var(--muted)] font-mono tabular-nums">
                      {new Date(activity.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <span className="text-[11px] px-1.5 py-0.5 rounded bg-[var(--panel)] text-[var(--muted)]">
                      {activity.actor}
                    </span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </PageWrapper>
  );
}
