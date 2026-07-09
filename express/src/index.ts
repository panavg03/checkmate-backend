import express from "express";
import process from "process";
import { redis } from "../../shared/db/redis";
import { createRateLimiter } from "./middleware/rateLimiter";

const app = express();
app.use(express.json());

const flagLimiter = createRateLimiter(redis, {
  windowMs: 60_000,
  max: 5,
  keyPrefix: "rl:flag",
  message: "Too many flag attempts. Wait a minute.",
});

app.post("/submit", flagLimiter, (req, res) => {
  res.json({ ok: true, message: "flag received" });
});

const PORT = Number(process.env.PORT ?? 3000);
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
