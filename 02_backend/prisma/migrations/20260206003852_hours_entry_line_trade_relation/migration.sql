-- AlterTable
ALTER TABLE "HoursEntryLine" ADD COLUMN     "tradeId" TEXT;

-- CreateIndex
CREATE INDEX "HoursEntryLine_tradeId_idx" ON "HoursEntryLine"("tradeId");

-- AddForeignKey
ALTER TABLE "HoursEntryLine" ADD CONSTRAINT "HoursEntryLine_tradeId_fkey" FOREIGN KEY ("tradeId") REFERENCES "Trade"("id") ON DELETE SET NULL ON UPDATE CASCADE;
