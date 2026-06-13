import fs from 'fs/promises';
import path from 'path';
import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { env } from '../config/env.js';

const localRoot = path.resolve(env.storage.localDir);

let s3: S3Client | null = null;

function getS3(): S3Client {
  if (!s3) {
    s3 = new S3Client({
      region: env.storage.s3.region,
      endpoint: env.storage.s3.endpoint,
      credentials: {
        accessKeyId: env.storage.s3.accessKeyId!,
        secretAccessKey: env.storage.s3.secretAccessKey!,
      },
      forcePathStyle: true,
    });
  }
  return s3;
}

async function ensureLocalDir(dir: string) {
  await fs.mkdir(dir, { recursive: true });
}

export async function uploadFile(
  key: string,
  buffer: Buffer,
  mimeType: string
): Promise<{ key: string; url: string }> {
  if (env.storage.driver === 's3' && env.storage.s3.accessKeyId) {
    await getS3().send(
      new PutObjectCommand({
        Bucket: env.storage.s3.bucket,
        Key: key,
        Body: buffer,
        ContentType: mimeType,
      })
    );
    const publicUrl = env.storage.s3.publicUrl
      ? `${env.storage.s3.publicUrl}/${key}`
      : await getSignedUrl(getS3(), new GetObjectCommand({ Bucket: env.storage.s3.bucket, Key: key }), { expiresIn: 86400 });
    return { key, url: publicUrl };
  }

  const filePath = path.join(localRoot, key);
  await ensureLocalDir(path.dirname(filePath));
  await fs.writeFile(filePath, buffer);
  return { key, url: `/storage/${key}` };
}

export function getPublicUrl(key: string): string {
  if (env.storage.driver === 's3' && env.storage.s3.publicUrl) {
    return `${env.storage.s3.publicUrl}/${key}`;
  }
  return `/storage/${key}`;
}

export async function initStorage() {
  if (env.storage.driver === 'local') {
    await ensureLocalDir(path.join(localRoot, 'recordings'));
    await ensureLocalDir(path.join(localRoot, 'uploads'));
  }
}
