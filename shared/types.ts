export type UserRole = 'agent' | 'admin' | 'customer';

export type AgentStatus = 'online' | 'away' | 'busy' | 'offline';

export type SessionStatus =
  | 'waiting'
  | 'connecting'
  | 'live'
  | 'reconnecting'
  | 'ended'
  | 'failed';

export type SessionPriority = 'low' | 'normal' | 'high' | 'critical';

export type RecordingStatus = 'recording' | 'processing' | 'ready' | 'failed';

export type ConnectionQuality = 'hd' | 'sd' | 'degraded';

export type MessageStatus = 'sent' | 'delivered' | 'seen';

export type TimelineEventType =
  | 'join'
  | 'leave'
  | 'recording_start'
  | 'recording_stop'
  | 'file_upload'
  | 'network_drop'
  | 'reconnect'
  | 'error'
  | 'end'
  | 'system';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  avatar?: string;
  status: AgentStatus;
  password?: string;
}

export interface Session {
  id: string;
  sessionCode: string;
  inviteCode: string;
  inviteLink: string;
  customerName: string;
  customerEmail: string;
  agentId: string | null;
  agentName: string | null;
  status: SessionStatus;
  priority: SessionPriority;
  notes?: string;
  startedAt: string | null;
  endedAt: string | null;
  duration: number;
  isRecording: boolean;
  quality: ConnectionQuality;
  createdAt: string;
  updatedAt: string;
}

export interface ChatMessage {
  id: string;
  sessionId: string;
  userId: string;
  userName: string;
  role: UserRole;
  content: string;
  type: 'text' | 'file' | 'system';
  fileId?: string;
  status: MessageStatus;
  createdAt: string;
}

export interface TimelineEvent {
  id: string;
  sessionId: string;
  type: TimelineEventType;
  description: string;
  actor: string;
  actorId?: string;
  metadata?: Record<string, string>;
  createdAt: string;
}

export interface SessionFile {
  id: string;
  sessionId: string;
  name: string;
  size: number;
  mimeType: string;
  uploadedBy: string;
  uploadedByName: string;
  url: string;
  createdAt: string;
}

export interface Recording {
  id: string;
  sessionId: string;
  sessionCode: string;
  name: string;
  customerName: string;
  agentName: string;
  duration: number;
  size: number;
  status: RecordingStatus;
  url?: string;
  createdAt: string;
}

export interface Participant {
  id: string;
  sessionId: string;
  userId: string;
  name: string;
  email?: string;
  role: UserRole;
  joinedAt: string;
  leftAt?: string;
  inviteCode?: string;
  quality: ConnectionQuality;
}

export interface ActivityEvent {
  id: string;
  timestamp: string;
  text: string;
  actor: string;
  type: 'session' | 'recording' | 'agent' | 'system' | 'error';
}

export interface AdminMetrics {
  activeSessions: number;
  cpu: number;
  memory: number;
  networkIn: number;
  networkOut: number;
  errorRate: number;
  activeSessionsTrend: number;
  cpuTrend: number;
  memoryTrend: number;
  networkTrend: number;
  errorRateTrend: number;
}

export interface AdminEvent {
  id: string;
  timestamp: string;
  severity: 'info' | 'warning' | 'error';
  message: string;
  source: string;
}

export interface DashboardMetrics {
  activeCalls: number;
  agentsOnline: number;
  customersConnected: number;
  todaysSessions: number;
  avgCallDuration: number;
  recordingStorage: number;
  trends: {
    activeCalls: number;
    agentsOnline: number;
    customersConnected: number;
    todaysSessions: number;
    avgCallDuration: number;
    recordingStorage: number;
  };
  sparklines: {
    activeCalls: number[];
    agentsOnline: number[];
    customersConnected: number[];
    todaysSessions: number[];
    avgCallDuration: number[];
    recordingStorage: number[];
  };
}

export interface AnalyticsData {
  avgResolutionTime: number;
  callSuccessRate: number;
  recordingUsage: number;
  peakHour: string;
  sessionsToday: number;
  sessionsPerDay: { date: string; count: number }[];
  volumeByHour: { hour: number; count: number }[];
  successBreakdown: { name: string; value: number }[];
  topAgents: { name: string; sessions: number }[];
}

export interface AuthResponse {
  token: string;
  user: Omit<User, 'password'>;
}

export interface JoinSessionResponse {
  token: string;
  session: Session;
  user: Omit<User, 'password'>;
}
