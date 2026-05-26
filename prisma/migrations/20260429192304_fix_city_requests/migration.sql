-- CreateTable
CREATE TABLE "CityRequest" (
    "id" TEXT NOT NULL,
    "cityName" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CityRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CityRequest_cityName_idx" ON "CityRequest"("cityName");

-- CreateIndex
CREATE INDEX "CityRequest_createdAt_idx" ON "CityRequest"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "CityRequest_userId_cityName_key" ON "CityRequest"("userId", "cityName");

-- AddForeignKey
ALTER TABLE "CityRequest" ADD CONSTRAINT "CityRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
