import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { env } from "./env.js";
import type { GoogleProfilePayload } from "../types/auth.types.js";

passport.use(
  new GoogleStrategy(
    {
      clientID: env.googleClientId,
      clientSecret: env.googleClientSecret,
      callbackURL: env.googleRedirectUri,
      scope: ["profile", "email"],
    },
    (_accessToken, _refreshToken, profile, done) => {
      const email = profile.emails?.[0]?.value;

      if (!email) {
        return done(new Error("Google profile has no email"));
      }

      const normalized: GoogleProfilePayload = {
        googleId: profile.id,
        email,
        displayName: profile.displayName ?? email,
      };

      return done(null, normalized as any);
    }
  )
);

passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((user: any, done) => done(null, user));

export default passport;
