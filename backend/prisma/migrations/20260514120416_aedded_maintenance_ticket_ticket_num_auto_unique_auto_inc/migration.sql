/*
  Warnings:

  - A unique constraint covering the columns `[ticketNumber]` on the table `MaintenanceTicket` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
CREATE SEQUENCE maintenanceticket_ticketnumber_seq;
ALTER TABLE "MaintenanceTicket" ALTER COLUMN "ticketNumber" SET DEFAULT nextval('maintenanceticket_ticketnumber_seq');
ALTER SEQUENCE maintenanceticket_ticketnumber_seq OWNED BY "MaintenanceTicket"."ticketNumber";

-- CreateIndex
CREATE UNIQUE INDEX "MaintenanceTicket_ticketNumber_key" ON "MaintenanceTicket"("ticketNumber");
