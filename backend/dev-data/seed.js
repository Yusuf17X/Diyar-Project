import "dotenv/config";
import pkg from "@prisma/client";
const { PrismaClient } = pkg;
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const { PrismaPg } = require("@prisma/adapter-pg");
import bcrypt from "bcryptjs";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});
const prisma = new PrismaClient({ adapter });

async function resetData() {
  // Wipe in dependency order to avoid foreign key conflicts.
  await prisma.$transaction([
    prisma.securityLog.deleteMany(),
    prisma.payment.deleteMany(),
    prisma.invoiceItem.deleteMany(),
    prisma.invoice.deleteMany(),
    prisma.maintenanceTicket.deleteMany(),
    prisma.announcement.deleteMany(),
    prisma.visitorPass.deleteMany(),
    prisma.residentUnitAssignment.deleteMany(),
    prisma.unit.deleteMany(),
    prisma.user.deleteMany(),
    prisma.property.deleteMany(),
  ]);
}

async function main() {
  await resetData();

  const passwordHash = await bcrypt.hash("Password123!", 12);
  const addDays = (date, days) => new Date(date.getTime() + days * 86400000);
  const slugify = (value) =>
    value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, ".")
      .replace(/^\.|\.$/g, "");

  let phoneCounter = 1;
  const nextPhone = () => `+2010000${String(phoneCounter++).padStart(4, "0")}`;

  const propertyConfigs = [
    {
      name: "Palm Heights",
      slug: "palm",
      adminName: "Diyar Admin",
      units: [
        { code: "A-101", status: "OCCUPIED" },
        { code: "A-102", status: "OCCUPIED" },
        { code: "A-201", status: "OCCUPIED" },
        { code: "B-202", status: "OCCUPIED" },
        { code: "B-203", status: "VACANT" },
        { code: "B-204", status: "MAINTENANCE" },
      ],
      residents: [
        { name: "Maha Ali", occupancy: "TENANT", billing: true },
        { name: "Omar Hassan", occupancy: "OWNER", billing: false },
        { name: "Laila Nader", occupancy: "FAMILY_MEMBER", billing: false },
        { name: "Youssef Adel", occupancy: "TENANT", billing: true },
        { name: "Hana Sami", occupancy: "TENANT", billing: false },
        { name: "Karim Said", occupancy: "OWNER", billing: true },
      ],
    },
    {
      name: "Cedar Point",
      slug: "cedar",
      adminName: "Cedar Supervisor",
      units: [
        { code: "C-101", status: "OCCUPIED" },
        { code: "C-102", status: "OCCUPIED" },
        { code: "C-201", status: "OCCUPIED" },
        { code: "C-202", status: "OCCUPIED" },
        { code: "C-203", status: "VACANT" },
        { code: "C-301", status: "OCCUPIED" },
      ],
      residents: [
        { name: "Nour Khaled", occupancy: "TENANT", billing: true },
        { name: "Salma Hany", occupancy: "OWNER", billing: true },
        { name: "Hossam Emad", occupancy: "TENANT", billing: false },
        { name: "Rania Sherif", occupancy: "TENANT", billing: true },
        { name: "Tamer Fathy", occupancy: "OWNER", billing: false },
        { name: "Sara Mostafa", occupancy: "FAMILY_MEMBER", billing: false },
      ],
    },
    {
      name: "Nile Vista",
      slug: "nile",
      adminName: "Nile Manager",
      units: [
        { code: "N-101", status: "OCCUPIED" },
        { code: "N-102", status: "OCCUPIED" },
        { code: "N-103", status: "OCCUPIED" },
        { code: "N-201", status: "OCCUPIED" },
        { code: "N-202", status: "VACANT" },
        { code: "N-203", status: "OCCUPIED" },
      ],
      residents: [
        { name: "Amr Helmy", occupancy: "TENANT", billing: true },
        { name: "Reem Osama", occupancy: "OWNER", billing: true },
        { name: "Mona Said", occupancy: "TENANT", billing: false },
        { name: "Ahmed Nabil", occupancy: "TENANT", billing: true },
        { name: "Dina Tarek", occupancy: "FAMILY_MEMBER", billing: false },
      ],
    },
    {
      name: "Orchid Gardens",
      slug: "orchid",
      adminName: "Orchid Admin",
      units: [
        { code: "O-101", status: "OCCUPIED" },
        { code: "O-102", status: "OCCUPIED" },
        { code: "O-103", status: "VACANT" },
        { code: "O-201", status: "OCCUPIED" },
        { code: "O-202", status: "MAINTENANCE" },
      ],
      residents: [
        { name: "Miriam Fawzy", occupancy: "OWNER", billing: true },
        { name: "Khaled Ibrahim", occupancy: "TENANT", billing: true },
        { name: "Dalia Hammad", occupancy: "FAMILY_MEMBER", billing: false },
        { name: "Samer Lotfy", occupancy: "TENANT", billing: false },
        { name: "Ramy Gabr", occupancy: "PROPERTY_MANAGER", billing: false },
      ],
    },
    {
      name: "Sphinx Residences",
      slug: "sphinx",
      adminName: "Sphinx Supervisor",
      units: [
        { code: "S-01", status: "OCCUPIED" },
        { code: "S-02", status: "OCCUPIED" },
        { code: "S-03", status: "OCCUPIED" },
        { code: "S-04", status: "VACANT" },
        { code: "S-05", status: "OCCUPIED" },
      ],
      residents: [
        { name: "Heba Magdy", occupancy: "TENANT", billing: true },
        { name: "Mahmoud Farouk", occupancy: "OWNER", billing: true },
        { name: "Nadia Selim", occupancy: "FAMILY_MEMBER", billing: false },
        { name: "Ibrahim Youssef", occupancy: "TENANT", billing: false },
        { name: "Maya Kamel", occupancy: "TENANT", billing: true },
      ],
    },
  ];

  const announcementTemplates = [
    {
      title: "Community Town Hall",
      category: "GENERAL",
      message: "Monthly town hall scheduled in the main lobby.",
    },
    {
      title: "Planned Maintenance Notice",
      category: "MAINTENANCE",
      message: "Water shutdown for line inspection on Saturday morning.",
    },
    {
      title: "Weekend Event",
      category: "EVENT",
      message: "Family movie night in the courtyard starts at 7 PM.",
    },
  ];

  const ticketTemplates = [
    {
      title: "Air conditioner not cooling",
      category: "HVAC",
      priority: "HIGH",
      description: "Unit AC is running but not cooling the room.",
    },
    {
      title: "Hallway light flickering",
      category: "ELECTRICAL",
      priority: "LOW",
      description: "Light near the elevator intermittently flickers.",
    },
    {
      title: "Dishwasher leak",
      category: "APPLIANCE",
      priority: "MEDIUM",
      description: "Water pooling under the dishwasher after cycles.",
    },
  ];

  const billingPeriods = ["2026-04", "2026-05", "2026-06"];
  const baseIssueDate = new Date("2026-04-28T12:00:00.000Z");
  const baseStartDate = new Date("2026-03-05T08:00:00.000Z");

  for (let pIndex = 0; pIndex < propertyConfigs.length; pIndex += 1) {
    const config = propertyConfigs[pIndex];
    const property = await prisma.property.create({
      data: {
        name: config.name,
      },
    });

    const admin = await prisma.user.create({
      data: {
        name: config.adminName,
        role: "ADMIN",
        email: `admin.${config.slug}@diyar.local`,
        password: passwordHash,
        phone: nextPhone(),
        status: "ACTIVE",
        propertyId: property.id,
      },
    });

    // record activity for admin creation
    await prisma.activity.create({
      data: {
        propertyId: property.id,
        actorId: admin.id,
        event: "USER_CREATED",
        message: `Admin account created for ${admin.name}`,
        entityType: "USER",
        entityId: admin.id,
      },
    });

    const units = [];
    for (const unitInfo of config.units) {
      const unit = await prisma.unit.create({
        data: {
          propertyId: property.id,
          code: unitInfo.code,
          occupancyStatus: unitInfo.status,
        },
      });
      units.push(unit);
    }

    const residents = [];
    for (const residentInfo of config.residents) {
      const resident = await prisma.user.create({
        data: {
          name: residentInfo.name,
          role: "RESIDENT",
          email: `${slugify(residentInfo.name)}.${config.slug}@diyar.local`,
          password: passwordHash,
          phone: nextPhone(),
          status: "ACTIVE",
          propertyId: property.id,
        },
      });
      residents.push({
        user: resident,
        occupancy: residentInfo.occupancy,
        billing: residentInfo.billing,
      });
    }

    const assignmentByUserId = new Map();
    for (let i = 0; i < residents.length; i += 1) {
      const resident = residents[i];
      const unit = units[i % units.length];
      await prisma.residentUnitAssignment.create({
        data: {
          propertyId: property.id,
          userId: resident.user.id,
          unitId: unit.id,
          occupancyType: resident.occupancy,
          isBillingResponsible: resident.billing,
          startsAt: addDays(baseStartDate, pIndex * 20 + i * 3),
          isCurrent: true,
        },
      });
      assignmentByUserId.set(resident.user.id, unit.id);
    }

    for (let i = 0; i < announcementTemplates.length; i += 1) {
      const template = announcementTemplates[i];
      const publishAt = addDays(baseIssueDate, pIndex * 4 + i);
      await prisma.announcement.create({
        data: {
          propertyId: property.id,
          createdByUserId: admin.id,
          title: template.title,
          category: template.category,
          message: template.message,
          publishAt,
          expiresAt: addDays(publishAt, 7),
        },
      });
    }

    for (let i = 0; i < ticketTemplates.length; i += 1) {
      const template = ticketTemplates[i];
      const resident = residents[i % residents.length];
      await prisma.maintenanceTicket.create({
        data: {
          propertyId: property.id,
          ticketNumber: 500 + pIndex * 100 + i + 1,
          userId: resident.user.id,
          unitId: assignmentByUserId.get(resident.user.id),
          title: template.title,
          category: template.category,
          priority: template.priority,
          status: i === 0 ? "SUBMITTED" : i === 1 ? "IN_PROGRESS" : "RESOLVED",
          description: template.description,
          resolvedAt:
            i === 2 ? addDays(baseIssueDate, pIndex * 5 + i + 2) : null,
        },
      });
    }

    const invoiceTargets = residents.slice(0, 3);
    for (let i = 0; i < invoiceTargets.length; i += 1) {
      const target = invoiceTargets[i];
      const unitId = assignmentByUserId.get(target.user.id);
      const invoiceNumber = 1000 + pIndex * 100 + i + 1;
      const invoiceItems = [
        {
          type: "RENT",
          label: "Rent",
          amount: 120000 + i * 5000,
          propertyId: property.id,
          unitId,
          billingPeriod: "2026-04",
        },
        {
          type: "WATER",
          label: "Water Usage",
          amount: 15000 + i * 2000,
          propertyId: property.id,
          unitId,
          billingPeriod: "2026-04",
        },
        {
          type: "SERVICE_CHARGE",
          label: "Building Services",
          amount: 8000,
          propertyId: property.id,
          unitId,
          billingPeriod: "2026-04",
        },
      ];
      const subtotal = invoiceItems.reduce((sum, item) => sum + item.amount, 0);
      const total = subtotal;
      const issueDate = addDays(baseIssueDate, pIndex * 6 + i);
      const dueDate = addDays(issueDate, 10);
      const isPaid = i < 2;
      const invoice = await prisma.invoice.create({
        data: {
          propertyId: property.id,
          userId: target.user.id,
          unitId,
          invoiceNumber,
          billingPeriod: billingPeriods[i % billingPeriods.length],
          issueDate,
          dueDate,
          status: isPaid ? "PAID" : "ISSUED",
          subtotal,
          previousBalance: i === 2 ? 20000 : 0,
          total,
          paid: isPaid ? total : 0,
          invoiceItems: {
            create: invoiceItems,
          },
        },
      });

      if (isPaid) {
        await prisma.payment.create({
          data: {
            invoiceId: invoice.id,
            amount: total,
            method: i === 0 ? "CASH" : "CREDIT_CARD",
            paidAt: addDays(issueDate, 2),
            stripeSessionId:
              i !== 0 ? `cs_test_${config.slug}_${invoiceNumber}` : undefined,
          },
        });
      }
    }

    for (let i = 0; i < 2; i += 1) {
      const resident = residents[i % residents.length];
      const unitId = assignmentByUserId.get(resident.user.id);
      const visitorPass = await prisma.visitorPass.create({
        data: {
          propertyId: property.id,
          userId: resident.user.id,
          unitId,
          guestName: i === 0 ? "Samir Nasser" : "Lina Farid",
          visitDate: addDays(baseIssueDate, pIndex * 7 + i + 2),
          purpose: i === 0 ? "Family visit" : "Delivery",
          qrPayload: `pass-${config.slug}-${i + 1}`,
          status: "ACTIVE",
          expiresAt: addDays(new Date("2026-04-30T12:00:00Z"), 1),
        },
      });
      await prisma.securityLog.create({
        data: {
          propertyId: property.id,
          passId: visitorPass.id,
          actorId: admin.id,
          eventType: "ENTRY",
          details: "Visitor pass scanned at main gate.",
        },
      });

      await prisma.securityLog.create({
        data: {
          propertyId: property.id,
          passId: visitorPass.id,
          actorId: admin.id,
          eventType: "EXIT",
          details: "Visitor exited through north gate.",
        },
      });
    }

    await prisma.securityLog.create({
      data: {
        propertyId: property.id,
        actorId: admin.id,
        eventType: "DENIED",
        details: "Unknown vehicle denied entry at gate B.",
      },
    });
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
