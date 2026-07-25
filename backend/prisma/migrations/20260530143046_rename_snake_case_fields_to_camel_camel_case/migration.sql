/*
  Warnings:

  - You are about to drop the column `created_at` on the `Payment` table. All the data in the column will be lost.
  - You are about to drop the column `paid_at` on the `Payment` table. All the data in the column will be lost.
  - You are about to drop the column `stripe_payment_intent_id` on the `Payment` table. All the data in the column will be lost.
  - You are about to drop the column `stripe_session_id` on the `Payment` table. All the data in the column will be lost.
  - You are about to drop the column `created_at` on the `Property` table. All the data in the column will be lost.
  - You are about to drop the column `updated_at` on the `Property` table. All the data in the column will be lost.
  - You are about to drop the column `occupancy_type` on the `ResidentUnitAssignment` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[stripeSessionId]` on the table `Payment` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[stripePaymentIntentId]` on the table `Payment` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `updatedAt` to the `Property` table without a default value. This is not possible if the table is not empty.
  - Added the required column `occupancyType` to the `ResidentUnitAssignment` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "Payment_stripe_payment_intent_id_key";

-- DropIndex
DROP INDEX "Payment_stripe_session_id_key";

-- AlterTable
ALTER TABLE "Payment" RENAME COLUMN "created_at" TO "createdAt";
ALTER TABLE "Payment" RENAME COLUMN "paid_at" TO "paidAt";
ALTER TABLE "Payment" RENAME COLUMN "stripe_payment_intent_id" TO "stripePaymentIntentId";
ALTER TABLE "Payment" RENAME COLUMN "stripe_session_id" TO "stripeSessionId";

-- AlterTable
ALTER TABLE "Property" RENAME COLUMN "created_at" TO "createdAt";
ALTER TABLE "Property" RENAME COLUMN "updated_at" TO "updatedAt";

-- AlterTable
ALTER TABLE "ResidentUnitAssignment" RENAME COLUMN "occupancy_type" TO "occupancyType";

-- CreateIndex
CREATE UNIQUE INDEX "Payment_stripeSessionId_key" ON "Payment"("stripeSessionId");

-- CreateIndex
CREATE UNIQUE INDEX "Payment_stripePaymentIntentId_key" ON "Payment"("stripePaymentIntentId");
