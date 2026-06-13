/**
 * RELAY Mock API — full offline demo mode
 * Intercepts all axios requests and returns realistic data when the
 * real backend is unreachable (no DATABASE_URL / server not running).
 *
 * Credentials: priya.sharma@relay.io / agent123
 *              admin@relay.io        / admin123
 */

import type { AxiosInstance } from 'axios';

// ── Demo users ─────────────────────────────────────────────────────────────
const USERS: Record<string, { password: string; user: DemoUser }> = {
  'priya.sharma@relay.io': {
    password: 'agent123',
    user: {
      id: 'u1',
      email: 'priya.sharma@relay.io',
      name: 'Priya Sharma',
      role: 'agent',
      status: 'online',
      createdAt: new Date().toISOString(),
    },
  },
  'marcus.chen@relay.io': {
    password: 'agent123',
    user: {
      id: 'u2',
      email: 'marcus.chen@relay.io',
      name: 'Marcus Chen',
      role: 'agent',
      status: 'online',
      createdAt: new Date().toISOString(),
    },
  },
  'admin@relay.io': {
    password: 'admin123',
    user: {
      id: 'u5',
      email: 'admin@relay.io',
      name: 'Alex Rivera',
      role: 'admin',
      status: 'online',
      createdAt: new Date().toISOString(),
    },
  },
};

interface DemoUser {
  id: string;
  email: string;
  name: string;
  role: string;
  status: string;
  createdAt: string;
}

// ── Minimal JWT-shaped token ──────────────────────────────────────────────
function mockToken(userId: string) {
  const header  = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const payload = btoa(JSON.stringify({ sub: userId, iat: Date.now() }));
  return `${header}.${payload}.mock-sig`;
}

// ── Shared mock data ────────────────────────────────────────────────────────
const now = Date.now();

const SESSIONS = [
  {
    id: 's1', sessionCode: 'RLY-4A9F-2B7X', inviteCode: 'RELAY-4A9F-2B7X',
    inviteLink: 'http://localhost:5173/login?code=RELAY-4A9F-2B7X',
    customerName: 'John Davis', customerEmail: 'john@acme.com',
    agentId: 'u1', agentName: 'Priya Sharma',
    status: 'live', priority: 'high', startedAt: new Date(now - 600000).toISOString(),
    endedAt: null, duration: 0, isRecording: true, quality: 'hd',
    createdAt: new Date(now - 700000).toISOString(),
  },
  {
    id: 's2', sessionCode: 'RLY-7C3K-9M1P', inviteCode: 'RELAY-7C3K-9M1P',
    inviteLink: 'http://localhost:5173/login?code=RELAY-7C3K-9M1P',
    customerName: 'Alice Chen', customerEmail: 'alice@techflow.io',
    agentId: 'u2', agentName: 'Marcus Chen',
    status: 'waiting', priority: 'normal', startedAt: null,
    endedAt: null, duration: 0, isRecording: false, quality: 'hd',
    createdAt: new Date(now - 300000).toISOString(),
  },
  {
    id: 's3', sessionCode: 'RLY-5R8T-4W2Q', inviteCode: 'RELAY-5R8T-4W2Q',
    inviteLink: 'http://localhost:5173/login?code=RELAY-5R8T-4W2Q',
    customerName: 'Mike Ross', customerEmail: 'mike@datastack.com',
    agentId: 'u1', agentName: 'Priya Sharma',
    status: 'ended', priority: 'low', startedAt: new Date(now - 3600000).toISOString(),
    endedAt: new Date(now - 1800000).toISOString(), duration: 1800, isRecording: false, quality: 'sd',
    createdAt: new Date(now - 3700000).toISOString(),
  },
  {
    id: 's4', sessionCode: 'RLY-2X6N-8L5Y', inviteCode: 'RELAY-2X6N-8L5Y',
    inviteLink: 'http://localhost:5173/login?code=RELAY-2X6N-8L5Y',
    customerName: 'Sarah Mitchell', customerEmail: 'sarah@cloudnine.dev',
    agentId: 'u1', agentName: 'Priya Sharma',
    status: 'ended', priority: 'normal', startedAt: new Date(now - 7200000).toISOString(),
    endedAt: new Date(now - 5400000).toISOString(), duration: 1800, isRecording: true, quality: 'hd',
    createdAt: new Date(now - 7300000).toISOString(),
  },
];

