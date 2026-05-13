-- AlterTable
ALTER TABLE "profiles" ADD COLUMN "headline" TEXT,
ADD COLUMN "location" TEXT,
ADD COLUMN "languages" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
ADD COLUMN "status" TEXT,
ADD COLUMN "current_focus" TEXT,
ADD COLUMN "is_public" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "endpoints" ADD COLUMN "position" INTEGER NOT NULL DEFAULT 0;
