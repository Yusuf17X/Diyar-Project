import "dotenv/config";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import prisma from "../utils/prisma.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ─── Constants ───────────────────────────────────────────────────────
const DEFAULT_START_INVOICE_NUMBER = 1000;

// ─── Date / Period Helpers ───────────────────────────────────────────
const formatBillingPeriod = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
};

const parseBillingPeriod = (value) => {
  if (!value) return null;
  const match = value.match(/^(\d{4})-(0[1-9]|1[0-2])$/);
  return match ? value : null;
};

const getPeriodStart = (billingPeriod) => {
  const [year, month] = billingPeriod.split("-").map(Number);
  return new Date(year, month - 1, 1, 0, 0, 0, 0);
};

const getPeriodEnd = (billingPeriod) => {
  const [year, month] = billingPeriod.split("-").map(Number);
  return new Date(year, month, 0, 23, 59, 59, 999);
};

// ─── CLI Args ────────────────────────────────────────────────────────
const parseArgs = () => {
  const args = process.argv.slice(2);
  const options = { billingPeriod: null };

  for (const arg of args) {
    if (arg.startsWith("--period=")) {
      options.billingPeriod = arg.replace("--period=", "").trim();
    }
  }

  return options;
};

// ─── Step 1: Read and Validate the JSON File ─────────────────────────
const loadInvoiceItemsFile = (billingPeriod) => {
  const filePath = path.resolve(
    __dirname,
    "..",
    "dev-data",
    `invoice-items-${billingPeriod}.json`,
  );

  if (!fs.existsSync(filePath)) {
    throw new Error(
      `Invoice items file not found: ${filePath}\n` +
      `Expected file: invoice-items-${billingPeriod}.json in dev-data/`,
    );
  }

  const raw = fs.readFileSync(filePath, "utf-8");
  const data = JSON.parse(raw);

  if (data.billingPeriod !== billingPeriod) {
    throw new Error(
      `Billing period mismatch: file says "${data.billingPeriod}" but expected "${billingPeriod}".`,
    );
  }

  return data;
};

// ─── Step 2: Resolve Names → IDs ────────────────────────────────────
const resolvePropertyAndUnitIds = async (fileData) => {
  const propertyNames = fileData.properties.map((p) => p.propertyName);

  const properties = await prisma.property.findMany({
    where: { name: { in: propertyNames } },
    include: { units: { select: { id: true, code: true } } },
  });

  const propertyMap = new Map();
  for (const property of properties) {
    const unitMap = new Map();
    for (const unit of property.units) {
      unitMap.set(unit.code, unit.id);
    }
    propertyMap.set(property.name, { id: property.id, units: unitMap });
  }

  // Validate that every property/unit in the file actually exists in DB
  const errors = [];
  for (const prop of fileData.properties) {
    const resolved = propertyMap.get(prop.propertyName);
    if (!resolved) {
      errors.push(`Property not found in DB: "${prop.propertyName}"`);
      continue;
    }
    for (const unit of prop.units) {
      if (!resolved.units.has(unit.unitCode)) {
        errors.push(
          `Unit "${unit.unitCode}" not found in property "${prop.propertyName}"`,
        );
      }
    }
  }

  if (errors.length > 0) {
    throw new Error(
      `Resolution errors:\n${errors.map((e) => `  - ${e}`).join("\n")}`,
    );
  }

  return propertyMap;
};

// ─── Step 3: Import InvoiceItems (invoiceId = null) ──────────────────
const importInvoiceItems = async (fileData, propertyMap, billingPeriod) => {
  let importedCount = 0;
  let skippedCount = 0;

  for (const prop of fileData.properties) {
    const { id: propertyId, units: unitMap } = propertyMap.get(
      prop.propertyName,
    );

    for (const unit of prop.units) {
      const unitId = unitMap.get(unit.unitCode);

      // Check if items already exist for this unit + period (prevent double-import)
      const existingItems = await prisma.invoiceItem.count({
        where: { propertyId, unitId, billingPeriod },
      });

      if (existingItems > 0) {
        console.log(
          `  ⏭  Skipping ${unit.unitCode} — ${existingItems} items already exist for ${billingPeriod}`,
        );
        skippedCount += unit.items.length;
        continue;
      }

      // Insert all items for this unit
      const itemsToCreate = unit.items.map((item) => ({
        propertyId,
        unitId,
        type: item.type,
        label: item.label,
        amount: item.amount,
        billingPeriod,
        // invoiceId is left null — will be linked in Step 4
      }));

      await prisma.invoiceItem.createMany({ data: itemsToCreate });
      importedCount += itemsToCreate.length;

      console.log(
        `  ✓  ${unit.unitCode} — imported ${itemsToCreate.length} items`,
      );
    }
  }

  return { importedCount, skippedCount };
};

