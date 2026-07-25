import "dotenv/config";

// For sync errors like using undefined variable
process.on("uncaughtException", (err) => {
  console.log(`Unhandled Exception! 💥 Shutting down...`);
  console.log(err.name, err.message);
  process.exit(1);
});

import app from "./app.js";
import prisma from "./utils/prisma.js";

const server = app.listen(3000, () => {
  console.log("Started listening...");
});

// For async errors like failed auth to the db
process.on("unhandledRejection", (err) => {
  console.log(`Unhandled Rejection! 💥 Shutting down...`);
  console.log(err.name, err.message);
  server.close(() => {
    process.exit(1);
  });
});

process.on("SIGINT", async () => {
  console.log("SIGINT received. Closing DB...");
  await prisma.$disconnect();

  process.exit(0);
});
