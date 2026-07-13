import dotenv from "dotenv";

/**
 * Centralized environment loading.
 *
 * NODE_ENV selects which file to load and must be set BEFORE this runs
 * (via the npm script or the deploy platform) — it is the thing that
 * chooses the file, so it cannot live inside the file itself.
 *
 * Layering: the environment-specific file (`.env.development` /
 * `.env.production`) is loaded first and takes precedence; the base
 * `.env` is loaded second as a fallback for values shared across
 * environments. dotenv does not override already-set vars, so the
 * order below gives the env-specific file priority.
 *
 * Import this module for its side effect at the top of every entry
 * point (server, seed, prisma config, tests):  import "./load-env.ts";
 */
const nodeEnv = process.env.NODE_ENV ?? "development";

dotenv.config({ path: `.env.${nodeEnv}` });
dotenv.config({ path: ".env" });

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}

export const NODE_ENV = nodeEnv;
export const isProduction = nodeEnv === "production";
export const isDevelopment = nodeEnv === "development";
export const JWT_REFRESH_TOKEN_SECRET = requireEnv("JWT_REFRESH_TOKEN_SECRET");
export const JWT_ACCESS_TOKEN_SECRET = requireEnv("JWT_ACCESS_TOKEN_SECRET");
