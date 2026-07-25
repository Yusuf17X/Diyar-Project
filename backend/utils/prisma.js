import pkg from "@prisma/client";
const { PrismaClient } = pkg;
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const { PrismaPg } = require("@prisma/adapter-pg");

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});

// avoid multiple instances in dev
const globalForPrisma = globalThis;

/**
 * @type {import('@prisma/client').PrismaClient}
 */
const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({ adapter, omit: { user: { password: true } } });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

export default prisma;
