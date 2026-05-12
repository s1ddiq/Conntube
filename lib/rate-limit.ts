// lib/rate-limit.ts
import { Ratelimit, Duration } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// Create a new rate limiter for different endpoints
export const createRateLimiter = (
  requests: number = 10,
  duration: Duration = "10 s",
) => {
  return new Ratelimit({
    redis: Redis.fromEnv(),
    limiter: Ratelimit.slidingWindow(requests, duration),
    analytics: true, // Enable analytics on Upstash dashboard
    prefix: "conntube", // Prefix for keys in Redis
  });
};

// Pre-configured limiters for different use cases
export const rateLimiters = {
  // Strict: 5 attempts per 15 minutes for password attempts
  auth: new Ratelimit({
    redis: Redis.fromEnv(),
    limiter: Ratelimit.slidingWindow(5, "15m"),
    analytics: true,
    prefix: "conntube:auth",
  }),

  // Medium: 10 room creations per hour
  createRoom: new Ratelimit({
    redis: Redis.fromEnv(),
    limiter: Ratelimit.slidingWindow(10, "1h"),
    analytics: true,
    prefix: "conntube:create-room",
  }),

  // Medium: 30 room updates per minute
  updateRoom: new Ratelimit({
    redis: Redis.fromEnv(),
    limiter: Ratelimit.slidingWindow(30, "1m"),
    analytics: true,
    prefix: "conntube:update-room",
  }),

  // Light: 100 GET requests per minute
  getRoom: new Ratelimit({
    redis: Redis.fromEnv(),
    limiter: Ratelimit.slidingWindow(100, "1m"),
    analytics: true,
    prefix: "conntube:get-room",
  }),
};