const METRICS = {
  activeCalls: 2,
  agentsOnline: 3,
  customersConnected: 4,
  todaysSessions: 8,
  avgCallDuration: 1245,
  recordingStorage: 2.4 * 1024 * 1024 * 1024,
  trends: {
    activeCalls: 12, agentsOnline: 0, customersConnected: -5,
    todaysSessions: 23, avgCallDuration: -8, recordingStorage: 15,
  },
  sparklines: {
    activeCalls:        [1,2,1,3,2,4,2],
    agentsOnline:       [3,3,4,3,3,3,3],
    customersConnected: [5,4,6,4,5,4,4],
    todaysSessions:     [3,4,5,6,7,7,8],
    avgCallDuration:    [1300,1250,1200,1280,1245,1260,1245],
    recordingStorage:   [2.0,2.1,2.2,2.2,2.3,2.3,2.4],
  },
};

const ACTIVITIES = [
  { id: 'a1', text: 'Session RLY-4A9F went live', actor: 'Priya Sharma',  type: 'session',   timestamp: new Date(now - 600000).toISOString() },
  { id: 'a2', text: 'Marcus Chen came online',    actor: 'System',        type: 'agent',     timestamp: new Date(now - 1200000).toISOString() },
  { id: 'a3', text: 'Recording started on RLY-4A9F', actor: 'Priya Sharma', type: 'recording', timestamp: new Date(now - 580000).toISOString() },
  { id: 'a4', text: 'Session RLY-5R8T ended',     actor: 'Priya Sharma',  type: 'session',   timestamp: new Date(now - 1800000).toISOString() },
  { id: 'a5', text: 'New session created for Alice Chen', actor: 'System', type: 'session',   timestamp: new Date(now - 300000).toISOString() },
];

const RECORDINGS = [
  {
    id: 'r1', sessionId: 's4', sessionCode: 'RLY-2X6N-8L5Y',
    name: 'Session RLY-2X6N — Sarah Mitchell', customerName: 'Sarah Mitchell',
    agentName: 'Priya Sharma', duration: 1800, size: 125 * 1024 * 1024,
    status: 'ready', url: null, createdAt: new Date(now - 5400000).toISOString(),
  },
  {
    id: 'r2', sessionId: 's3', sessionCode: 'RLY-5R8T-4W2Q',
    name: 'Session RLY-5R8T — Mike Ross', customerName: 'Mike Ross',
    agentName: 'Priya Sharma', duration: 1200, size: 89 * 1024 * 1024,
    status: 'ready', url: null, createdAt: new Date(now - 1800000).toISOString(),
  },
];

const ADMIN_AGENTS = [
  { id: 'u1', name: 'Priya Sharma',  email: 'priya.sharma@relay.io', role: 'agent', status: 'online',  activeSessions: 1, totalSessions: 47, avgDuration: 1320 },
  { id: 'u2', name: 'Marcus Chen',   email: 'marcus.chen@relay.io',  role: 'agent', status: 'online',  activeSessions: 1, totalSessions: 32, avgDuration: 1140 },
  { id: 'u3', name: 'Elena Vasquez', email: 'elena.vasquez@relay.io', role: 'agent', status: 'away',   activeSessions: 0, totalSessions: 28, avgDuration: 980 },
  { id: 'u5', name: 'Alex Rivera',   email: 'admin@relay.io',         role: 'admin', status: 'online',  activeSessions: 0, totalSessions: 12, avgDuration: 720 },
];

const ADMIN_EVENTS = [
  { id: 'e1', severity: 'info',    message: 'Worker pool healthy — 2 workers active', source: 'mediasoup', createdAt: new Date(now - 60000).toISOString() },
  { id: 'e2', severity: 'warning', message: 'Elevated latency on worker-1 (42ms)',    source: 'network',   createdAt: new Date(now - 120000).toISOString() },
  { id: 'e3', severity: 'info',    message: 'Session transport connected',             source: 'webrtc',    createdAt: new Date(now - 300000).toISOString() },
];

// ── Route table ─────────────────────────────────────────────────────────────
type Handler = (url: string, data?: unknown) => unknown;

