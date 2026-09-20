import rateLimit, { type Options } from "express-rate-limit";
import { RedisStore } from "rate-limit-redis";
import { Redis } from "ioredis";
import { env } from "../../config/env.js";
import { logger } from "../logger/index.js";

// Conditional Redis Store for distributed cluster deployments
let redisClient: Redis | null = null;

function getRedisClient(): Redis | null {
  if (env.REDIS_URL && !redisClient) {
    try {
      redisClient = new Redis(env.REDIS_URL, {
        lazyConnect: true,
        maxRetriesPerRequest: 2,
      });
      redisClient.connect().catch((err: Error) => {
        logger.warn({ err: err.message }, "Redis rate-limit connection failed, falling back to memory store");
      });
    } catch (err) {
      logger.warn({ err: (err as Error).message }, "Could not initialize Redis client for rate limiting");
      redisClient = null;
    }
  }
  return redisClient;
}

export function createRateLimitStore(prefix: string): Options["store"] | undefined {
  const client = getRedisClient();
  if (client) {
    return new RedisStore({
      prefix: `rl:${prefix}:`,
      // @ts-expect-error RedisStore sendCommand signature compatibility
      sendCommand: (...args: string[]) => client.call(...args),
    });
  }
  return undefined; // MemoryStore fallback
}

const generalStore = createRateLimitStore("general");
export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per window
  ...(generalStore ? { store: generalStore } : {}),
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    status: "fail",
    message: "Too many requests from this IP, please try again in 15 minutes.",
  },
});

// 2. Strict Rate Limiter for Authentication Endpoints (Brute-Force Defense)
const authStore = createRateLimitStore("auth");
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 attempts per window
  ...(authStore ? { store: authStore } : {}),
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    status: "fail",
    message: "Too many login/registration attempts. Account access throttled for 15 minutes.",
  },
});

// 3. Stricter Rate Limiter for Asset Downloads (Anti-Scraping Defense)
const downloadStore = createRateLimitStore("download");
export const downloadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 25, // Limit each IP to 25 downloads per hour
  ...(downloadStore ? { store: downloadStore } : {}),
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    status: "fail",
    message: "Download rate limit exceeded. Please try again in an hour.",
  },
});
