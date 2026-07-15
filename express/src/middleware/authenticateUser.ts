import type { Request, Response, NextFunction } from "express";
import { verifyAccessToken } from "../utils/jwt.js";

const TOKEN_COOKIE = "token";

export function authenticateUser(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const token: string | undefined = req.cookies?.[TOKEN_COOKIE];

  if (!token) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }

  try {
    req.user = verifyAccessToken(token);
    next();
  } catch {
    res.status(401).json({ error: "Invalid or expired token" });
  }
}
