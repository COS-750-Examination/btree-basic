ALTER TABLE "DailyRun" ALTER COLUMN "score" SET DATA TYPE DOUBLE PRECISION USING ("score"::double precision / 10);
