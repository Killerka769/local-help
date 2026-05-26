-- CreateTable
CREATE TABLE "UserDailyLimit" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserDailyLimit_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "UserDailyLimit_userId_date_idx" ON "UserDailyLimit"("userId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "UserDailyLimit_userId_action_date_key" ON "UserDailyLimit"("userId", "action", "date");

-- AddForeignKey
ALTER TABLE "UserDailyLimit" ADD CONSTRAINT "UserDailyLimit_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
