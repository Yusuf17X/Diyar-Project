-- Rename tables from PascalCase to snake_case
ALTER TABLE IF EXISTS "User" RENAME TO "users";
ALTER TABLE IF EXISTS "Property" RENAME TO "properties";
ALTER TABLE IF EXISTS "Unit" RENAME TO "units";
ALTER TABLE IF EXISTS "ResidentUnitAssignment" RENAME TO "resident_unit_assignments";
ALTER TABLE IF EXISTS "Invoice" RENAME TO "invoices";
ALTER TABLE IF EXISTS "InvoiceItem" RENAME TO "invoice_items";
ALTER TABLE IF EXISTS "Payment" RENAME TO "payments";
ALTER TABLE IF EXISTS "MaintenanceTicket" RENAME TO "maintenance_tickets";
ALTER TABLE IF EXISTS "Announcement" RENAME TO "announcements";
ALTER TABLE IF EXISTS "VisitorPass" RENAME TO "visitor_passes";
ALTER TABLE IF EXISTS "SecurityLog" RENAME TO "security_logs";
ALTER TABLE IF EXISTS "Activity" RENAME TO "activities";

-- Rename columns in "users"
ALTER TABLE "users" RENAME COLUMN "fullName" TO "full_name";
ALTER TABLE "users" RENAME COLUMN "passwordChangedAt" TO "password_changed_at";
ALTER TABLE "users" RENAME COLUMN "passwordResetToken" TO "password_reset_token";
ALTER TABLE "users" RENAME COLUMN "passwordResetExpires" TO "password_reset_expires";
ALTER TABLE "users" RENAME COLUMN "emergencyContact" TO "emergency_contact";
ALTER TABLE "users" RENAME COLUMN "createdAt" TO "created_at";
ALTER TABLE "users" RENAME COLUMN "updatedAt" TO "updated_at";
ALTER TABLE "users" RENAME COLUMN "propertyId" TO "property_id";

-- Rename columns in "properties"
ALTER TABLE "properties" RENAME COLUMN "createdAt" TO "created_at";
ALTER TABLE "properties" RENAME COLUMN "updatedAt" TO "updated_at";

-- Rename columns in "units"
ALTER TABLE "units" RENAME COLUMN "propertyId" TO "property_id";
ALTER TABLE "units" RENAME COLUMN "occupancyStatus" TO "occupancy_status";
ALTER TABLE "units" RENAME COLUMN "createdAt" TO "created_at";
ALTER TABLE "units" RENAME COLUMN "updatedAt" TO "updated_at";

-- Rename columns in "resident_unit_assignments"
ALTER TABLE "resident_unit_assignments" RENAME COLUMN "propertyId" TO "property_id";
ALTER TABLE "resident_unit_assignments" RENAME COLUMN "userId" TO "user_id";
ALTER TABLE "resident_unit_assignments" RENAME COLUMN "unitId" TO "unit_id";
ALTER TABLE "resident_unit_assignments" RENAME COLUMN "occupancyType" TO "occupancy_type";
ALTER TABLE "resident_unit_assignments" RENAME COLUMN "isBillingResponsible" TO "is_billing_responsible";
ALTER TABLE "resident_unit_assignments" RENAME COLUMN "startsAt" TO "starts_at";
ALTER TABLE "resident_unit_assignments" RENAME COLUMN "endsAt" TO "ends_at";
ALTER TABLE "resident_unit_assignments" RENAME COLUMN "isCurrent" TO "is_current";
ALTER TABLE "resident_unit_assignments" RENAME COLUMN "createdAt" TO "created_at";
ALTER TABLE "resident_unit_assignments" RENAME COLUMN "updatedAt" TO "updated_at";

-- Rename columns in "invoices"
ALTER TABLE "invoices" RENAME COLUMN "propertyId" TO "property_id";
ALTER TABLE "invoices" RENAME COLUMN "userId" TO "user_id";
ALTER TABLE "invoices" RENAME COLUMN "unitId" TO "unit_id";
ALTER TABLE "invoices" RENAME COLUMN "invoiceNumber" TO "invoice_number";
ALTER TABLE "invoices" RENAME COLUMN "billingPeriod" TO "billing_period";
ALTER TABLE "invoices" RENAME COLUMN "issueDate" TO "issue_date";
ALTER TABLE "invoices" RENAME COLUMN "dueDate" TO "due_date";
ALTER TABLE "invoices" RENAME COLUMN "previousBalance" TO "previous_balance";
ALTER TABLE "invoices" RENAME COLUMN "createdAt" TO "created_at";
ALTER TABLE "invoices" RENAME COLUMN "updatedAt" TO "updated_at";

