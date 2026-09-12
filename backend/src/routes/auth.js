import { Router } from "express";
import rateLimit from "express-rate-limit";
import { z } from "zod";

import { prisma } from "../prismaClient.js";
import { requestOtp, verifyOtp } from "../services/otpService.js";
import { signToken } from "../middleware/auth.js";

const router = Router();

// ============================================================
// RATE LIMITING
// ============================================================

// Prevent OTP bombing a phone number.
const otpRequestLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
});

// Prevent brute-forcing a 6-digit OTP.
const otpVerifyLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
});

// ============================================================
// VALIDATION
// ============================================================

const phoneSchema = z.object({
  phone: z
    .string()
    .trim()
    .regex(/^\+?[1-9]\d{9,14}$/, "Invalid phone number"),
});

const verifySchema = phoneSchema.extend({
  code: z
    .string()
    .trim()
    .length(6, "OTP must be 6 digits")
    .regex(/^\d{6}$/, "OTP must contain only numbers"),
});

const registrationSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Name must be at least 2 characters"),

  phone: z
    .string()
    .trim()
    .regex(/^\+?[1-9]\d{9,14}$/, "Invalid phone number"),
});

const registrationVerifySchema = registrationSchema.extend({
  code: z
    .string()
    .trim()
    .length(6, "OTP must be 6 digits")
    .regex(/^\d{6}$/, "OTP must contain only numbers"),
});

// ============================================================
// DEVELOPMENT LOGIN
// ============================================================
// Development-only emergency login.
// This is NOT used by the normal customer login flow.
//
// Existing customer only.
// Never creates a new account.
// Never enabled in production.
// ============================================================

router.post("/dev-login", async (req, res) => {
  if (process.env.NODE_ENV === "production") {
    return res.status(404).json({
      error: "Not found",
    });
  }

  const parsed = phoneSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({
      error: parsed.error.errors[0].message,
    });
  }

  const { phone } = parsed.data;

  const user = await prisma.user.findUnique({
    where: { phone },
  });

  // IMPORTANT:
  // Development login cannot create accounts.
  if (!user) {
    return res.status(404).json({
      error:
        "This mobile number is not registered. Please create an account first.",
    });
  }

  // Only customers can use customer login.
  if (user.role !== "CUSTOMER") {
    return res.status(403).json({
      error: "This account cannot use customer login.",
    });
  }

  if (!user.isActive) {
    return res.status(403).json({
      error: "Account disabled. Contact support.",
    });
  }

  const token = signToken(user);

  return res.json({
    token,
    user: {
      id: user.id,
      phone: user.phone,
      name: user.name,
      role: user.role,
    },
  });
});

// ============================================================
// CUSTOMER REGISTRATION - REQUEST OTP
// ============================================================
// PUBLIC ROUTE
// NO JWT REQUIRED.
//
// Flow:
//
// Name + Phone
//      ↓
// Check phone is not already registered
//      ↓
// Send REGISTER OTP
//      ↓
// User enters OTP
// ============================================================

router.post(
  "/register/otp/request",
  otpRequestLimiter,
  async (req, res) => {
    const parsed = registrationSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({
        error: parsed.error.errors[0].message,
      });
    }

    const { name, phone } = parsed.data;

    try {
      // Check whether phone already exists.
      const existingUser = await prisma.user.findUnique({
        where: { phone },
      });

      if (existingUser) {
        // Never allow an admin/staff number to be
        // registered as a customer.
        if (existingUser.role !== "CUSTOMER") {
          return res.status(403).json({
            error:
              "This phone number is already registered for an admin account.",
          });
        }

        return res.status(409).json({
          error:
            "This mobile number is already registered. Please log in instead.",
        });
      }

      // Name is validated here.
      //
      // The name is sent again by the frontend when
      // verifying the OTP, because the OTP table only
      // stores the phone/purpose/code information.
      //
      // IMPORTANT:
      // Purpose is REGISTER, NOT LOGIN.
      const { expiresAt } = await requestOtp(phone, "REGISTER");

      console.log(
        `Registration OTP requested for ${phone} (${name})`
      );

      return res.json({
        message: "Registration OTP sent",
        expiresAt,
      });
    } catch (err) {
      console.error(
        "Registration OTP request error:",
        err
      );

      return res.status(500).json({
        error: "Could not send registration OTP.",
      });
    }
  }
);

