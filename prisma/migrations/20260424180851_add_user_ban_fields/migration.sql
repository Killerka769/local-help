-- AlterTable
ALTER TABLE "User" ADD COLUMN     "bannedAt" TIMESTAMP(3),
ADD COLUMN     "blockedBy" TEXT,
ADD COLUMN     "blockedReason" TEXT,
ADD COLUMN     "blockedUntil" TIMESTAMP(3);
