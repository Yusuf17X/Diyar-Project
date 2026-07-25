-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "ActivityEvent" ADD VALUE 'USER_DELETED';
ALTER TYPE "ActivityEvent" ADD VALUE 'RESIDENT_ASSIGNMENT_CREATED';
ALTER TYPE "ActivityEvent" ADD VALUE 'RESIDENT_ASSIGNMENT_UPDATED';
ALTER TYPE "ActivityEvent" ADD VALUE 'RESIDENT_ASSIGNMENT_DELETED';
ALTER TYPE "ActivityEvent" ADD VALUE 'INVOICE_CREATED';
ALTER TYPE "ActivityEvent" ADD VALUE 'INVOICE_UPDATED';
ALTER TYPE "ActivityEvent" ADD VALUE 'INVOICE_DELETED';
ALTER TYPE "ActivityEvent" ADD VALUE 'PAYMENT_CREATED';
ALTER TYPE "ActivityEvent" ADD VALUE 'PAYMENT_UPDATED';
ALTER TYPE "ActivityEvent" ADD VALUE 'PAYMENT_DELETED';
ALTER TYPE "ActivityEvent" ADD VALUE 'TICKET_DELETED';
ALTER TYPE "ActivityEvent" ADD VALUE 'VISITOR_PASS_UPDATED';
ALTER TYPE "ActivityEvent" ADD VALUE 'VISITOR_PASS_DELETED';
ALTER TYPE "ActivityEvent" ADD VALUE 'UNIT_UPDATED';
ALTER TYPE "ActivityEvent" ADD VALUE 'PROPERTY_CREATED';
ALTER TYPE "ActivityEvent" ADD VALUE 'PROPERTY_UPDATED';
ALTER TYPE "ActivityEvent" ADD VALUE 'PROPERTY_DELETED';
ALTER TYPE "ActivityEvent" ADD VALUE 'SECURITY_LOG_CREATED';
ALTER TYPE "ActivityEvent" ADD VALUE 'SECURITY_LOG_UPDATED';
ALTER TYPE "ActivityEvent" ADD VALUE 'SECURITY_LOG_DELETED';

-- RenameForeignKey
ALTER TABLE "Activity" RENAME CONSTRAINT "Activity_actorId_fkey" TO "activities_actor_id_fkey";

-- RenameForeignKey
ALTER TABLE "Activity" RENAME CONSTRAINT "Activity_propertyId_fkey" TO "activities_property_id_fkey";

-- RenameForeignKey
ALTER TABLE "Announcement" RENAME CONSTRAINT "Announcement_createdByUserId_fkey" TO "announcements_created_by_user_id_fkey";

-- RenameForeignKey
ALTER TABLE "Announcement" RENAME CONSTRAINT "Announcement_propertyId_fkey" TO "announcements_property_id_fkey";

-- RenameForeignKey
ALTER TABLE "InvoiceItem" RENAME CONSTRAINT "InvoiceItem_invoiceId_fkey" TO "invoice_items_invoice_id_fkey";

-- RenameForeignKey
ALTER TABLE "InvoiceItem" RENAME CONSTRAINT "InvoiceItem_propertyId_fkey" TO "invoice_items_property_id_fkey";

-- RenameForeignKey
ALTER TABLE "InvoiceItem" RENAME CONSTRAINT "InvoiceItem_unitId_fkey" TO "invoice_items_unit_id_fkey";

-- RenameForeignKey
ALTER TABLE "Invoice" RENAME CONSTRAINT "Invoice_propertyId_fkey" TO "invoices_property_id_fkey";

-- RenameForeignKey
ALTER TABLE "Invoice" RENAME CONSTRAINT "Invoice_unitId_fkey" TO "invoices_unit_id_fkey";

-- RenameForeignKey
ALTER TABLE "Invoice" RENAME CONSTRAINT "Invoice_userId_fkey" TO "invoices_user_id_fkey";

-- RenameForeignKey
ALTER TABLE "MaintenanceTicket" RENAME CONSTRAINT "MaintenanceTicket_assignedToId_fkey" TO "maintenance_tickets_assigned_to_id_fkey";

-- RenameForeignKey
ALTER TABLE "MaintenanceTicket" RENAME CONSTRAINT "MaintenanceTicket_propertyId_fkey" TO "maintenance_tickets_property_id_fkey";

