/*
  Warnings:

  - A unique constraint covering the columns `[stripe_payment_intent_id]` on the table `Payment` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterEnum
ALTER TYPE "InvoiceStatus" ADD VALUE 'VOID';

-- AlterTable
ALTER TABLE "Payment" ADD COLUMN     "stripe_payment_intent_id" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Payment_stripe_payment_intent_id_key" ON "Payment"("stripe_payment_intent_id");
