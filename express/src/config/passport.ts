import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";

import type { GoogleProfilePayload } from "../types/auth.types.js";

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
      callbackURL: process.env.GOOGLE_REDIRECT_URI as string,
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
