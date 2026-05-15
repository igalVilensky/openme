import dotenv from "dotenv";
import path from "node:path";

const appEnvPath = path.resolve(__dirname, "../..", ".env");
const rootEnvPath = path.resolve(__dirname, "../../../..", ".env");

dotenv.config({ path: rootEnvPath });
dotenv.config({ path: appEnvPath, override: true });

function parsePort(value: string | undefined): number {
  if (!value) {
    return 4000;
  }

  const port = Number(value);

  if (!Number.isInteger(port) || port <= 0 || port > 65535) {
    throw new Error(`Invalid PORT value: ${value}`);
  }

  return port;
}

function parseCorsOrigins(value: string | undefined): string | string[] {
  const origins = value
    ?.split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

  if (origins?.length) {
    return origins.length === 1 ? origins[0] : origins;
  }

  return process.env.WEB_URL ?? "http://localhost:3000";
}

function parseDatabaseUrl(value: string | undefined): string {
  return value ?? "postgresql://openme:openme@localhost:5432/openme_dev";
}

function parseBoolean(value: string | undefined): boolean {
  if (!value) {
    return false;
  }

  return ["1", "true", "yes", "on"].includes(value.trim().toLowerCase());
}

function parseAiServiceUrl(value: string | undefined): string {
  return (value ?? "http://localhost:8000").replace(/\/+$/, "");
}

function parseJwtSecret(value: string | undefined): string {
  const secret = value?.trim();

  if (secret) {
    if (
      process.env.NODE_ENV === "production" &&
      secret === "replace_me_with_a_long_random_secret"
    ) {
      throw new Error("JWT_SECRET must be changed in production");
    }

    return secret;
  }

  if (process.env.NODE_ENV === "production") {
    throw new Error("JWT_SECRET is required in production");
  }

  return "dev_only_openme_jwt_secret_change_me";
}

export const env = {
  nodeEnv: process.env.NODE_ENV ?? "development",
  port: parsePort(process.env.PORT),
  corsOrigin: parseCorsOrigins(process.env.CORS_ORIGIN),
  databaseUrl: parseDatabaseUrl(process.env.DATABASE_URL),
  aiEnabled: parseBoolean(process.env.AI_ENABLED),
  aiServiceUrl: parseAiServiceUrl(process.env.AI_SERVICE_URL),
  jwtSecret: parseJwtSecret(process.env.JWT_SECRET),
} as const;