const GET_ROUTES: Record<string, Handler> = {
  '/auth/me': () => ({ user: USERS['priya.sharma@relay.io'].user }),

  '/sessions/dashboard': () => ({
    metrics:      METRICS,
    activities:   ACTIVITIES,
    liveSessions: SESSIONS.filter((s) => s.status === 'live'),
  }),

  '/sessions/live': () => ({ sessions: SESSIONS.filter((s) => s.status !== 'ended') }),

  '/sessions': () => ({ sessions: SESSIONS, total: SESSIONS.length }),

  '/sessions/history': () => ({
    sessions: SESSIONS.filter((s) => s.status === 'ended'),
    total:    SESSIONS.filter((s) => s.status === 'ended').length,
    page: 1,
    pageSize: 20,
  }),

  '/sessions/:id': (url) => {
    const id = url.split('/sessions/')[1]?.split('?')[0];
    const session = SESSIONS.find((s) => s.id === id) ?? SESSIONS[0];
    return {
      session,
      chat: [
        { id: 'c1', sessionId: session.id, userId: 'u1', userName: 'Priya Sharma', role: 'agent',    content: 'Hello! How can I help you today?',    type: 'text', status: 'seen',      createdAt: new Date(now - 550000).toISOString() },
        { id: 'c2', sessionId: session.id, userId: 'cx', userName: session.customerName, role: 'customer', content: "Hi, I'm having trouble with my account login.", type: 'text', status: 'seen', createdAt: new Date(now - 540000).toISOString() },
        { id: 'c3', sessionId: session.id, userId: 'u1', userName: 'Priya Sharma', role: 'agent',    content: "Let me look into that for you right away.", type: 'text', status: 'delivered', createdAt: new Date(now - 530000).toISOString() },
      ],
      timeline: [
        { id: 't1', sessionId: session.id, type: 'join', description: 'Priya Sharma joined',       actor: 'Priya Sharma', createdAt: new Date(now - 600000).toISOString() },
        { id: 't2', sessionId: session.id, type: 'join', description: `${session.customerName} joined`, actor: session.customerName, createdAt: new Date(now - 590000).toISOString() },
      ],
      files: [],
    };
  },

  '/recordings': () => ({ recordings: RECORDINGS, total: RECORDINGS.length, storage: { used: 2.4, total: 10 } }),

  '/analytics': () => ({
    totalSessions:   58,
    avgDuration:     1245,
    avgCsat:         4.2,
    totalRecordings: 14,
    sessionsByDay:   [4,6,5,8,7,9,8,7,6,9,10,8,7,9,10,8,9,7,8,10,11,9,8,10,9,8,7,9],
    durationByDay:   [1100,1200,1150,1300,1245,1280,1260,1200,1190,1310,1350,1280,1260,1300,1340,1290,1310,1250,1270,1330,1380,1310,1290,1340,1310,1270,1240,1300],
    agentPerf: ADMIN_AGENTS.map((a) => ({ ...a, csat: (Math.random() * 1.5 + 3.5).toFixed(1), resolvedSessions: Math.floor(Math.random() * 20 + 10) })),
    topIssues: [
      { label: 'Login issues',       count: 18 },
      { label: 'Billing questions',  count: 14 },
      { label: 'Feature requests',   count: 12 },
      { label: 'Bug reports',        count: 9 },
      { label: 'Account setup',      count: 5 },
    ],
  }),

  '/admin/agents': () => ({ agents: ADMIN_AGENTS }),
  '/admin/events': () => ({ events: ADMIN_EVENTS }),

  '/admin/overview': () => ({
    agents:  ADMIN_AGENTS,
    events:  ADMIN_EVENTS,
    metrics: { totalAgents: 4, onlineAgents: 3, activeSessions: 2, totalSessions: 119 },
  }),

  '/health': () => ({ status: 'ok (mock)', db: 'mock', timestamp: new Date().toISOString() }),
};

