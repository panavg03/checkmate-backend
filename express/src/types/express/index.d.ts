import type { JwtPayload } from "../auth.types.js";

declare global {
  namespace Express {
    interface User extends JwtPayload {}
  }
}
