/*
  Warnings:

  - Added the required column `propertyId` to the `InvoiceItem` table without a default value. This is not possible if the table is not empty.
  - Added the required column `type` to the `InvoiceItem` table without a default value. This is not possible if the table is not empty.
  - Added the required column `unitId` to the `InvoiceItem` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "InvoiceItemType" AS ENUM ('RENT', 'WATER', 'ELECTRICITY', 'SERVICE_CHARGE', 'OTHER');

-- AlterTable
ALTER TABLE "InvoiceItem" ADD COLUMN     "propertyId" TEXT NOT NULL,
ADD COLUMN     "type" "InvoiceItemType" NOT NULL,
ADD COLUMN     "unitId" TEXT NOT NULL,
ALTER COLUMN "invoiceId" DROP NOT NULL,
ALTER COLUMN "billingPeriod" SET DATA TYPE TEXT;

-- CreateIndex
CREATE INDEX "InvoiceItem_propertyId_unitId_billingPeriod_idx" ON "InvoiceItem"("propertyId", "unitId", "billingPeriod");

-- AddForeignKey
ALTER TABLE "InvoiceItem" ADD CONSTRAINT "InvoiceItem_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InvoiceItem" ADD CONSTRAINT "InvoiceItem_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "Unit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
