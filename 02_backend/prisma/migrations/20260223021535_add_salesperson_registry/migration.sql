-- AlterTable
ALTER TABLE "Customer" ADD COLUMN     "registrySalespersonId" TEXT;

-- CreateTable
CREATE TABLE "Salesperson" (
    "id" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Salesperson_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Salesperson_isActive_idx" ON "Salesperson"("isActive");

-- CreateIndex
CREATE INDEX "Customer_registrySalespersonId_idx" ON "Customer"("registrySalespersonId");

-- AddForeignKey
ALTER TABLE "Customer" ADD CONSTRAINT "Customer_registrySalespersonId_fkey" FOREIGN KEY ("registrySalespersonId") REFERENCES "Salesperson"("id") ON DELETE SET NULL ON UPDATE CASCADE;
