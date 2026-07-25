import prisma from "../utils/prisma.js";

export const getResidentOverview = async (req) => {
  const totalDue = await prisma.invoice.aggregate({
    where: {
      userId: req.user.id,
      status: { in: ["ISSUED", "OVERDUE"] },
    },
    _sum: {
      total: true,
    },
  });

  const activePasses = await prisma.visitorPass.count({
    where: {
      userId: req.user.id,
      status: "ACTIVE",
    },
  });

  const activeMaintenanceTickets = await prisma.maintenanceTicket.count({
    where: {
      userId: req.user.id,
      status: { in: ["SUBMITTED", "IN_PROGRESS"] },
    },
  });

  const lastAnnouncements = await prisma.announcement.findMany({
    orderBy: { createdAt: "desc" },
    take: 5,
  });

  return {
    totalDue: totalDue._sum.total || 0,
    activePasses,
    activeMaintenanceTickets,
    lastAnnouncements,
  };
};

export const getResidentInvoices = async (req) => {
  const currentDueInvoice = await prisma.invoice.aggregate({
    where: {
      userId: req.user.id,
      status: "ISSUED",
    },
    _sum: {
      total: true,
    },
  });

  const lastPayment = await prisma.payment.aggregate({
    where: {
      invoice: { userId: req.user.id },
    },
    _sum: {
      amount: true,
    },
  });

  const overdueAmount = await prisma.invoice.aggregate({
    where: {
      userId: req.user.id,
      status: "OVERDUE",
    },
    _sum: {
      total: true,
    },
  });

  const currentInvoice = await prisma.invoice.findFirst({
    where: {
      userId: req.user.id,
      status: "ISSUED",
    },
  });
  const currentInvoiceDetails = await prisma.invoiceItem.findFirst({
    where: {
      invoiceId: currentInvoice ? currentInvoice.id : null,
    },
  });

  const paymentHistory = await prisma.payment.findMany({
    where: {
      invoice: { userId: req.user.id },
    },
    orderBy: { createdAt: "desc" },
    take: 5,
    select: {
      createdAt: true,
      amount: true,
      paidAt: true,
    },
  });

  return {
    currentDue: currentDueInvoice._sum.total || 0,
    lastPayment: lastPayment._sum.amount || 0,
    overdueAmount: overdueAmount._sum.total || 0,
    currentInvoice,
    currentInvoiceDetails,
    paymentHistory,
  };
};
