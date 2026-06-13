import { useState } from 'react';
import { PageWrapper } from '@/components/layout/PageWrapper';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { useAuthStore } from '@/store/authStore';
import { useUIStore } from '@/store/uiStore';

export function Settings() {
  const addToast = useUIStore((s) => s.addToast);

  const [sessionAlerts, setSessionAlerts] = useState(() => localStorage.getItem('settings_session_alerts') !== 'false');
  const [recordingNotifications, setRecordingNotifications] = useState(() => localStorage.getItem('settings_recording_notifications') !== 'false');
  const [systemWarnings, setSystemWarnings] = useState(() => localStorage.getItem('settings_system_warnings') === 'true');
  const [videoQuality, setVideoQuality] = useState(() => localStorage.getItem('settings_video_quality') || 'hd');
  const [autoRecord, setAutoRecord] = useState(() => localStorage.getItem('settings_auto_record') || 'no');

  const handleSave = () => {
    localStorage.setItem('settings_session_alerts', String(sessionAlerts));
    localStorage.setItem('settings_recording_notifications', String(recordingNotifications));
    localStorage.setItem('settings_system_warnings', String(systemWarnings));
    localStorage.setItem('settings_video_quality', videoQuality);
    localStorage.setItem('settings_auto_record', autoRecord);
    addToast('success', 'Settings saved successfully');
  };

  return (
    <PageWrapper title="Settings" description="Configure your RELAY preferences" section="Account">
      <div className="max-w-lg space-y-6">
        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius)] p-6 space-y-4">
          <h2 className="text-lg font-semibold">Notifications</h2>
          <label className="flex items-center gap-3 text-sm">
            <input
              type="checkbox"
              checked={sessionAlerts}
              onChange={(e) => setSessionAlerts(e.target.checked)}
              className="accent-[var(--primary)]"
            />
            Session assignment alerts
          </label>
          <label className="flex items-center gap-3 text-sm">
            <input
              type="checkbox"
              checked={recordingNotifications}
              onChange={(e) => setRecordingNotifications(e.target.checked)}
              className="accent-[var(--primary)]"
            />
            Recording completion notifications
          </label>
          <label className="flex items-center gap-3 text-sm">
            <input
              type="checkbox"
              checked={systemWarnings}
              onChange={(e) => setSystemWarnings(e.target.checked)}
              className="accent-[var(--primary)]"
            />
            System degradation warnings
          </label>
        </div>

        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius)] p-6 space-y-4">
          <h2 className="text-lg font-semibold">Call Defaults</h2>
          <Select
            label="Default video quality"
            options={[
              { value: 'hd', label: 'HD (720p)' },
              { value: 'sd', label: 'SD (480p)' },
              { value: 'auto', label: 'Auto' },
            ]}
            value={videoQuality}
            onChange={(e) => setVideoQuality(e.target.value)}
          />
          <Select
            label="Auto-record sessions"
            options={[
              { value: 'no', label: 'No' },
              { value: 'yes', label: 'Yes' },
              { value: 'high', label: 'High priority only' },
            ]}
            value={autoRecord}
            onChange={(e) => setAutoRecord(e.target.value)}
          />
        </div>

        <Button onClick={handleSave}>Save Changes</Button>
      </div>
    </PageWrapper>
  );
}


export function Profile() {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const addToast = useUIStore((s) => s.addToast);

  return (
    <PageWrapper title="Profile" description="Your agent account" section="Account">
      <div className="max-w-lg">
        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius)] p-6 space-y-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-[var(--panel)] flex items-center justify-center text-xl font-bold">
              {user?.name.split(' ').map((n) => n[0]).join('').slice(0, 2)}
            </div>
            <div>
              <h2 className="text-lg font-semibold">{user?.name}</h2>
              <p className="text-sm text-[var(--muted)]">{user?.email}</p>
              <p className="text-xs text-[var(--subtle)] capitalize mt-1">{user?.role}</p>
            </div>
          </div>

          <Input label="Display name" defaultValue={user?.name} />
          <Input label="Email" type="email" defaultValue={user?.email} disabled />

          <Select
            label="Status"
            options={[
              { value: 'online', label: 'Online' },
              { value: 'away', label: 'Away' },
              { value: 'busy', label: 'Busy' },
            ]}
            defaultValue={user?.status}
          />

          <div className="flex gap-3 pt-2">
            <Button onClick={() => addToast('success', 'Profile updated')}>Update Profile</Button>
            <Button variant="danger" onClick={() => { logout(); addToast('info', 'Signed out'); window.location.href = '/login'; }}>
              Sign Out
            </Button>
          </div>
        </div>
      </div>
    </PageWrapper>
  );
}
