import { Request, Response, NextFunction } from "express";
import { Redis } from "ioredis";

interface RateLimitOptions {
  windowMs: number;     
  max: number;          
  keyPrefix: string;    
  message?: string;     
}

export function createRateLimiter(redis: Redis, options: RateLimitOptions) {
  const {
    windowMs,
    max,
    keyPrefix,
    message = "Too many requests, slow down.",
  } = options;

  return async (req: Request, res: Response, next: NextFunction) => {
    const userId = (req as any).user?.id ?? req.ip;
    const key = `${keyPrefix}:${userId}`;
    const now = Date.now();
    const windowStart = now - windowMs;

    try {
  const checkPipeline = redis.pipeline();
  checkPipeline.zremrangebyscore(key, 0, windowStart);
  checkPipeline.zcard(key);
  const checkResults = await checkPipeline.exec();
  const requestCount = checkResults?.[1]?.[1] as number;

  res.setHeader("X-RateLimit-Limit", max);

  if (requestCount >= max) {
    res.setHeader("X-RateLimit-Remaining", 0);
    res.setHeader("Retry-After", Math.ceil(windowMs / 1000));
    return res.status(429).json({
      error: message,
      retryAfter: Math.ceil(windowMs / 1000),
    });
  }

  const recordPipeline = redis.pipeline();
  recordPipeline.zadd(key, now, now.toString());
  recordPipeline.expire(key, Math.ceil(windowMs / 1000));
  await recordPipeline.exec();

  res.setHeader("X-RateLimit-Remaining", Math.max(0, max - requestCount - 1));

  next();
} catch (err) {
  console.error("Rate limiter Redis error:", err);
  next(); // fail open
}
  };
}