// ─── Step 4: Auto-Generate Invoices from Un-Invoiced Items ───────────
const findBillingResponsibleResident = async (propertyId, unitId) => {
  const assignment = await prisma.residentUnitAssignment.findFirst({
    where: {
      propertyId,
      unitId,
      isCurrent: true,
      isBillingResponsible: true,
      user: { status: "ACTIVE", role: "RESIDENT" },
    },
    select: { userId: true },
  });

  return assignment?.userId || null;
};

const getOutstandingBalance = async (
  propertyId,
  userId,
  unitId,
  periodStart,
) => {
  const invoices = await prisma.invoice.findMany({
    where: {
      propertyId,
      userId,
      unitId,
      issueDate: { lt: periodStart },
      status: { in: ["ISSUED", "OVERDUE"] },
    },
    select: { total: true, paid: true },
  });

  let balance = 0;
  for (const inv of invoices) {
    const outstanding = inv.total - inv.paid;
    if (outstanding > 0) balance += outstanding;
  }

  return balance;
};

const getNextInvoiceNumber = async (tx, propertyId) => {
  const result = await tx.invoice.aggregate({
    where: { propertyId },
    _max: { invoiceNumber: true },
  });

  const maxNumber = result._max.invoiceNumber || 0;
  return Math.max(DEFAULT_START_INVOICE_NUMBER, maxNumber + 1);
};

const generateInvoices = async (billingPeriod) => {
  const now = new Date();
  const periodStart = getPeriodStart(billingPeriod);
  const periodEnd = getPeriodEnd(billingPeriod);
  const issueDate = now < periodStart ? periodStart : now;
  const dueDate = periodEnd;

  let createdCount = 0;
  let skippedNoResident = 0;
  let skippedExisting = 0;

  // Find all distinct (propertyId, unitId) combos that have un-invoiced items
  const uninvoicedGroups = await prisma.invoiceItem.groupBy({
    by: ["propertyId", "unitId"],
    where: {
      billingPeriod,
      invoiceId: null,
    },
  });

  if (uninvoicedGroups.length === 0) {
    console.log("  No un-invoiced items found — nothing to generate.");
    return { createdCount, skippedNoResident, skippedExisting };
  }

  // Process each unit group inside a transaction per property
  // Group by property first for invoice number allocation
  const byProperty = new Map();
  for (const group of uninvoicedGroups) {
    if (!byProperty.has(group.propertyId)) {
      byProperty.set(group.propertyId, []);
    }
    byProperty.get(group.propertyId).push(group.unitId);
  }

  for (const [propertyId, unitIds] of byProperty) {
    await prisma.$transaction(
      async (tx) => {
        // Lock the property row to prevent concurrent invoice number conflicts
        await tx.$queryRaw`
          SELECT id FROM "properties" WHERE id = ${propertyId} FOR UPDATE
        `;

        let nextNumber = await getNextInvoiceNumber(tx, propertyId);

        for (const unitId of unitIds) {
          const userId = await findBillingResponsibleResident(
            propertyId,
            unitId,
          );

          if (!userId) {
            console.log(
              `  ⚠  No billing-responsible resident for unit (property: ${propertyId}, unit: ${unitId}) — skipped`,
            );
            skippedNoResident += 1;
            continue;
          }

          // Check if an invoice already exists for this exact combo + period
          const existing = await tx.invoice.findFirst({
            where: { propertyId, userId, unitId, billingPeriod },
            select: { id: true },
          });

          if (existing) {
            // Link any orphan items to the existing invoice
            await tx.invoiceItem.updateMany({
              where: { propertyId, unitId, billingPeriod, invoiceId: null },
              data: { invoiceId: existing.id },
            });
            console.log(
              `  ⏭  Invoice already exists for unit ${unitId} — linked orphan items`,
            );
            skippedExisting += 1;
            continue;
          }

          // Fetch the actual items to calculate totals
          const items = await tx.invoiceItem.findMany({
            where: { propertyId, unitId, billingPeriod, invoiceId: null },
            orderBy: { createdAt: "asc" },
          });

          if (items.length === 0) continue;

          const subtotal = items.reduce((sum, item) => sum + item.amount, 0);
          const previousBalance = await getOutstandingBalance(
            propertyId,
            userId,
            unitId,
            periodStart,
          );
          const total = subtotal + previousBalance;
          const invoiceNumber = nextNumber;
          nextNumber += 1;

          // Create the invoice
          const invoice = await tx.invoice.create({
            data: {
              propertyId,
              userId,
              unitId,
              invoiceNumber,
              billingPeriod,
              issueDate,
              dueDate,
              status: "DRAFT",
              subtotal,
              previousBalance,
              total,
              paid: 0,
            },
          });

          // Link items to the newly created invoice
          await tx.invoiceItem.updateMany({
            where: {
              id: { in: items.map((item) => item.id) },
            },
            data: { invoiceId: invoice.id },
          });

          createdCount += 1;
          console.log(
            `  ✓  Invoice #${invoiceNumber} created for unit ${unitId} — ` +
            `subtotal: ${subtotal}, balance: ${previousBalance}, total: ${total}`,
          );
        }
      },
      { isolationLevel: "Serializable" },
    );
  }

  return { createdCount, skippedNoResident, skippedExisting };
};

