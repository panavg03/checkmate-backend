import jwt, { type Algorithm } from "jsonwebtoken";
import { env } from "../config/env.js";
import type { JwtPayload } from "../types/auth.types.js";

const ALGORITHM: Algorithm = "HS256";
const EXPIRES_IN = "5h";

export function signAccessToken(payload: JwtPayload): string {
  return jwt.sign(
    { userId: payload.userId, email: payload.email, role: payload.role },
    env.jwtSecret,
    { algorithm: ALGORITHM, expiresIn: EXPIRES_IN }
  );
}

export function verifyAccessToken(token: string): JwtPayload {
  const decoded = jwt.verify(token, env.jwtSecret, {
    algorithms: [ALGORITHM],
  });

  return decoded as unknown as JwtPayload;
}