-- RenameForeignKey
ALTER TABLE "MaintenanceTicket" RENAME CONSTRAINT "MaintenanceTicket_unitId_fkey" TO "maintenance_tickets_unit_id_fkey";

-- RenameForeignKey
ALTER TABLE "MaintenanceTicket" RENAME CONSTRAINT "MaintenanceTicket_userId_fkey" TO "maintenance_tickets_user_id_fkey";

-- RenameForeignKey
ALTER TABLE "Payment" RENAME CONSTRAINT "Payment_invoiceId_fkey" TO "payments_invoice_id_fkey";

-- RenameForeignKey
ALTER TABLE "ResidentUnitAssignment" RENAME CONSTRAINT "ResidentUnitAssignment_propertyId_fkey" TO "resident_unit_assignments_property_id_fkey";

-- RenameForeignKey
ALTER TABLE "ResidentUnitAssignment" RENAME CONSTRAINT "ResidentUnitAssignment_unitId_fkey" TO "resident_unit_assignments_unit_id_fkey";

-- RenameForeignKey
ALTER TABLE "ResidentUnitAssignment" RENAME CONSTRAINT "ResidentUnitAssignment_userId_fkey" TO "resident_unit_assignments_user_id_fkey";

-- RenameForeignKey
ALTER TABLE "SecurityLog" RENAME CONSTRAINT "SecurityLog_actorId_fkey" TO "security_logs_actor_id_fkey";

-- RenameForeignKey
ALTER TABLE "SecurityLog" RENAME CONSTRAINT "SecurityLog_passId_fkey" TO "security_logs_pass_id_fkey";

-- RenameForeignKey
ALTER TABLE "SecurityLog" RENAME CONSTRAINT "SecurityLog_propertyId_fkey" TO "security_logs_property_id_fkey";

-- RenameForeignKey
ALTER TABLE "Unit" RENAME CONSTRAINT "Unit_propertyId_fkey" TO "units_property_id_fkey";

-- RenameForeignKey
ALTER TABLE "User" RENAME CONSTRAINT "User_propertyId_fkey" TO "users_property_id_fkey";

-- RenameForeignKey
ALTER TABLE "VisitorPass" RENAME CONSTRAINT "VisitorPass_propertyId_fkey" TO "visitor_passes_property_id_fkey";

-- RenameForeignKey
ALTER TABLE "VisitorPass" RENAME CONSTRAINT "VisitorPass_unitId_fkey" TO "visitor_passes_unit_id_fkey";

-- RenameForeignKey
ALTER TABLE "VisitorPass" RENAME CONSTRAINT "VisitorPass_userId_fkey" TO "visitor_passes_user_id_fkey";

-- RenameIndex
ALTER INDEX "Invoice_propertyId_invoiceNumber_key" RENAME TO "invoices_property_id_invoice_number_key";

-- RenameIndex
ALTER INDEX "Invoice_propertyId_userId_unitId_billingPeriod_key" RENAME TO "invoices_property_id_user_id_unit_id_billing_period_key";

-- RenameIndex
ALTER INDEX "MaintenanceTicket_propertyId_ticketNumber_key" RENAME TO "maintenance_tickets_property_id_ticket_number_key";

-- RenameIndex
ALTER INDEX "MaintenanceTicket_ticketNumber_key" RENAME TO "maintenance_tickets_ticket_number_key";

-- RenameIndex
ALTER INDEX "Payment_stripePaymentIntentId_key" RENAME TO "payments_stripe_payment_intent_id_key";

-- RenameIndex
ALTER INDEX "Payment_stripeSessionId_key" RENAME TO "payments_stripe_session_id_key";

-- RenameIndex
ALTER INDEX "ResidentUnitAssignment_userId_unitId_startsAt_key" RENAME TO "resident_unit_assignments_user_id_unit_id_starts_at_key";

-- RenameIndex
ALTER INDEX "Unit_propertyId_code_key" RENAME TO "units_property_id_code_key";

-- RenameIndex
ALTER INDEX "User_email_key" RENAME TO "users_email_key";

-- RenameIndex
ALTER INDEX "User_propertyId_email_key" RENAME TO "users_property_id_email_key";

-- RenameIndex
ALTER INDEX "VisitorPass_qrPayload_key" RENAME TO "visitor_passes_qr_payload_key";
