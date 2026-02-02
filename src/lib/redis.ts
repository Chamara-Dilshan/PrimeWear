import Redis from "ioredis";

// Create Redis client singleton
const getRedisClient = () => {
  if (!process.env.REDIS_URL) {
    throw new Error("REDIS_URL environment variable is not set");
  }

  const redis = new Redis(process.env.REDIS_URL, {
    maxRetriesPerRequest: 3,
    retryStrategy: (times) => {
      if (times > 3) {
        return null; // Stop retrying
      }
      return Math.min(times * 200, 1000); // Exponential backoff
    },
  });

  redis.on("error", (error) => {
    console.error("Redis connection error:", error);
  });

  redis.on("connect", () => {
    console.log("Redis connected successfully");
  });

  return redis;
};

// Export singleton instance
export const redis = getRedisClient();

// Helper functions for common operations
export const redisHelpers = {
  /**
   * Set a key with expiration in seconds
   */
  async setWithExpiry(key: string, value: string, expiryInSeconds: number) {
    return redis.setex(key, expiryInSeconds, value);
  },

  /**
   * Get a key
   */
  async get(key: string) {
    return redis.get(key);
  },

  /**
   * Delete a key
   */
  async delete(key: string) {
    return redis.del(key);
  },

  /**
   * Check if key exists
   */
  async exists(key: string) {
    return redis.exists(key);
  },

  /**
   * Increment a counter with expiration
   */
  async incrementWithExpiry(key: string, expiryInSeconds: number) {
    const pipeline = redis.pipeline();
    pipeline.incr(key);
    pipeline.expire(key, expiryInSeconds);
    const results = await pipeline.exec();
    return results?.[0]?.[1] as number;
  },

  /**
   * Get remaining TTL for a key
   */
  async ttl(key: string) {
    return redis.ttl(key);
  },
};