const POST_ROUTES: Record<string, Handler> = {
  '/auth/login': (_url, body) => {
    const { email, password } = body as { email: string; password: string };
    const entry = USERS[email];
    if (!entry || entry.password !== password) {
      throw { response: { status: 401, data: { error: 'Invalid credentials' } } };
    }
    return { token: mockToken(entry.user.id), user: entry.user };
  },

  '/auth/join': (_url, body) => {
    const { inviteCode } = body as { inviteCode: string };
    const session = SESSIONS.find((s) => s.inviteCode === inviteCode);
    if (!session) {
      throw { response: { status: 404, data: { error: 'Invalid invite code' } } };
    }
    const customer: DemoUser = {
      id: 'cx', email: 'customer@demo.relay', name: session.customerName,
      role: 'customer', status: 'online', createdAt: new Date().toISOString(),
    };
    return { token: mockToken('cx'), user: customer, session };
  },

  '/sessions': (_url, body) => {
    const b = body as Record<string, string>;
    const s = {
      ...SESSIONS[0],
      id: `s${Date.now()}`,
      sessionCode: `RLY-DEMO-${String(Date.now()).slice(-4)}`,
      inviteCode:  `RELAY-DEMO-${String(Date.now()).slice(-4)}`,
      customerName: b.customerName || 'New Customer',
      customerEmail: b.customerEmail || 'customer@example.com',
      status: 'waiting',
      isRecording: false,
      startedAt: null,
    };
    SESSIONS.push(s as typeof SESSIONS[0]);
    return { session: s };
  },

  '/sessions/:id/start': (url) => {
    const id = url.split('/sessions/')[1]?.split('/')[0];
    const s = SESSIONS.find((sess) => sess.id === id);
    if (s) { s.status = 'live'; s.startedAt = new Date().toISOString(); }
    return { session: s ?? SESSIONS[0] };
  },

  '/sessions/:id/end': (url) => {
    const id = url.split('/sessions/')[1]?.split('/')[0];
    const s = SESSIONS.find((sess) => sess.id === id);
    if (s) { s.status = 'ended'; s.endedAt = new Date().toISOString(); }
    return { session: s ?? SESSIONS[0] };
  },
};

const PATCH_ROUTES: Record<string, Handler> = {
  '/sessions/:id': (_url, body) => ({ session: { ...SESSIONS[0], ...(body as object) } }),
  '/admin/agents/:id': (_url, body) => ({ agent: { ...ADMIN_AGENTS[0], ...(body as object) } }),
};

// ── Route matcher ────────────────────────────────────────────────────────────
function matchRoute(
  table: Record<string, Handler>,
  urlPath: string
): Handler | null {
  // Exact match first
  if (table[urlPath]) return table[urlPath];

  // Pattern match — replace path segments after /sessions/ or /admin/
  for (const pattern of Object.keys(table)) {
    if (!pattern.includes(':')) continue;
    const regex = new RegExp(
      '^' + pattern.replace(/:[^/]+/g, '[^/]+') + '(?:\\?.*)?$'
    );
    if (regex.test(urlPath)) return table[pattern];
  }
  return null;
}

// ── Axios adapter ────────────────────────────────────────────────────────────
export function installMockAdapter(instance: AxiosInstance) {
  instance.interceptors.request.use(async (config) => {
    // config.url is the path relative to baseURL (e.g. '/auth/login')
    // config.data is already a JS object — axios hasn't stringified it yet
    const urlPath = '/' + (config.url ?? '').replace(/^\/+/, '');
    const method  = (config.method ?? 'get').toLowerCase();

    // Parse body safely — may already be an object or a string
    let body: unknown;
    if (config.data) {
      body = typeof config.data === 'string'
        ? JSON.parse(config.data)
        : config.data;
    }

    let handler: Handler | null = null;
    if (method === 'get')   handler = matchRoute(GET_ROUTES,   urlPath);
    if (method === 'post')  handler = matchRoute(POST_ROUTES,  urlPath);
    if (method === 'patch') handler = matchRoute(PATCH_ROUTES, urlPath);

    // If we have a mock for this route, short-circuit the real request
    if (handler) {
      // Simulate a small network delay
      await new Promise((r) => setTimeout(r, 80 + Math.random() * 120));

      try {
        const data = handler(urlPath, body);
        return Promise.reject({
          __mock: true,
          config,
          data,
          status: 200,
          statusText: 'OK (mock)',
          headers: {},
        });
      } catch (err: unknown) {
        const e = err as { response?: { status: number; data: unknown } };
        if (e.response) {
          return Promise.reject({
            __mock: true,
            config,
            ...e,
            isAxiosError: true,
          });
        }
        throw err;
      }
    }

    return config;
  });

  // Response interceptor — turn mock rejections into successes
  instance.interceptors.response.use(
    (res) => res,
    (err) => {
      if (err?.__mock && !err?.response) {
        // Successful mock response
        return Promise.resolve({ data: err.data, status: err.status, headers: {}, config: err.config });
      }
      if (err?.__mock && err?.response) {
        // Mocked error (e.g. 401)
        return Promise.reject(err);
      }
      return Promise.reject(err);
    }
  );
}
