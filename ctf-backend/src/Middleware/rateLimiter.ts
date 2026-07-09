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
      const pipeline = redis.pipeline();
      pipeline.zremrangebyscore(key, 0, windowStart);
      pipeline.zcard(key);
      pipeline.zadd(key, now, now.toString());
      pipeline.expire(key, Math.ceil(windowMs / 1000));

      const results = await pipeline.exec();

      const requestCount = results?.[1]?.[1] as number;

      res.setHeader("X-RateLimit-Limit", max);
      res.setHeader("X-RateLimit-Remaining", Math.max(0, max - requestCount));

      if (requestCount >= max) {
        res.setHeader("Retry-After", Math.ceil(windowMs / 1000));
        return res.status(429).json({
          error: message,
          retryAfter: Math.ceil(windowMs / 1000),
        });
      }

      next(); 
    } catch (err) {
      console.error("Rate limiter Redis error:", err);
      next();
    }
  };
}