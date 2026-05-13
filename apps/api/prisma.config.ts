import dotenv from "dotenv";
import path from "node:path";
import { defineConfig } from "prisma/config";

const appEnvPath = path.resolve(process.cwd(), ".env");
const rootEnvPath = path.resolve(process.cwd(), "../..", ".env");

dotenv.config({ path: rootEnvPath });
dotenv.config({ path: appEnvPath, override: true });

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations"
  },
  datasource: {
    url:
      process.env.DATABASE_URL ??
      "postgresql://openme:openme@localhost:5432/openme_dev"
  }
});
