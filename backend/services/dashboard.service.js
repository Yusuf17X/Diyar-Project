import pkg from "@prisma/client";
const { Prisma } = pkg;
import prisma from "../utils/prisma.js";

export const getSummary = async (scopeFilter = {}) => {
  const now = new Date();

  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfNextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  const startOfSixMonthsAgo = new Date(
    now.getFullYear(),
    now.getMonth() - 5,
    1,
  );

  const currentDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  const propertyScope = scopeFilter.propertyId
    ? { propertyId: scopeFilter.propertyId }
    : {};

  const [
    totalResidents,
    pendingMaintenanceTickets,
    collectedRevenue,
    unpaidInvoices,
    recentActivities,
    groupCounts,
    monthlyRevenueRows,
  ] = await Promise.all([
    prisma.user.count({
      where: {
        role: "RESIDENT",
        status: "ACTIVE",
        ...propertyScope,
      },
    }),
    prisma.maintenanceTicket.count({
      where: {
        status: { in: ["SUBMITTED", "IN_PROGRESS"] },
        ...propertyScope,
      },
    }),
    prisma.payment.aggregate({
      _sum: { amount: true },
      where: {
        paidAt: {
          gte: startOfMonth,
          lt: startOfNextMonth,
        },
        ...(scopeFilter.propertyId
          ? { invoice: { propertyId: scopeFilter.propertyId } }
          : {}),
      },
    }),
    prisma.invoice.count({
      where: {
        status: "ISSUED",
        ...propertyScope,
      },
    }),
    prisma.activity.findMany({
      where: {
        createdAt: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        },
        ...propertyScope,
      },
      orderBy: { createdAt: "desc" },
      take: 5,
      include: {
        property: true,
        actor: true,
        targetUser: true,
      },
    }),
    prisma.unit.groupBy({
      by: ["status"],
      where: propertyScope,
      _count: {
        _all: true,
      },
    }),
    prisma.$queryRaw`
      SELECT DATE_TRUNC('month', p."paid_at") AS month,
             COALESCE(SUM(p."amount"), 0) AS total
      FROM "payments" p
      INNER JOIN "invoices" i ON i."id" = p."invoice_id"
      WHERE p."paid_at" IS NOT NULL
        AND p."paid_at" >= ${startOfSixMonthsAgo}
        AND p."paid_at" < ${startOfNextMonth}
        ${
          scopeFilter.propertyId
            ? Prisma.sql`AND i."property_id" = ${scopeFilter.propertyId}`
            : Prisma.sql``
        }
      GROUP BY 1
      ORDER BY 1
    `,
  ]);

  const formatMonth = (date) =>
    `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
  const revenueByMonth = new Map(
    monthlyRevenueRows.map((row) => [
      formatMonth(row.month),
      Number(row.total) || 0,
    ]),
  );
  const revenueTrend = [];
  for (let i = 5; i >= 0; i -= 1) {
    const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthKey = formatMonth(monthDate);
    revenueTrend.push({
      month: monthKey,
      total: revenueByMonth.get(monthKey) || 0,
    });
  }

  const counts = {
    OCCUPIED: 0,
    VACANT: 0,
    MAINTENANCE: 0,
    total: 0,
  };

  groupCounts.forEach((group) => {
    const count = group._count._all;
    counts[group.status] = count;
    counts.total += count;
  });

  const unitsOccupiedCount = counts.OCCUPIED;
  const unitsVacantCount = counts.VACANT;
  const unitsUnderMaintenanceCount = counts.MAINTENANCE;
  const totalUnitsCount = counts.total;

  const unitsSummary = {
    occupied: unitsOccupiedCount,
    vacant: unitsVacantCount,
    underMaintenance: unitsUnderMaintenanceCount,
    total: totalUnitsCount,
  };

  const recentActivitiesFormatted = recentActivities.map((activity) => ({
    id: activity.id,
    type: activity.event,
    message: activity.message || null,
    actor: activity.actor
      ? { id: activity.actor.id, name: activity.actor.name }
      : null,
  }));

  return {
    currentDate,
    totalResidents,
    pendingMaintenanceTickets,
    collectedRevenue: collectedRevenue._sum.amount || 0,
    unpaidInvoices,
    unitsSummary,
    revenueTrend,
    recentActivities: recentActivitiesFormatted,
  };
};

export const getBillingSummary = async (scopeFilter = {}) => {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const propertyScope = scopeFilter.propertyId
    ? { propertyId: scopeFilter.propertyId }
    : {};

  const [paymentsResult, invoiceGroups, recentInvoices] = await Promise.all([
    prisma.payment.aggregate({
      where: {
        paidAt: {
          gte: startOfMonth,
          lt: now,
        },
        ...(scopeFilter.propertyId
          ? { invoice: { propertyId: scopeFilter.propertyId } }
          : {}),
      },
      _sum: {
        amount: true,
      },
    }),
    prisma.invoice.groupBy({
      by: ["status"],
      where: {
        ...propertyScope,
        status: {
          in: ["ISSUED", "OVERDUE"],
        },
      },
      _count: {
        _all: true,
      },
      _sum: {
        total: true,
        paid: true,
      },
    }),
    prisma.invoice.findMany({
      where: {
        ...propertyScope,
      },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
  ]);

  const totalRevenue = paymentsResult._sum.amount || 0;

  let overdueInvoices = 0;
  let outstandingBalance = 0;

  invoiceGroups.forEach((group) => {
    if (group.status === "OVERDUE") {
      overdueInvoices = group._count._all;
    }

    const total = group._sum.total || 0;
    const paid = group._sum.paid || 0;
    outstandingBalance += total - paid;
  });

  if (outstandingBalance < 0) {
    outstandingBalance = 0;
  }

  return {
    totalRevenue,
    overdueInvoices,
    outstandingBalance,
    recentInvoices,
  };
};

const calculateAverageResolutionTime = (tickets) => {
  if (tickets.length === 0) return 0;

  const durations = tickets.map((ticket) => {
    return ticket.resolvedAt.getTime() - ticket.createdAt.getTime();
  });

  const averageMs =
    durations.reduce((sum, value) => sum + value, 0) / durations.length;

  const averageDays = averageMs / (1000 * 60 * 60 * 24);

  return averageDays;
};

export const getMaintenanceTrends = async (scopeFilter = {}) => {
  const propertyScope = scopeFilter.propertyId
    ? { propertyId: scopeFilter.propertyId }
    : {};

  const pendingRequests = await prisma.maintenanceTicket.count({
    where: {
      status: {
        in: ["SUBMITTED", "IN_PROGRESS"],
      },
      ...propertyScope,
    },
  });

  const resolvedRequestsThisMonth = await prisma.maintenanceTicket.count({
    where: {
      status: "RESOLVED",
      createdAt: {
        gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      },
      ...propertyScope,
    },
  });

  const tickets = await prisma.maintenanceTicket.findMany({
    where: {
      status: "RESOLVED",
      resolvedAt: {
        not: null,
      },
      ...propertyScope,
    },

    select: {
      createdAt: true,
      resolvedAt: true,
    },
  });

  const averageDays = calculateAverageResolutionTime(tickets);

  const maintenanceRequests = await prisma.maintenanceTicket.findMany({
    where: {
      createdAt: {
        gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      },
      ...propertyScope,
    },
    orderBy: { createdAt: "desc" },
    take: 10,
  });

  return {
    pending: pendingRequests,
    resolved: resolvedRequestsThisMonth,
    averageResolutionTimeDays: averageDays,
    maintenanceRequests,
  };
};