-- Rename columns in "invoice_items"
ALTER TABLE "invoice_items" RENAME COLUMN "invoiceId" TO "invoice_id";
ALTER TABLE "invoice_items" RENAME COLUMN "propertyId" TO "property_id";
ALTER TABLE "invoice_items" RENAME COLUMN "unitId" TO "unit_id";
ALTER TABLE "invoice_items" RENAME COLUMN "billingPeriod" TO "billing_period";
ALTER TABLE "invoice_items" RENAME COLUMN "createdAt" TO "created_at";

-- Rename columns in "payments"
ALTER TABLE "payments" RENAME COLUMN "invoiceId" TO "invoice_id";
ALTER TABLE "payments" RENAME COLUMN "stripeSessionId" TO "stripe_session_id";
ALTER TABLE "payments" RENAME COLUMN "stripePaymentIntentId" TO "stripe_payment_intent_id";
ALTER TABLE "payments" RENAME COLUMN "paidAt" TO "paid_at";
ALTER TABLE "payments" RENAME COLUMN "createdAt" TO "created_at";

-- Rename columns in "maintenance_tickets"
ALTER TABLE "maintenance_tickets" RENAME COLUMN "propertyId" TO "property_id";
ALTER TABLE "maintenance_tickets" RENAME COLUMN "ticketNumber" TO "ticket_number";
ALTER TABLE "maintenance_tickets" RENAME COLUMN "userId" TO "user_id";
ALTER TABLE "maintenance_tickets" RENAME COLUMN "unitId" TO "unit_id";
ALTER TABLE "maintenance_tickets" RENAME COLUMN "imageUrls" TO "image_urls";
ALTER TABLE "maintenance_tickets" RENAME COLUMN "assignedToId" TO "assigned_to_id";
ALTER TABLE "maintenance_tickets" RENAME COLUMN "resolvedAt" TO "resolved_at";
ALTER TABLE "maintenance_tickets" RENAME COLUMN "createdAt" TO "created_at";
ALTER TABLE "maintenance_tickets" RENAME COLUMN "updatedAt" TO "updated_at";

-- Rename columns in "announcements"
ALTER TABLE "announcements" RENAME COLUMN "propertyId" TO "property_id";
ALTER TABLE "announcements" RENAME COLUMN "createdByUserId" TO "created_by_user_id";
ALTER TABLE "announcements" RENAME COLUMN "publishAt" TO "publish_at";
ALTER TABLE "announcements" RENAME COLUMN "expiresAt" TO "expires_at";
ALTER TABLE "announcements" RENAME COLUMN "createdAt" TO "created_at";
ALTER TABLE "announcements" RENAME COLUMN "updatedAt" TO "updated_at";

-- Rename columns in "visitor_passes"
ALTER TABLE "visitor_passes" RENAME COLUMN "propertyId" TO "property_id";
ALTER TABLE "visitor_passes" RENAME COLUMN "userId" TO "user_id";
ALTER TABLE "visitor_passes" RENAME COLUMN "unitId" TO "unit_id";
ALTER TABLE "visitor_passes" RENAME COLUMN "guestName" TO "guest_name";
ALTER TABLE "visitor_passes" RENAME COLUMN "visitDate" TO "visit_date";
ALTER TABLE "visitor_passes" RENAME COLUMN "qrPayload" TO "qr_payload";
ALTER TABLE "visitor_passes" RENAME COLUMN "issuedAt" TO "issued_at";
ALTER TABLE "visitor_passes" RENAME COLUMN "usedAt" TO "used_at";
ALTER TABLE "visitor_passes" RENAME COLUMN "expiresAt" TO "expires_at";
ALTER TABLE "visitor_passes" RENAME COLUMN "revokedAt" TO "revoked_at";
ALTER TABLE "visitor_passes" RENAME COLUMN "createdAt" TO "created_at";
ALTER TABLE "visitor_passes" RENAME COLUMN "updatedAt" TO "updated_at";

-- Rename columns in "security_logs"
ALTER TABLE "security_logs" RENAME COLUMN "propertyId" TO "property_id";
ALTER TABLE "security_logs" RENAME COLUMN "passId" TO "pass_id";
ALTER TABLE "security_logs" RENAME COLUMN "actorId" TO "actor_id";
ALTER TABLE "security_logs" RENAME COLUMN "eventType" TO "event_type";
ALTER TABLE "security_logs" RENAME COLUMN "occurredAt" TO "occurred_at";

-- Rename columns in "activities"
ALTER TABLE "activities" RENAME COLUMN "propertyId" TO "property_id";
ALTER TABLE "activities" RENAME COLUMN "actorId" TO "actor_id";
ALTER TABLE "activities" RENAME COLUMN "entityType" TO "entity_type";
ALTER TABLE "activities" RENAME COLUMN "entityId" TO "entity_id";
ALTER TABLE "activities" RENAME COLUMN "createdAt" TO "created_at";
