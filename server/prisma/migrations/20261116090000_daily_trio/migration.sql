DELETE FROM "DailyRun";

ALTER TABLE "DailyRun" DROP COLUMN "hints",
DROP COLUMN "mistakes",
DROP COLUMN "moves",
DROP COLUMN "penaltyMs",
DROP COLUMN "timeMs",
ADD COLUMN     "pathKeys" INTEGER[],
ADD COLUMN     "seed" INTEGER NOT NULL,
ADD COLUMN     "validKeys" INTEGER[];

CREATE TABLE "DailyRound" (
    "id" TEXT NOT NULL,
    "runId" TEXT NOT NULL,
    "round" INTEGER NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finishedAt" TIMESTAMP(3),
    "moves" INTEGER,
    "mistakes" INTEGER,
    "hints" INTEGER,
    "timeMs" INTEGER,
    "penaltyMs" INTEGER,
    "score" DOUBLE PRECISION,

    CONSTRAINT "DailyRound_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "DailyRound_runId_round_key" ON "DailyRound"("runId", "round");

ALTER TABLE "DailyRound" ADD CONSTRAINT "DailyRound_runId_fkey" FOREIGN KEY ("runId") REFERENCES "DailyRun"("id") ON DELETE CASCADE ON UPDATE CASCADE;

