import { redis } from "../../../shared/db/redis";
import crypto from "crypto";

export interface SessionData {
  userId: string;
  email: string;
  username: string;
}

const SESSION_TTL = 7 * 24 * 60 * 60; // 7 days in seconds

export class SessionService {
  /** Create a session ID, store user metadata in Redis, and return session ID */
  static async createSession(user: SessionData): Promise<string> {
    const sessionId = crypto.randomUUID();
    const sessionKey = `session:${sessionId}`;
    
    await redis.set(sessionKey, JSON.stringify(user), "EX", SESSION_TTL);
    return sessionId;
  }

  /** Retrieve session details from Redis */
  static async getSession(sessionId: string): Promise<SessionData | null> {
    const sessionKey = `session:${sessionId}`;
    const data = await redis.get(sessionKey);
    if (!data) return null;
    return JSON.parse(data) as SessionData;
  }

  /** Revoke session */
  static async destroySession(sessionId: string): Promise<void> {
    const sessionKey = `session:${sessionId}`;
    await redis.del(sessionKey);
  }
}