// ============================================================
// CUSTOMER REGISTRATION - VERIFY OTP
// ============================================================
// PUBLIC ROUTE
// NO JWT REQUIRED.
//
// Flow:
//
// Name + Phone + OTP
//        ↓
// Verify REGISTER OTP
//        ↓
// Create CUSTOMER
//        ↓
// Return success
//        ↓
// NO JWT
//        ↓
// Frontend goes to LOGIN page
// ============================================================

router.post(
  "/register/otp/verify",
  otpVerifyLimiter,
  async (req, res) => {
    const parsed = registrationVerifySchema.safeParse(
      req.body
    );

    if (!parsed.success) {
      return res.status(400).json({
        error: parsed.error.errors[0].message,
      });
    }

    const { name, phone, code } = parsed.data;

    try {
      // --------------------------------------------------------
      // Check phone again before creating the account.
      // --------------------------------------------------------

      const existingUser = await prisma.user.findUnique({
        where: { phone },
      });

      if (existingUser) {
        if (existingUser.role !== "CUSTOMER") {
          return res.status(403).json({
            error:
              "This phone number is already registered for an admin account.",
          });
        }

        return res.status(409).json({
          error:
            "This mobile number is already registered. Please log in instead.",
        });
      }

      // --------------------------------------------------------
      // Verify REGISTRATION OTP.
      //
      // This is deliberately REGISTER, not LOGIN.
      // --------------------------------------------------------

      const result = await verifyOtp(
        phone,
        code,
        "REGISTER"
      );

      if (!result.valid) {
        return res.status(400).json({
          error: result.reason,
        });
      }

      // --------------------------------------------------------
      // OTP is correct.
      // NOW create the customer.
      // --------------------------------------------------------

      const user = await prisma.user.create({
        data: {
          name,
          phone,
          role: "CUSTOMER",
        },
      });

      if (!user.isActive) {
        return res.status(403).json({
          error: "Account disabled. Contact support.",
        });
      }

      console.log(
        `Customer account created successfully: ${phone}`
      );

      // --------------------------------------------------------
      // VERY IMPORTANT:
      //
      // DO NOT create a JWT here.
      //
      // Registration should NOT automatically log the
      // customer into the application.
      // --------------------------------------------------------

      return res.status(201).json({
        message:
          "Account created successfully. Please log in with your registered mobile number.",

        user: {
          id: user.id,
          phone: user.phone,
          name: user.name,
          role: user.role,
        },
      });
    } catch (err) {
      console.error(
        "Registration OTP verification error:",
        err
      );

      return res.status(500).json({
        error: "Could not complete registration.",
      });
    }
  }
);

// ============================================================
// CUSTOMER LOGIN - REQUEST OTP
// ============================================================
// PUBLIC ROUTE
// NO JWT REQUIRED.
//
// IMPORTANT:
// Only an EXISTING CUSTOMER can request a login OTP.
// Unknown numbers receive an error.
// No account is created here.
// ============================================================

