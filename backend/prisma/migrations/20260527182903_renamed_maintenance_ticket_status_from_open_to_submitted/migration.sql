/*
  Warnings:

  - The values [OPEN] on the enum `MaintenanceStatus` will be removed. If these variants are still used in the database, this will fail.
  - A unique constraint covering the columns `[propertyId,code]` on the table `Unit` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "MaintenanceStatus_new" AS ENUM ('SUBMITTED', 'IN_PROGRESS', 'RESOLVED', 'CANCELLED');
ALTER TABLE "public"."MaintenanceTicket" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "MaintenanceTicket" ALTER COLUMN "status" TYPE "MaintenanceStatus_new" USING ("status"::text::"MaintenanceStatus_new");
ALTER TYPE "MaintenanceStatus" RENAME TO "MaintenanceStatus_old";
ALTER TYPE "MaintenanceStatus_new" RENAME TO "MaintenanceStatus";
DROP TYPE "public"."MaintenanceStatus_old";
ALTER TABLE "MaintenanceTicket" ALTER COLUMN "status" SET DEFAULT 'SUBMITTED';
COMMIT;

-- AlterTable
ALTER TABLE "MaintenanceTicket" ALTER COLUMN "status" SET DEFAULT 'SUBMITTED';

-- CreateIndex
CREATE UNIQUE INDEX "Unit_propertyId_code_key" ON "Unit"("propertyId", "code");