// ─── Step 5: Mark Overdue Invoices ───────────────────────────────────
const markOverdueInvoices = async (now) => {
  const overdueCandidates = await prisma.invoice.findMany({
    where: {
      status: "ISSUED",
      dueDate: { lt: now },
    },
    select: { id: true, paid: true, total: true },
  });

  const overdueIds = overdueCandidates
    .filter((inv) => inv.paid < inv.total)
    .map((inv) => inv.id);

  if (overdueIds.length === 0) return 0;

  await prisma.invoice.updateMany({
    where: { id: { in: overdueIds } },
    data: { status: "OVERDUE" },
  });

  return overdueIds.length;
};

// ─── Main ────────────────────────────────────────────────────────────
const main = async () => {
  const { billingPeriod: billingPeriodArg } = parseArgs();
  const now = new Date();

  const parsedPeriod = parseBillingPeriod(billingPeriodArg);
  if (billingPeriodArg && !parsedPeriod) {
    throw new Error("Invalid billing period. Expected YYYY-MM format.");
  }

  const billingPeriod = parsedPeriod || formatBillingPeriod(now);

  console.log("═══════════════════════════════════════════════════════");
  console.log(`  Monthly Invoice Generation v1 — ${billingPeriod}`);
  console.log("═══════════════════════════════════════════════════════\n");

  // Step 1: Load the JSON file
  console.log("Step 1 → Loading invoice items file...");
  const fileData = loadInvoiceItemsFile(billingPeriod);
  const totalUnits = fileData.properties.reduce(
    (sum, p) => sum + p.units.length,
    0,
  );
  console.log(
    `  Found ${fileData.properties.length} properties, ${totalUnits} units\n`,
  );

  // Step 2: Resolve property/unit names to database IDs
  console.log("Step 2 → Resolving property & unit IDs...");
  const propertyMap = await resolvePropertyAndUnitIds(fileData);
  console.log(`  All properties and units resolved ✓\n`);

  // Step 3: Import invoice items into DB
  console.log("Step 3 → Importing invoice items...");
  const { importedCount, skippedCount } = await importInvoiceItems(
    fileData,
    propertyMap,
    billingPeriod,
  );
  console.log(
    `  Imported: ${importedCount} items | Skipped: ${skippedCount} (already exist)\n`,
  );

  // Step 4: Auto-generate invoices from un-invoiced items
  console.log("Step 4 → Generating invoices...");
  const { createdCount, skippedNoResident, skippedExisting } =
    await generateInvoices(billingPeriod);
  console.log(
    `  Created: ${createdCount} invoices | ` +
    `No resident: ${skippedNoResident} | Already existed: ${skippedExisting}\n`,
  );

  // Step 5: Mark overdue invoices
  console.log("Step 5 → Checking for overdue invoices...");
  const overdueCount = await markOverdueInvoices(now);
  console.log(`  Marked ${overdueCount} invoices as OVERDUE\n`);

  // Summary
  console.log("═══════════════════════════════════════════════════════");
  console.log("  Summary");
  console.log("═══════════════════════════════════════════════════════");
  console.log(`  Period:            ${billingPeriod}`);
  console.log(`  Items imported:    ${importedCount}`);
  console.log(`  Items skipped:     ${skippedCount}`);
  console.log(`  Invoices created:  ${createdCount}`);
  console.log(`  Invoices skipped:  ${skippedExisting} (already exist)`);
  console.log(`  No resident:       ${skippedNoResident}`);
  console.log(`  Marked overdue:    ${overdueCount}`);
  console.log("═══════════════════════════════════════════════════════\n");
};

main()
  .catch((error) => {
    console.error("\n✖  Fatal error:", error.message || error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
