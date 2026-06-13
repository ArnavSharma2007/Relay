import * as mediasoup from 'mediasoup';
import { getNextWorker } from './worker.js';

const mediaCodecs = [
  {
    kind: 'audio',
    mimeType: 'audio/opus',
    clockRate: 48000,
    channels: 2,
  },
  {
    kind: 'video',
    mimeType: 'video/VP8',
    clockRate: 90000,
    parameters: {
      'x-google-start-bitrate': 1000,
    },
  },
  {
    kind: 'video',
    mimeType: 'video/VP9',
    clockRate: 90000,
    parameters: {
      'profile-id': 2,
      'x-google-start-bitrate': 1000,
    },
  },
  {
    kind: 'video',
    mimeType: 'video/h264',
    clockRate: 90000,
    parameters: {
      'packetization-mode': 1,
      'profile-level-id': '4d0032',
      'level-asymmetry-allowed': 1,
      'x-google-start-bitrate': 1000,
    },
  },
] as mediasoup.types.RtpCodecCapability[];

const routers = new Map<string, mediasoup.types.Router>();

export async function getOrCreateRouter(sessionId: string): Promise<mediasoup.types.Router> {
  let router = routers.get(sessionId);
  if (!router) {
    const worker = getNextWorker();
    router = await worker.createRouter({ mediaCodecs });
    routers.set(sessionId, router);
  }
  return router;
}

export function getRouter(sessionId: string): mediasoup.types.Router | undefined {
  return routers.get(sessionId);
}

export function closeRouter(sessionId: string): void {
  const router = routers.get(sessionId);
  if (router) {
    router.close();
    routers.delete(sessionId);
  }
}

export { mediaCodecs };
