/*
  Warnings:

  - You are about to drop the column `gateway_txn_ref` on the `Payment` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "Payment_gateway_txn_ref_key";

-- AlterTable
ALTER TABLE "Payment" DROP COLUMN "gateway_txn_ref";
