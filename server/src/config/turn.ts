import { env } from './env.js';

export interface IceServerConfig {
  urls: string | string[];
  username?: string;
  credential?: string;
}

export function getIceServers(): IceServerConfig[] {
  const servers: IceServerConfig[] = [{ urls: ['stun:stun.l.google.com:19302'] }];

  const urls = (env.turn.urls && env.turn.urls.length > 0)
    ? env.turn.urls
    : ['turn:openrelay.metered.ca:80', 'turn:openrelay.metered.ca:443'];

  const username = env.turn.username || 'openrelayproject';
  const credential = env.turn.credential || 'openrelayproject';

  servers.push({
    urls,
    username,
    credential,
  });

  return servers;
}
