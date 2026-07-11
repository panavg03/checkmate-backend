import { Router } from "express";
import { OAuth2Client } from "google-auth-library";
import { upsertGoogleUser } from "../../../shared/db/user_auth";
import { SessionService } from "../services/session.service";

const router = Router();

const oAuth2Client = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

// Redirects client to Google OAuth Consent screen
router.get("/google", (req, res) => {
  const authorizeUrl = oAuth2Client.generateAuthUrl({
    access_type: "offline",
    scope: [
      "https://www.googleapis.com/auth/userinfo.profile",
      "https://www.googleapis.com/auth/userinfo.email"
    ],
    prompt: "consent"
  });
  res.redirect(authorizeUrl);
});

// Google OAuth callback endpoint
router.get("/google/callback", async (req, res) => {
  const code = req.query.code as string;
  if (!code) {
    return res.status(400).json({ error: "Authorization code missing" });
  }

  try {
    // Exchange auth code for tokens
    const { tokens } = await oAuth2Client.getToken(code);
    oAuth2Client.setCredentials(tokens);

    // Verify Google ID Token
    const ticket = await oAuth2Client.verifyIdToken({
      idToken: tokens.id_token!,
      audience: process.env.GOOGLE_CLIENT_ID
    });
    
    const payload = ticket.getPayload();
    if (!payload || !payload.sub || !payload.email) {
      return res.status(400).json({ error: "Invalid user details from Google" });
    }

    const { sub: googleId, email, name } = payload;

    // Save/Get user details from DB
    const dbUser = await upsertGoogleUser(googleId, email, name || 'User');

    // Create session in Redis
    const sessionId = await SessionService.createSession({
      userId: dbUser.userid,
      email: dbUser.email,
      username: dbUser.username
    });

    // Set HttpOnly cookie on client
    res.cookie("sid", sessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days in milliseconds
    });

    // Redirect to frontend application
    return res.redirect(process.env.FRONTEND_URL || "http://localhost:5173");
  } catch (error) {
    console.error("Google Auth Error:", error);
    return res.status(500).json({ error: "Authentication failed" });
  }
});

// Revoke session and clear cookies
router.post("/logout", async (req, res) => {
  const sessionId = req.cookies?.sid;
  if (sessionId) {
    await SessionService.destroySession(sessionId);
    res.clearCookie("sid");
  }
  return res.json({ ok: true, message: "Logged out successfully" });
});

export default router;
