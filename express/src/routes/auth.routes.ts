import { Router } from "express";
import passport from "../config/passport.js";
import { authenticateUser } from "../middleware/authenticateUser.js";
import { googleCallback, logout, me } from "../controllers/auth.controller.js";

const router = Router();

router.get(
  "/google",
  passport.authenticate("google", { scope: ["profile", "email"], session: false })
);

router.get(
  "/google/callback",
  passport.authenticate("google", { session: false, failureRedirect: "/auth/google" }),
  googleCallback
);

router.post("/logout", authenticateUser, logout);

router.get("/me", authenticateUser, me);

export default router;
