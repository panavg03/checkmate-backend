import express from "express";
import cookieParser from "cookie-parser";
import process from "process";
import { redis } from "../../shared/db/redis";
import { createRateLimiter } from "./middleware/rateLimiter";
import partyRouter from "./routes/party.routes";
import authRouter from "./routes/auth.routes";
import { requireAuth } from "./middleware/auth";

const app = express();
app.use(express.json());
app.use(cookieParser()); // Enables parsing session cookies

const flagLimiter = createRateLimiter(redis, {
  windowMs: 60_000,
  max: 5,
  keyPrefix: "rl:flag",
  message: "Too many flag attempts. Wait a minute.",
});

// Auth endpoints (login, callback, logout)
app.use("/auth", authRouter);

// Protected party management endpoints
app.use("/party", requireAuth, partyRouter);

// Profile endpoint to verify session details
app.get("/me", requireAuth, (req, res) => {
  res.json({ user: req.user });
});

app.post("/submit", flagLimiter, (req, res) => {
  res.json({ ok: true, message: "flag received" });
});

const PORT = Number(process.env.PORT ?? 3000);
app.listen(PORT, () => {
  console.log(` Server running on http://localhost:${PORT}`);
});
