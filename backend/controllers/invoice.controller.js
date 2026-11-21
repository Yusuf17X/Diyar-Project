import prisma from "../utils/prisma.js";
import AppError from "../utils/appError.js";
import catchAsync from "../utils/catchAsync.js";
import * as factory from "./handlerFactory.js";
import sendSMS from "../utils/sms.js";

export const getAllInvoices = factory.getAll("invoice");
export const getInvoice = factory.getOne("invoice");
const writableInvoiceFields = [
  "propertyId",
  "userId",
  "unitId",
  "invoiceNumber",
  "billingPeriod",
  "issueDate",
  "dueDate",
  "status",
  "subtotal",
  "previousBalance",
  "total",
];

export const createInvoice = factory.createOne("invoice", {
  allowedFields: writableInvoiceFields,
});
export const updateInvoice = factory.updateOne("invoice", {
  allowedFields: writableInvoiceFields,
});
export const deleteInvoice = factory.deleteOne("invoice");

export const publishAllDraftInvoices = catchAsync(async (req, res, next) => {
  const propertyFilter =
    req.user.role === "SUPER_ADMIN" ? {} : { propertyId: req.user.propertyId };

  // 1. Get all draft invoices (with user phone details) before updating
  const draftInvoices = await prisma.invoice.findMany({
    where: { status: "DRAFT", ...propertyFilter },
    include: { user: { select: { name: true, phone: true } } },
  });

  if (draftInvoices.length === 0) {
    return res.status(200).json({
      status: "success",
      message: "No draft invoices to publish.",
    });
  }

  // 2. Publish them all
  const { count } = await prisma.invoice.updateMany({
    where: { status: "DRAFT", ...propertyFilter },
    data: { status: "ISSUED" },
  });

  // 3. Return success response immediately (dont make the admin wait for SMS network calls)
  res.status(200).json({
    status: "success",
    message: `${count} draft invoices have been published successfully.`,
  });

  // 4. Send SMS to users post-response
  draftInvoices.forEach((invoice) => {
    if (invoice.user?.phone) {
      sendSMS({
        to: invoice.user.phone,
        message: `Hello ${invoice.user.name}, your invoice #${invoice.invoiceNumber} for ${invoice.billingPeriod} has been issued. Total due: ${invoice.total}. Please check your portal.`,
      });
    }
  });
});

export const addInvoiceItem = catchAsync(async (req, res, next) => {
  const { id: invoiceId } = req.params;
  const { type, label, amount } = req.body;

  if (!type || !label || amount === undefined) {
    return next(new AppError("Please provide type, label, and amount", 400));
  }

  const invoice = await prisma.invoice.findUnique({
    where: { id: invoiceId },
  });

  if (!invoice) {
    return next(new AppError("Invoice not found", 404));
  }

  if (invoice.status !== "DRAFT") {
    return next(new AppError("Only DRAFT invoices can be modified", 400));
  }

  const [newItem, updatedInvoice] = await prisma.$transaction(async (tx) => {
    // 1. Create the new InvoiceItem
    const createdItem = await tx.invoiceItem.create({
      data: {
        invoiceId,
        propertyId: invoice.propertyId,
        unitId: invoice.unitId,
        billingPeriod: invoice.billingPeriod,
        type,
        label,
        amount,
      },
    });

    // 2. Recalculate totals
    const allItems = await tx.invoiceItem.findMany({
      where: { invoiceId },
    });

    const newSubtotal = allItems.reduce((sum, item) => sum + item.amount, 0);
    const newTotal = newSubtotal + invoice.previousBalance;

    // 3. Update the Invoice
    const updatedInv = await tx.invoice.update({
      where: { id: invoiceId },
      data: {
        subtotal: newSubtotal,
        total: newTotal,
      },
      include: { invoiceItems: true },
    });

    return [createdItem, updatedInv];
  });

  res.status(200).json({
    status: "success",
    data: {
      invoice: updatedInvoice,
    },
  });
});

export const removeInvoiceItem = catchAsync(async (req, res, next) => {
  const { id: invoiceId, itemId } = req.params;

  const invoice = await prisma.invoice.findUnique({
    where: { id: invoiceId },
  });

  if (!invoice) {
    return next(new AppError("Invoice not found", 404));
  }

  if (invoice.status !== "DRAFT") {
    return next(new AppError("Only DRAFT invoices can be modified", 400));
  }

  const item = await prisma.invoiceItem.findUnique({
    where: { id: itemId },
  });

  if (!item || item.invoiceId !== invoiceId) {
    return next(new AppError("Invoice item not found on this invoice", 404));
  }

  const updatedInvoice = await prisma.$transaction(async (tx) => {
    // 1. Delete the item
    await tx.invoiceItem.delete({
      where: { id: itemId },
    });

    // 2. Recalculate totals
    const allItems = await tx.invoiceItem.findMany({
      where: { invoiceId },
    });

    const newSubtotal = allItems.reduce((sum, item) => sum + item.amount, 0);
    const newTotal = newSubtotal + invoice.previousBalance;

    // 3. Update the Invoice
    return await tx.invoice.update({
      where: { id: invoiceId },
      data: {
        subtotal: newSubtotal,
        total: newTotal,
      },
      include: { invoiceItems: true },
    });
  });

  res.status(200).json({
    status: "success",
    data: {
      invoice: updatedInvoice,
    },
  });
});
