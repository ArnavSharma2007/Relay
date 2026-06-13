import * as mediasoup from 'mediasoup';
import os from 'os';

let workers: mediasoup.types.Worker[] = [];
let nextWorkerIdx = 0;

export async function createWorkers(): Promise<mediasoup.types.Worker[]> {
  const numWorkers = Math.min(2, os.cpus().length);

  for (let i = 0; i < numWorkers; i++) {
    const worker = await mediasoup.createWorker({
      logLevel: 'warn',
      rtcMinPort: 40000,
      rtcMaxPort: 49999,
    });

    worker.on('died', () => {
      console.error(`mediasoup worker ${worker.pid} died, exiting in 2s...`);
      setTimeout(() => process.exit(1), 2000);
    });

    workers.push(worker);
  }

  console.log(`Created ${workers.length} mediasoup worker(s)`);
  return workers;
}

export function getNextWorker(): mediasoup.types.Worker {
  const worker = workers[nextWorkerIdx];
  nextWorkerIdx = (nextWorkerIdx + 1) % workers.length;
  return worker;
}

export function getWorkers(): mediasoup.types.Worker[] {
  return workers;
}
