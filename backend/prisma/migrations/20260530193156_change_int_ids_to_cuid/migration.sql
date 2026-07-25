/*
  Warnings:

  - The primary key for the `InvoiceItem` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `MaintenanceTicket` table will be changed. If it partially fails, the table could be left without primary key constraint.

*/
-- AlterTable
ALTER TABLE "InvoiceItem" DROP CONSTRAINT "InvoiceItem_pkey",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ADD CONSTRAINT "InvoiceItem_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "InvoiceItem_id_seq";

-- AlterTable
ALTER TABLE "MaintenanceTicket" DROP CONSTRAINT "MaintenanceTicket_pkey",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ADD CONSTRAINT "MaintenanceTicket_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "MaintenanceTicket_id_seq";
