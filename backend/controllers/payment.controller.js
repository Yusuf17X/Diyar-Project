import Stripe from "stripe";
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

import prisma from "../utils/prisma.js";
import AppError from "../utils/appError.js";
import catchAsync from "../utils/catchAsync.js";
import auditEmitter from "../utils/auditEmitter.js";

export const createPaymentSession = catchAsync(async (req, res, next) => {
  const { invoiceId } = req.body;

  const invoice = await prisma.invoice.findUnique({
    where: { id: invoiceId },
  });

  if (!invoice) {
    return next(new AppError("Invoice not found", 404));
  }

  if (invoice.userId !== req.user.id) {
    return next(new AppError("Unauthorized to pay this invoice", 403));
  }

  if (invoice.status === "PAID") {
    return next(new AppError("Invoice already paid", 400));
  }

  if (invoice.status === "VOID" || invoice.status === "DRAFT") {
    return next(new AppError("Invoice cannot be paid", 400));
  }

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    payment_method_types: ["card"],
    success_url: `${req.protocol}://${req.get("host")}/payment-success?invoiceId=${invoice.id}`,
    cancel_url: `${req.protocol}://${req.get("host")}/`,
    customer_email: req.user.email,
    payment_intent_data: {
      metadata: {
        invoiceId: invoice.id,
      },
    },
    line_items: [
      {
        price_data: {
          currency: "usd",
          unit_amount: invoice.total,
          product_data: {
            name: `Invoice #${invoice.id}`,
          },
        },
        quantity: 1,
      },
    ],
  });

  res.status(200).json({
    status: "success",
    session,
  });
});

const createPaymentCheckout = async (event) => {
  const paymentIntent = event.data.object;

  const { invoiceId, stripeSessionId } = paymentIntent.metadata;

  const amount = paymentIntent.amount_received;

  if (amount <= 0) {
    throw new AppError("Invalid payment amount", 400);
  }

  const invoice = await prisma.invoice.findUnique({
    where: { id: invoiceId },
    select: { total: true },
  });

  if (!invoice) {
    throw new AppError("Invoice not found", 404);
  }

  if (invoice.total !== amount) {
    throw new AppError("Payment amount mismatch", 400);
  }

  await prisma.$transaction([
    prisma.payment.upsert({
      where: {
        stripePaymentIntentId: paymentIntent.id,
      },
      update: {},
      create: {
        invoiceId,
        amount,
        stripeSessionId: stripeSessionId || null,
        stripePaymentIntentId: paymentIntent.id,
        paidAt: new Date(),
      },
    }),

    prisma.invoice.updateMany({
      where: {
        id: invoiceId,
        status: { not: "PAID" },
      },
      data: {
        status: "PAID",
        paid: amount,
      },
    }),
  ]);
};

export const webhookCheckout = catchAsync(async (req, res, next) => {
  const signature = req.headers["stripe-signature"];

  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET,
    );
  } catch (err) {
    return res.status(400).send(`Webhook error: ${err.message}`);
  }

  if (event.type === "payment_intent.succeeded") {
    const paymentIntent = event.data.object;
    const invoiceId = paymentIntent?.metadata?.invoiceId;

    if (!invoiceId) {
      return next(
        new AppError("Missing invoiceId in payment intent metadata", 400),
      );
    }

    await createPaymentCheckout(event);
  }

  res.status(200).json({
    received: true,
  });
});

export const createCashPayment = catchAsync(async (req, res, next) => {
  const { invoiceId, amount } = req.body;

  if (!invoiceId || !amount) {
    return next(new AppError("invoiceId and amount are required", 400));
  }

  const invoice = await prisma.invoice.findUnique({
    where: { id: invoiceId },
  });

  if (!invoice) {
    return next(new AppError("Invoice not found!", 404));
  }

  if (
    req.user.role !== "SUPER_ADMIN" &&
    invoice.propertyId !== req.user.propertyId
  ) {
    return next(new AppError("Unauthorized to pay this invoice", 403));
  }

  if (invoice.status === "PAID") {
    return next(new AppError("This invoice is already paid!", 400));
  }

  if (["DRAFT", "VOID"].includes(invoice.status)) {
    return next(new AppError("This invoice can not be paid!", 400));
  }

  const outstandingBalance = invoice.total - invoice.paid;
  if (amount > outstandingBalance) {
    return next(
      new AppError(
        `Payment amount exceeds the outstanding balance (${outstandingBalance})`,
        400,
      ),
    );
  }

  const newPaidAmount = invoice.paid + amount;
  const newStatus = newPaidAmount >= invoice.total ? "PAID" : invoice.status;

  const [payment, updatedInvoice] = await prisma.$transaction([
    prisma.payment.create({
      data: {
        invoiceId,
        amount,
        method: "CASH",
        paidAt: new Date(),
      },
    }),
    prisma.invoice.update({
      where: { id: invoiceId },
      data: {
        status: newStatus,
        paid: { increment: amount },
      },
    }),
  ]);

  auditEmitter.emit("audit.log", {
    propertyId: invoice.propertyId,
    actorId: req.user.id,
    event: "PAYMENT_RECEIVED",
    entityType: "PAYMENT",
    entityId: payment.id,
    message: `Received CASH payment of ${amount} for invoice #${invoice.invoiceNumber}.`,
  });

  res.status(200).json({
    status: "success",
    data: {
      payment,
      invoice: updatedInvoice,
    },
  });
});
