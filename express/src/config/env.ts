import "dotenv/config";

const required = [
  "GOOGLE_CLIENT_ID",
  "GOOGLE_CLIENT_SECRET",
  "GOOGLE_REDIRECT_URI",
  "FRONTEND_URL",
  "JWT_SECRET",
  "DB_USER",
  "DB_HOST",
  "DB_NAME",
  "DB_PASSWORD",
  "DB_PORT",
] as const;

const missing = required.filter((key) => !process.env[key]);
if (missing.length > 0) {
  console.error(
    `❌  Missing required environment variables:\n${missing.map((k) => `   • ${k}`).join("\n")}`
  );
  process.exit(1);
}

export const env = {
  port: Number(process.env.PORT ?? 3000),
  nodeEnv: process.env.NODE_ENV ?? "development",

  googleClientId: process.env.GOOGLE_CLIENT_ID!,
  googleClientSecret: process.env.GOOGLE_CLIENT_SECRET!,
  googleRedirectUri: process.env.GOOGLE_REDIRECT_URI!,

  frontendUrl: process.env.FRONTEND_URL!,

  jwtSecret: process.env.JWT_SECRET!,

  cookieDomain: process.env.COOKIE_DOMAIN || undefined,

  dbUser: process.env.DB_USER!,
  dbHost: process.env.DB_HOST!,
  dbName: process.env.DB_NAME!,
  dbPassword: process.env.DB_PASSWORD!,
  dbPort: Number(process.env.DB_PORT!),
} as const;
