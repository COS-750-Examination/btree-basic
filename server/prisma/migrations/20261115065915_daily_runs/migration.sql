-- CreateTable
CREATE TABLE "DailyRun" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "day" TEXT NOT NULL,
    "keys" INTEGER[],
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finishedAt" TIMESTAMP(3),
    "score" INTEGER,
    "correct" INTEGER,
    "total" INTEGER,
    "timeMs" INTEGER,

    CONSTRAINT "DailyRun_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DailyRun_day_idx" ON "DailyRun"("day");

-- CreateIndex
CREATE UNIQUE INDEX "DailyRun_userId_day_key" ON "DailyRun"("userId", "day");

-- AddForeignKey
ALTER TABLE "DailyRun" ADD CONSTRAINT "DailyRun_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
