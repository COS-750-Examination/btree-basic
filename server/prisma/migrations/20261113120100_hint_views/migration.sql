-- CreateTable
CREATE TABLE "HintView" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "hint" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HintView_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "HintView_userId_itemId_idx" ON "HintView"("userId", "itemId");

-- AddForeignKey
ALTER TABLE "HintView" ADD CONSTRAINT "HintView_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