router.post(
  "/otp/request",
  otpRequestLimiter,
  async (req, res) => {
    const parsed = phoneSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({
        error: parsed.error.errors[0].message,
      });
    }

    const { phone } = parsed.data;

    try {
      // --------------------------------------------------------
      // Check that the phone belongs to an existing CUSTOMER.
      // --------------------------------------------------------

      const user = await prisma.user.findFirst({
        where: {
          phone,
          role: "CUSTOMER",
        },
      });

      if (!user) {
        return res.status(404).json({
          error:
            "This mobile number is not registered. Please create an account first.",
        });
      }

      if (!user.isActive) {
        return res.status(403).json({
          error: "Account disabled. Contact support.",
        });
      }

      // --------------------------------------------------------
      // Send LOGIN OTP.
      // --------------------------------------------------------

      const { expiresAt } = await requestOtp(
        phone,
        "LOGIN"
      );

      return res.json({
        message: "OTP sent",
        expiresAt,
      });
    } catch (err) {
      console.error(
        "Customer login OTP request error:",
        err
      );

      return res.status(500).json({
        error: "Could not send login OTP.",
      });
    }
  }
);

// ============================================================
// CUSTOMER LOGIN - VERIFY OTP
// ============================================================
// PUBLIC ROUTE
// NO JWT REQUIRED.
//
// Only an existing CUSTOMER can successfully log in.
// ============================================================

router.post(
  "/otp/verify",
  otpVerifyLimiter,
  async (req, res) => {
    const parsed = verifySchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({
        error: parsed.error.errors[0].message,
      });
    }

    const { phone, code } = parsed.data;

    try {
      // --------------------------------------------------------
      // Check customer BEFORE verifying/login.
      // --------------------------------------------------------

      const user = await prisma.user.findFirst({
        where: {
          phone,
          role: "CUSTOMER",
        },
      });

      if (!user) {
        return res.status(404).json({
          error:
            "This mobile number is not registered. Please create an account first.",
        });
      }

      if (!user.isActive) {
        return res.status(403).json({
          error: "Account disabled. Contact support.",
        });
      }

      // --------------------------------------------------------
      // Verify LOGIN OTP.
      // --------------------------------------------------------

      const result = await verifyOtp(
        phone,
        code,
        "LOGIN"
      );

      if (!result.valid) {
        return res.status(400).json({
          error: result.reason,
        });
      }

      // --------------------------------------------------------
      // OTP valid.
      // Create JWT and log customer in.
      // --------------------------------------------------------

      const token = signToken(user);

      return res.json({
        token,

        user: {
          id: user.id,
          phone: user.phone,
          name: user.name,
          role: user.role,
        },
      });
    } catch (err) {
      console.error(
        "Customer login OTP verification error:",
        err
      );

      return res.status(500).json({
        error: "Could not verify login OTP.",
      });
    }
  }
);
// ============================================================
// ADMIN LOGIN - TEMPORARY NO-OTP LOGIN
// ============================================================
// TEMPORARY TESTING VERSION.
//
// Only existing ADMIN/STAFF accounts can login.
// OTP will be restored after testing by switching Render
// back to the main branch.
// ============================================================

router.post(
  "/admin/login",
  async (req, res) => {
    const parsed = phoneSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({
        error: parsed.error.errors[0].message,
      });
    }

    const { phone } = parsed.data;

    try {
      // --------------------------------------------------------
      // Find existing ADMIN/STAFF account.
      // --------------------------------------------------------

      const admin = await prisma.user.findFirst({
        where: {
          phone,
          role: {
            in: ["ADMIN", "STAFF"],
          },
        },
      });

      if (!admin) {
        return res.status(403).json({
          error: "This number is not registered as an admin.",
        });
      }

      if (!admin.isActive) {
        return res.status(403).json({
          error: "Admin account disabled. Contact support.",
        });
      }

      // --------------------------------------------------------
      // TEMPORARY: Login directly without OTP.
      // --------------------------------------------------------

      const token = signToken(
        admin,
        process.env.ADMIN_JWT_EXPIRES_IN || "12h"
      );

      return res.json({
        token,

        user: {
          id: admin.id,
          phone: admin.phone,
          name: admin.name,
          role: admin.role,
        },
      });
    } catch (err) {
      console.error(
        "Admin login error:",
        err
      );

      return res.status(500).json({
        error: "Could not login.",
      });
    }
  }
);

// ============================================================
// EXPORT
// ============================================================

export default router;