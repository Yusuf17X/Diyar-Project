import "dotenv/config";
import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import cors from "cors";
import hpp from "hpp";
import xssSanitizer from "./utils/xssSanitizer.js";

import AppError from "./utils/appError.js";
import globalErrorHandler from "./controllers/error.controller.js";

import userRouter from "./routes/user.routes.js";
import assignmentRouter from "./routes/assignment.routes.js";
import announcementRouter from "./routes/announcements.routes.js";
import visitorPassRouter from "./routes/visitorPass.routes.js";
import ticketRouter from "./routes/ticket.routes.js";
import invoiceRouter from "./routes/invoice.routes.js";
import paymentRouter from "./routes/payment.routes.js";
import propertyRouter from "./routes/property.routes.js";
import unitRouter from "./routes/unit.routes.js";
import dashboardRouter from "./routes/dashboard.routes.js";
import residentRouter from "./routes/resident.routes.js";
import securityLogRouter from "./routes/securityLog.routes.js";

import * as paymentController from "./controllers/payment.controller.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// 1. Set Security HTTP Headers
app.use(helmet());

// 2. CORS
app.use(cors());

// 3. Development Logging
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

// 3. Limit requests from same API
const globalLimiter = rateLimit({
  max: 100,
  windowMs: 60 * 60 * 1000,
  message: "Too many requests from this IP. Please try again in an hour!",
});
app.use("/api", globalLimiter);

app.post(
  "/webhook-checkout",
  // Use raw body parser for webhooks so signatures like stripe can be verified
  express.raw({ type: "application/json" }),
  paymentController.webhookCheckout,
);

// 4. Body parser, reading data from body into req.body
app.use(express.json({ limit: "10kb" }));

// 5. Data Sanitization against XSS (Cross-Site Scripting)
// This strips malicious HTML/JS tags from user input
app.use(xssSanitizer());

// 6. Prevent Parameter Pollution
app.use(hpp({ whitelist: [] }));

// Serve demo assets (JS, images, etc.)
app.use(express.static(path.join(__dirname, "public")));

// 7. Routes
app.use("/api/v1/users", userRouter);
app.use("/api/v1/assignments", assignmentRouter);
app.use("/api/v1/announcements", announcementRouter);
app.use("/api/v1/visitor-passes", visitorPassRouter);
app.use("/api/v1/tickets", ticketRouter);
app.use("/api/v1/invoices", invoiceRouter);
app.use("/api/v1/payments", paymentRouter);
app.use("/api/v1/properties", propertyRouter);
app.use("/api/v1/units", unitRouter);
app.use("/api/v1/dashboard", dashboardRouter);
app.use("/api/v1/resident", residentRouter);
app.use("/api/v1/security-logs", securityLogRouter);

app.get("/payment-success", (req, res) => {
  const invoiceId = req.query.invoiceId || "";

  res.status(200).send(`
    <html>
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Payment Successful</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: system-ui, -apple-system, sans-serif; display: flex; align-items: center; justify-content: center; min-height: 100vh; background: #f5f5f5; }
          .card { background: #fff; border-radius: 12px; box-shadow: 0 4px 24px rgba(0,0,0,0.1); padding: 48px; text-align: center; max-width: 480px; }
          .checkmark { width: 64px; height: 64px; background: #22c55e; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 24px; font-size: 32px; color: #fff; }
          h1 { font-size: 24px; margin-bottom: 8px; color: #1a1a1a; }
          p { color: #666; margin-bottom: 24px; line-height: 1.5; }
          a { display: inline-block; background: #1a1a1a; color: #fff; text-decoration: none; padding: 12px 32px; border-radius: 8px; font-weight: 500; }
          a:hover { background: #333; }
        </style>
      </head>
      <body>
        <div class="card">
          <div class="checkmark">${String.fromCharCode(10003)}</div>
          <h1>Payment Successful</h1>
          <p>Your payment for invoice <strong>${invoiceId ? `#${invoiceId.slice(0, 8)}` : ""}</strong> has been processed successfully.</p>
          <a href="/">Back to Home</a>
        </div>
      </body>
    </html>
  `);
});

// 8. Unhandled Routes (404)
app.use((req, res, next) => {
  next(new AppError(`Cant find ${req.originalUrl}`, 404));
});

// 9. Global Error Handling Middleware
app.use(globalErrorHandler);

export default app;
