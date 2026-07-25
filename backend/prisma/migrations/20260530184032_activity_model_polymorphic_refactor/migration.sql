/*
  Warnings:

  - You are about to drop the column `announcementId` on the `Activity` table. All the data in the column will be lost.
  - You are about to drop the column `paymentId` on the `Activity` table. All the data in the column will be lost.
  - You are about to drop the column `ticketId` on the `Activity` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `Activity` table. All the data in the column will be lost.
  - Added the required column `entityId` to the `Activity` table without a default value. This is not possible if the table is not empty.
  - Added the required column `entityType` to the `Activity` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "EntityType" AS ENUM ('USER', 'TICKET', 'PAYMENT', 'INVOICE', 'VISITOR_PASS', 'ANNOUNCEMENT', 'SECURITY_LOG', 'RESIDENT_ASSIGNMENT', 'PROPERTY', 'UNIT');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "ActivityEvent" ADD VALUE 'USER_LOGIN';
ALTER TYPE "ActivityEvent" ADD VALUE 'PASSWORD_CHANGED';
ALTER TYPE "ActivityEvent" ADD VALUE 'PASSWORD_RESET';
ALTER TYPE "ActivityEvent" ADD VALUE 'SECURITY_ALERT';
ALTER TYPE "ActivityEvent" ADD VALUE 'USER_CREATED';
ALTER TYPE "ActivityEvent" ADD VALUE 'USER_UPDATED';
ALTER TYPE "ActivityEvent" ADD VALUE 'RESIDENT_ASSIGNED';
ALTER TYPE "ActivityEvent" ADD VALUE 'RESIDENT_UNASSIGNED';
ALTER TYPE "ActivityEvent" ADD VALUE 'INVOICE_GENERATED';
ALTER TYPE "ActivityEvent" ADD VALUE 'INVOICE_PUBLISHED';
ALTER TYPE "ActivityEvent" ADD VALUE 'INVOICE_ITEM_MODIFIED';
ALTER TYPE "ActivityEvent" ADD VALUE 'PAYMENT_FAILED';
ALTER TYPE "ActivityEvent" ADD VALUE 'PAYMENT_REFUNDED';
ALTER TYPE "ActivityEvent" ADD VALUE 'TICKET_UPDATED';
ALTER TYPE "ActivityEvent" ADD VALUE 'VISITOR_PASS_CREATED';
ALTER TYPE "ActivityEvent" ADD VALUE 'VISITOR_PASS_USED';
ALTER TYPE "ActivityEvent" ADD VALUE 'VISITOR_PASS_REVOKED';
ALTER TYPE "ActivityEvent" ADD VALUE 'ANNOUNCEMENT_UPDATED';
ALTER TYPE "ActivityEvent" ADD VALUE 'ANNOUNCEMENT_DELETED';

-- DropForeignKey
ALTER TABLE "Activity" DROP CONSTRAINT "Activity_announcementId_fkey";

-- DropForeignKey
ALTER TABLE "Activity" DROP CONSTRAINT "Activity_paymentId_fkey";

-- DropForeignKey
ALTER TABLE "Activity" DROP CONSTRAINT "Activity_ticketId_fkey";

-- DropForeignKey
ALTER TABLE "Activity" DROP CONSTRAINT "Activity_userId_fkey";

-- AlterTable
ALTER TABLE "Activity" DROP COLUMN "announcementId",
DROP COLUMN "paymentId",
DROP COLUMN "ticketId",
DROP COLUMN "userId",
ADD COLUMN     "entityId" TEXT NOT NULL,
ADD COLUMN     "entityType" "EntityType" NOT NULL;

-- CreateIndex
CREATE INDEX "Activity_entityType_entityId_idx" ON "Activity"("entityType", "entityId");
