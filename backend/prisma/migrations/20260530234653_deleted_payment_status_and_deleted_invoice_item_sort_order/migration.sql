/*
  Warnings:

  - You are about to drop the column `sortOrder` on the `InvoiceItem` table. All the data in the column will be lost.
  - You are about to drop the column `status` on the `Payment` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "InvoiceItem" DROP COLUMN "sortOrder";

-- AlterTable
ALTER TABLE "Payment" DROP COLUMN "status";

-- DropEnum
DROP TYPE "PaymentStatus";
