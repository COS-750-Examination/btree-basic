-- AlterTable
ALTER TABLE "LeafTransaction" ADD COLUMN     "dedupeKey" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "LeafTransaction_userId_dedupeKey_key" ON "LeafTransaction"("userId", "dedupeKey");

