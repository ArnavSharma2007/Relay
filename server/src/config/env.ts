function required(name: string, fallback?: string): string {
  const val = process.env[name] || fallback;
  if (!val) throw new Error(`Missing required env: ${name}`);
  return val;
}

export const env = {
  port: parseInt(process.env.PORT || '3001', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  jwtSecret: process.env.JWT_SECRET || 'relay-dev-secret-change-in-production',
  databaseUrl: process.env.DATABASE_URL || '',
  clientUrls: (process.env.CLIENT_URL || 'http://localhost:5173')
    .split(',')
    .map((s) => s.trim()),
  mediasoupAnnouncedIp: process.env.MEDIASOUP_ANNOUNCED_IP || '127.0.0.1',
  storage: {
    driver: process.env.STORAGE_DRIVER || 'local',
    localDir: process.env.STORAGE_LOCAL_DIR || './storage',
    s3: {
      endpoint: process.env.S3_ENDPOINT,
      region: process.env.S3_REGION || 'auto',
      bucket: process.env.S3_BUCKET || 'relay-storage',
      accessKeyId: process.env.S3_ACCESS_KEY_ID,
      secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
      publicUrl: process.env.S3_PUBLIC_URL,
    },
  },
  turn: {
    urls: process.env.TURN_URLS?.split(',').map((s) => s.trim()),
    username: process.env.TURN_USERNAME,
    credential: process.env.TURN_CREDENTIAL,
  },
};

export function getAllowedOrigins(): string[] {
  return [...new Set([...env.clientUrls, 'http://localhost:5173', 'http://127.0.0.1:5173'])];
}
