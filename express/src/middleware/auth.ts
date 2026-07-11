import { Request, Response, NextFunction } from "express";
import { SessionService, SessionData } from "../services/session.service";

declare global {
  namespace Express {
    interface Request {
      user?: SessionData;
    }
  }
}

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const sessionId = req.cookies?.sid;

  if (!sessionId) {
    return res.status(401).json({ error: "Unauthorized: Session cookie missing" });
  }

  try {
    const sessionUser = await SessionService.getSession(sessionId);
    if (!sessionUser) {
      res.clearCookie("sid");
      return res.status(401).json({ error: "Unauthorized: Session invalid or expired" });
    }

    req.user = sessionUser;
    next();
  } catch (error) {
    console.error("Session verification error:", error);
    return res.status(500).json({ error: "Internal server authentication error" });
  }
}
