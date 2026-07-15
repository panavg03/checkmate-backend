import express from "express";
import cookieParser from "cookie-parser";
import process from "process";
import { redis } from "../../shared/db/redis";
import { createRateLimiter } from "./middleware/rateLimiter";
import partyRouter from "./routes/party.routes";
import authRouter from "./routes/auth.routes";
import passport from "./config/passport";
import { authenticateUser } from "./middleware/authenticateUser";
import adminRouter from "./routes/admin.routes";

const app = express();
app.use(express.json());
app.use(cookieParser());
app.use(passport.initialize()); // Stateless — no passport.session()

const flagLimiter = createRateLimiter(redis, {
  windowMs: 60_000,
  max: 5,
  keyPrefix: "rl:flag",
  message: "Too many flag attempts. Wait a minute.",
});

// Auth endpoints (login, callback, logout, /me)
app.use("/auth", authRouter);

// Admin endpoints (user management, party overrides) — admin-only
app.use("/admin", adminRouter);

// Protected party management endpoints
app.use("/party", authenticateUser, partyRouter);

// /me endpoint now lives in auth.routes.ts as GET /auth/me

app.post("/submit", flagLimiter, (req, res) => {
  res.json({ ok: true, message: "flag received" });
});

const PORT = Number(process.env.PORT ?? 3000);
app.listen(PORT, () => {
  console.log(` Server running on http://localhost:${PORT}`);
});
