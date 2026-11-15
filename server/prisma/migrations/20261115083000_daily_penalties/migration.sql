ALTER TABLE "DailyRun" DROP COLUMN "correct",
DROP COLUMN "total",
ADD COLUMN     "hints" INTEGER,
ADD COLUMN     "mistakes" INTEGER,
ADD COLUMN     "moves" INTEGER,
ADD COLUMN     "penaltyMs" INTEGER;
