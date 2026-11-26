-- AlterTable
ALTER TABLE "Request" ADD COLUMN "expiresAt" TIMESTAMP(3);

UPDATE "Request"
SET "expiresAt" = "createdAt" + ("deadline" * INTERVAL '1 day')
WHERE "expiresAt" IS NULL;

ALTER TABLE "Request" ALTER COLUMN "expiresAt" SET NOT NULL;

-- CreateIndex
CREATE INDEX "Request_cityId_status_createdAt_idx" ON "Request"("cityId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "Request_status_expiresAt_idx" ON "Request"("status", "expiresAt");

-- CreateIndex
CREATE INDEX "Offer_userId_idx" ON "Offer"("userId");
