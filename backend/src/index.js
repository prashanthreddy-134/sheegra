import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import * as Sentry from "@sentry/node";

// ============================================================
// SENTRY
// ============================================================

if (process.env.SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment:
      process.env.NODE_ENV || "development",
  });

  console.log(
    "Sentry error monitoring enabled."
  );
}

// ============================================================
// ENVIRONMENT VALIDATION
// ============================================================

if (
  !process.env.JWT_SECRET ||
  process.env.JWT_SECRET.length < 16
) {
  console.error(
    "FATAL: JWT_SECRET is missing or too short. Set a long random value in .env before starting the server."
  );

  process.exit(1);
}

if (
  process.env.NODE_ENV === "production" &&
  (!process.env.RAZORPAY_KEY_SECRET ||
    process.env.RAZORPAY_KEY_SECRET.includes(
      "placeholder"
    ))
) {
  console.error(
    "FATAL: RAZORPAY_KEY_SECRET looks like a placeholder. Set real Razorpay keys before running in production."
  );

  process.exit(1);
}

if (
  process.env.NODE_ENV === "production" &&
  process.env.OTP_PROVIDER === "console"
) {
  console.error(
    "FATAL: OTP_PROVIDER is set to 'console' (dev-only, prints OTPs to logs). Set msg91 or twilio before running in production."
  );

  process.exit(1);
}

// ============================================================
// ROUTES
// ============================================================

import authRoutes from "./routes/auth.js";
import catalogRoutes from "./routes/catalog.js";
import cartRoutes from "./routes/cart.js";
import accountRoutes from "./routes/account.js";
import orderRoutes from "./routes/orders.js";
import paymentRoutes, {
  webhookRouter,
} from "./routes/payments.js";
import adminRoutes from "./routes/admin.js";
import uploadRoutes from "./routes/upload.js";
import devicesRoutes from "./routes/devices.js";
import couponRoutes from "./routes/coupons.js";

import {
  startStaleReservationSweep,
} from "./jobs/staleReservationSweep.js";

// ============================================================
// APP
// ============================================================

const app = express();

console.log(
  "🔥 Sheegra BACKEND VERSION: 2026-08-28-COUPON-SYNC"
);

// ============================================================
// SECURITY
// ============================================================

app.use(
  helmet({
    crossOriginResourcePolicy: {
      policy: "cross-origin",
    },
  })
);

// ============================================================
// LOGGING
// ============================================================

app.use(
  morgan(
    process.env.NODE_ENV === "production"
      ? "combined"
      : "dev"
  )
);

// ============================================================
// CORS
// ============================================================

const allowedOrigins = (
  process.env.CORS_ORIGINS || ""
)
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

app.use(
  cors({
    origin:
      allowedOrigins.length
        ? allowedOrigins
        : true,
    credentials: true,
  })
);

// ============================================================
// RATE LIMIT
// ============================================================

app.use(
  "/api",
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 300,
    standardHeaders: true,
    legacyHeaders: false,
  })
);

// ============================================================
// RAZORPAY WEBHOOK
// ============================================================
//
// IMPORTANT:
// Webhook must receive the raw request body before
// express.json() processes requests.
//

app.use(
  "/api/payments/webhook",
  express.raw({
    type: "application/json",
  }),
  webhookRouter
);

// ============================================================
// JSON BODY PARSER
// ============================================================

app.use(
  express.json({
    limit: "2mb",
  })
);

// ============================================================
// BASIC SERVICE ROUTES
// ============================================================

app.get("/", (req, res) => {
  res.json({
    message:
      "Sheegra API is running",
    status: "ok",
  });
});

app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    time: new Date().toISOString(),
  });
});

// ============================================================
// API ROUTES
// ============================================================

// Authentication
app.use(
  "/api/auth",
  authRoutes
);

// Catalog
app.use(
  "/api",
  catalogRoutes
);

// Cart
app.use(
  "/api",
  cartRoutes
);

// Account
app.use(
  "/api",
  accountRoutes
);

// Orders
app.use(
  "/api",
  orderRoutes
);

// Payments
app.use(
  "/api",
  paymentRoutes
);

// ============================================================
// CUSTOMER COUPONS
// ============================================================
//
// Admin manages coupons using:
//
// GET    /api/admin/coupons
// POST   /api/admin/coupons
// PATCH  /api/admin/coupons/:id
// DELETE /api/admin/coupons/:id
//
// Customer reads active/eligible coupons using:
//
// GET    /api/coupons
//
// Both use the same Prisma Coupon table.
//

app.use(
  "/api/coupons",
  couponRoutes
);

// ============================================================
// ADMIN
// ============================================================

app.use(
  "/api/admin",
  adminRoutes
);

// Uploads
app.use(
  "/api",
  uploadRoutes
);

// Devices / Push Tokens
app.use(
  "/api",
  devicesRoutes
);

// ============================================================
// STATIC UPLOADS
// ============================================================

app.use(
  "/uploads",
  express.static("uploads")
);

// ============================================================
// CENTRAL ERROR HANDLER
// ============================================================

app.use(
  (err, req, res, next) => {
    console.error(err);

    if (process.env.SENTRY_DSN) {
      Sentry.captureException(err);
    }

    res
      .status(err.status || 500)
      .json({
        error:
          process.env.NODE_ENV ===
          "production"
            ? "Internal server error"
            : err.message,
      });
  }
);

// ============================================================
// SERVER
// ============================================================

const PORT =
  process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log(
    `Sheegra API running on port ${PORT}`
  );

  startStaleReservationSweep();
});

// ============================================================
// PROCESS ERROR HANDLERS
// ============================================================

process.on(
  "unhandledRejection",
  (err) => {
    console.error(
      "Unhandled promise rejection:",
      err
    );

    if (process.env.SENTRY_DSN) {
      Sentry.captureException(err);
    }
  }
);

process.on(
  "uncaughtException",
  (err) => {
    console.error(
      "Uncaught exception:",
      err
    );

    if (process.env.SENTRY_DSN) {
      Sentry.captureException(err);
    }
  }
);