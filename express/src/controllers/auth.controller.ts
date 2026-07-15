import type { Request, Response } from "express";
import { env } from "../config/env.js";
import { findUserByGoogleIdAndEmail, updateLastLogin } from "../services/auth.service.js";
import { signAccessToken } from "../utils/jwt.js";
import { Role } from "../types/auth.types.js";
import type { GoogleProfilePayload, JwtPayload } from "../types/auth.types.js";

const TOKEN_COOKIE = "token";
const COOKIE_MAX_AGE_MS = 5 * 60 * 60 * 1000;

export async function googleCallback(req: Request, res: Response): Promise<void> {
  try {
    const profile = req.user as unknown as GoogleProfilePayload | undefined;

    if (!profile?.googleId || !profile?.email) {
      res.status(401).json({ error: "Google authentication failed" });
      return;
    }

    const user = await findUserByGoogleIdAndEmail(profile.googleId, profile.email);

    if (!user) {
      res.status(401).json({
        error: "User not registered. Please register through the portal first.",
      });
      return;
    }

    const payload: JwtPayload = {
      userId: user.userid,
      email: user.email,
      role: user.role as Role,
    };

    const token = signAccessToken(payload);

    updateLastLogin(user.userid).catch((err) =>
      console.error("Failed to update lastLogin:", err)
    );

    res.cookie(TOKEN_COOKIE, token, {
      httpOnly: true,
      secure: env.nodeEnv === "production",
      sameSite: "lax",
      domain: env.cookieDomain,
      maxAge: COOKIE_MAX_AGE_MS,
      path: "/",
    });

    res.redirect(env.frontendUrl);
  } catch (error) {
    console.error("Google callback error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}

export function logout(_req: Request, res: Response): void {
  res.clearCookie(TOKEN_COOKIE, {
    httpOnly: true,
    secure: env.nodeEnv === "production",
    sameSite: "lax",
    domain: env.cookieDomain,
    path: "/",
  });

  res.status(200).json({ message: "Logged out" });
}

export function me(req: Request, res: Response): void {
  res.status(200).json({ user: req.user });
}
