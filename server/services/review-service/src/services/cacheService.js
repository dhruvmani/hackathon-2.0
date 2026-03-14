import Redis from 'ioredis';

const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
  lazyConnect: true,
  enableOfflineQueue: false,
});

redis.on('error', (err) => {
  console.error('[review-service] Redis error:', err.message);
});

redis.connect().catch(() => {
  console.warn('[review-service] Redis unavailable, caching disabled');
});

/**
 * Get a cached value. Returns parsed object or null on miss/error.
 * @param {string} key
 * @returns {Promise<any|null>}
 */
export async function get(key) {
  try {
    const raw = await redis.get(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

/**
 * Set a value with TTL in seconds.
 * @param {string} key
 * @param {*} value
 * @param {number} ttl
 */
export async function set(key, value, ttl) {
  try {
    await redis.setex(key, ttl, JSON.stringify(value));
  } catch {
    // Silently skip on Redis failure
  }
}

/**
 * Delete a single key.
 * @param {string} key
 */
export async function del(key) {
  try {
    await redis.del(key);
  } catch {
    // Silently skip
  }
}

/**
 * Delete all keys matching a glob pattern using SCAN.
 * @param {string} pattern
 */
export async function delPattern(pattern) {
  try {
    let cursor = '0';
    do {
      const [nextCursor, keys] = await redis.scan(cursor, 'MATCH', pattern, 'COUNT', 100);
      cursor = nextCursor;
      if (keys.length > 0) await redis.del(...keys);
    } while (cursor !== '0');
  } catch {
    // Silently skip
  }
}
