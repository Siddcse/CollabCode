import { Redis } from 'ioredis';
import { env } from './env';

let redisClient: Redis | null = null;
let redisAvailable = false;

export function isRedisAvailable(): boolean {
  return redisAvailable;
}

export function getRedis(): Redis | null {
  return redisClient;
}

export async function connectRedis(): Promise<void> {
  const redisUrl = env.REDIS_URL;
  if (!redisUrl) {
    console.warn('⚠️  REDIS_URL not configured — continuing without cache');
    return;
  }

  return new Promise((resolve, reject) => {
    const client = new Redis(redisUrl, {
      lazyConnect: true,
      enableOfflineQueue: false,
      // Stop retrying after first failure in dev
      retryStrategy: (times) => {
        if (times >= 3) return null; // stop retrying
        return Math.min(times * 500, 2000);
      },
      reconnectOnError: () => false,
    });

    client.once('connect', () => {
      redisClient = client;
      redisAvailable = true;
      console.log('✅ Redis connected');
      resolve();
    });

    client.once('error', (err) => {
      console.warn(`⚠️  Redis unavailable (${err.message}) — continuing without cache`);
      client.disconnect();
      reject(err);
    });

    client.connect().catch((err) => {
      reject(err);
    });
  });
}

/** Safe Redis get — returns null if Redis is down */
export async function redisGet(key: string): Promise<string | null> {
  if (!redisClient || !redisAvailable) return null;
  try { return await redisClient.get(key); } catch { return null; }
}

/** Safe Redis set with TTL */
export async function redisSetex(key: string, ttl: number, value: string): Promise<void> {
  if (!redisClient || !redisAvailable) return;
  try { await redisClient.setex(key, ttl, value); } catch {}
}

/** Safe Redis increment */
export async function redisIncr(key: string): Promise<number> {
  if (!redisClient || !redisAvailable) return 0;
  try { return await redisClient.incr(key); } catch { return 0; }
}
