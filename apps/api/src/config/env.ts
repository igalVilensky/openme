import dotenv from "dotenv";
import path from "node:path";

const appEnvPath = path.resolve(__dirname, "../..", ".env");
const rootEnvPath = path.resolve(__dirname, "../../../..", ".env");

dotenv.config({ path: rootEnvPath });
dotenv.config({ path: appEnvPath, override: true });

function parseNodeEnv(value: string | undefined): string {
  return value?.trim() || "development";
}

const nodeEnv = parseNodeEnv(process.env.NODE_ENV);
const isProduction = nodeEnv === "production";

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

function parseWebUrl(value: string | undefined): string {
  const webUrl = value?.trim().replace(/\/+$/, "");

  if (webUrl === "*") {
    throw new Error("WEB_URL must not be a wildcard origin");
  }

  if (isProduction && !webUrl) {
    throw new Error("WEB_URL is required in production");
  }

  if (webUrl) {
    try {
      new URL(webUrl);
    } catch {
      throw new Error(`Invalid WEB_URL value: ${webUrl}`);
    }
  }

  return webUrl || "http://localhost:3000";
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

function parseOptionalSecret(value: string | undefined): string | null {
  return value?.trim() || null;
}

function parseJwtSecret(value: string | undefined): string {
  const secret = value?.trim();

  if (isProduction) {
    if (!secret) {
      throw new Error("JWT_SECRET is required in production");
    }

    if (secret === "replace_me_with_a_long_random_secret") {
      throw new Error("JWT_SECRET must be changed in production");
    }

    if (secret.length < 32) {
      throw new Error("JWT_SECRET must be at least 32 characters in production");
    }
  }

  return secret || "dev_only_openme_jwt_secret_change_me";
}

export const env = {
  nodeEnv,
  port: parsePort(process.env.PORT),
  webUrl: parseWebUrl(process.env.WEB_URL),
  databaseUrl: parseDatabaseUrl(process.env.DATABASE_URL),
  aiEnabled: parseBoolean(process.env.AI_ENABLED),
  aiServiceUrl: parseAiServiceUrl(process.env.AI_SERVICE_URL),
  aiServiceToken: parseOptionalSecret(process.env.AI_SERVICE_TOKEN),
  jwtSecret: parseJwtSecret(process.env.JWT_SECRET),
} as const;
