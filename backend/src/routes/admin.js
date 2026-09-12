import { Router } from "express";
import { z } from "zod";
import { prisma } from "../prismaClient.js";
import { requireAuth, requireAdmin } from "../middleware/auth.js";
import { notifyOrderStatus } from "../services/notificationService.js";
import { releaseStockForOrder } from "./orders.js";
import { refundPayment } from "../services/paymentService.js";

const router = Router();

// ============================================================
// ADMIN AUTHENTICATION
// ============================================================

router.use(requireAuth, requireAdmin);

// ============================================================
// DASHBOARD
// ============================================================

router.get("/dashboard", async (req, res) => {
  try {
    const since = new Date();
    since.setDate(since.getDate() - 30);

    const [
      totalOrders,
      pendingOrders,
      totalCustomers,
      revenueAgg,
      recentOrders,
    ] = await Promise.all([
      prisma.order.count(),

      prisma.order.count({
        where: {
          status: {
            in: [
              "CONFIRMED",
              "PACKED",
              "OUT_FOR_DELIVERY",
            ],
          },
        },
      }),

      prisma.user.count({
        where: {
          role: "CUSTOMER",
        },
      }),

      prisma.order.aggregate({
        _sum: {
          total: true,
        },
        where: {
          paymentStatus: "PAID",
          placedAt: {
            gte: since,
          },
        },
      }),

     prisma.order.findMany({
  take: 10,
  orderBy: {
    placedAt: "desc",
  },
  include: {
    user: true,
    items: true,
    address: true,
    coupon: true,
    statusHistory: {
      orderBy: {
        createdAt: "asc",
      },
    },
  },
}),
    ]);

    const lowStockProducts = await prisma.$queryRaw`
      SELECT
        id,
        name,
        "stockQty",
        "lowStockAlert"
      FROM "Product"
      WHERE
        "isActive" = true
        AND "stockQty" <= "lowStockAlert"
      LIMIT 20
    `;

    return res.json({
      totalOrders,
      pendingOrders,
      totalCustomers,
      revenueLast30Days: revenueAgg._sum.total || 0,
      lowStockProducts,
      recentOrders,
    });
  } catch (err) {
    console.error("Dashboard error:", err);

    return res.status(500).json({
      error: "Could not load dashboard.",
    });
  }
});

// ============================================================
// ORDERS
// ============================================================

router.get("/orders", async (req, res) => {
  try {
    const {
      status,
      page = "1",
      limit = "20",
    } = req.query;

    const take = Math.min(
      Number(limit) || 20,
      100
    );

    const pageNumber = Math.max(
      Number(page) || 1,
      1
    );

    const skip = (pageNumber - 1) * take;

    const where = status
      ? {
          status: String(status),
        }
      : {};

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        include: {
          items: true,
          address: true,
          user: true,
        },
        orderBy: {
          placedAt: "desc",
        },
        take,
        skip,
      }),

      prisma.order.count({
        where,
      }),
    ]);

    return res.json({
      orders,
      total,
    });
  } catch (err) {
    console.error("Admin orders error:", err);

    return res.status(500).json({
      error: "Could not load orders.",
    });
  }
});

// ============================================================
// ORDER STATUS
// ============================================================

const VALID_TRANSITIONS = {
  CONFIRMED: [
    "PACKED",
    "CANCELLED",
  ],

  PACKED: [
    "OUT_FOR_DELIVERY",
    "CANCELLED",
  ],

  OUT_FOR_DELIVERY: [
    "DELIVERED",
    "CANCELLED",
  ],
};

router.patch("/orders/:id/status", async (req, res) => {
  try {
    const schema = z.object({
      status: z.enum([
        "CONFIRMED",
        "PACKED",
        "OUT_FOR_DELIVERY",
        "DELIVERED",
        "CANCELLED",
      ]),
      note: z.string().optional(),
    });

    const parsed = schema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({
        error: parsed.error.errors[0].message,
      });
    }

    const order = await prisma.order.findUnique({
      where: {
        id: req.params.id,
      },
      include: {
        user: true,
      },
    });

    if (!order) {
      return res.status(404).json({
        error: "Order not found",
      });
    }

    const {
      status,
      note,
    } = parsed.data;

    const allowedNext =
      VALID_TRANSITIONS[order.status] || [];

    if (!allowedNext.includes(status)) {
      return res.status(400).json({
        error: `Cannot move order from ${order.status} to ${status}`,
      });
    }

    const updated = await prisma.order.update({
      where: {
        id: order.id,
      },

      data: {
        status,

        ...(status === "DELIVERED" && {
          deliveredAt: new Date(),
        }),

        ...(status === "CANCELLED" && {
          cancelledAt: new Date(),
          cancelReason:
            note || "Cancelled by store",
        }),

        statusHistory: {
          create: {
            status,
            changedBy: req.user.id,
            note,
          },
        },
      },

      include: {
        user: true,
      },
    });

    if (status === "CANCELLED") {
      await releaseStockForOrder(order.id);

      if (
        order.paymentStatus === "PAID" &&
        order.razorpayPaymentId
      ) {
        try {
          await refundPayment({
            paymentId:
              order.razorpayPaymentId,

            amountInPaise: Math.round(
              Number(order.total) * 100
            ),
          });

          await prisma.order.update({
            where: {
              id: order.id,
            },

            data: {
              paymentStatus: "REFUNDED",
            },
          });

          updated.paymentStatus =
            "REFUNDED";
        } catch (err) {
          console.error(
            `Refund failed for order ${order.orderNumber}:`,
            err.message
          );
        }
      }
    }

    await notifyOrderStatus(
      updated,
      updated.user
    );

    return res.json(updated);
  } catch (err) {
    console.error(
      "Order status update error:",
      err
    );

    return res.status(500).json({
      error:
        "Could not update order status.",
    });
  }
});

// ============================================================
// CUSTOMERS
// ============================================================

// Get customers
router.get("/customers", async (req, res) => {
  try {
    const {
      q,
      page = "1",
      limit = "20",
    } = req.query;

    const take = Math.min(
      Number(limit) || 20,
      100
    );

    const pageNumber = Math.max(
      Number(page) || 1,
      1
    );

    const skip = (pageNumber - 1) * take;

    const where = {
      role: "CUSTOMER",

      ...(q && {
        OR: [
          {
            phone: {
              contains: String(q),
            },
          },

          {
            name: {
              contains: String(q),
              mode: "insensitive",
            },
          },
        ],
      }),
    };

    const [
      customers,
      total,
    ] = await Promise.all([
      prisma.user.findMany({
        where,
        take,
        skip,

        orderBy: {
          createdAt: "desc",
        },

        include: {
          _count: {
            select: {
              orders: true,
            },
          },

          storeCash: {
            select: {
              balance: true,
            },
          },
        },
      }),

      prisma.user.count({
        where,
      }),
    ]);

    return res.json({
      customers,
      total,
    });
  } catch (err) {
    console.error(
      "Customers load error:",
      err
    );

    return res.status(500).json({
      error: "Could not load customers.",
    });
  }
});

// ============================================================
// STORE CASH — ADMIN
// ============================================================

// Get a customer's Store Cash balance and history
router.get(
  "/customers/:id/store-cash",
  async (req, res) => {
    try {
      const customer =
        await prisma.user.findUnique({
          where: {
            id: req.params.id,
          },

          select: {
            id: true,
            name: true,
            phone: true,
            role: true,

            storeCash: {
              include: {
                transactions: {
                  orderBy: {
                    createdAt: "desc",
                  },

                  take: 100,
                },
              },
            },
          },
        });

      if (!customer) {
        return res.status(404).json({
          error: "Customer not found.",
        });
      }

      if (customer.role !== "CUSTOMER") {
        return res.status(403).json({
          error:
            "Store Cash can only be managed for customer accounts.",
        });
      }

      return res.json({
        customer: {
          id: customer.id,
          name: customer.name,
          phone: customer.phone,
        },

        balance:
          customer.storeCash?.balance || 0,

        transactions:
          customer.storeCash?.transactions || [],
      });
    } catch (err) {
      console.error(
        "Get Store Cash error:",
        err
      );

      return res.status(500).json({
        error:
          "Could not load Store Cash.",
      });
    }
  }
);

// Give Store Cash to a customer
router.post(
  "/customers/:id/store-cash",
  async (req, res) => {
    try {
      const schema = z.object({
        amount: z
          .number()
          .positive()
          .max(100000),

        description: z
          .string()
          .trim()
          .max(250)
          .optional(),
      });

      const parsed =
        schema.safeParse(req.body);

      if (!parsed.success) {
        return res.status(400).json({
          error:
            parsed.error.errors[0].message,
        });
      }

      const customer =
        await prisma.user.findUnique({
          where: {
            id: req.params.id,
          },

          select: {
            id: true,
            name: true,
            phone: true,
            role: true,
            isActive: true,
          },
        });

      if (!customer) {
        return res.status(404).json({
          error: "Customer not found.",
        });
      }

      if (customer.role !== "CUSTOMER") {
        return res.status(403).json({
          error:
            "Store Cash can only be given to customers.",
        });
      }

      if (!customer.isActive) {
        return res.status(400).json({
          error:
            "This customer account is disabled.",
        });
      }

      const amount = parsed.data.amount;

      const result =
        await prisma.$transaction(
          async (tx) => {
            // Create the wallet if this is
            // the customer's first Store Cash.
            const storeCash =
              await tx.storeCash.upsert({
                where: {
                  userId: customer.id,
                },

                create: {
                  userId: customer.id,
                  balance: amount,
                },

                update: {
                  balance: {
                    increment: amount,
                  },
                },
              });

            const balanceAfter =
              Number(storeCash.balance);

            const balanceBefore =
              balanceAfter - amount;

            const transaction =
              await tx.storeCashTransaction.create({
                data: {
                  userId: customer.id,
                  storeCashId: storeCash.id,

                  type: "CREDIT",

                  amount,

                  balanceBefore,
                  balanceAfter,

                  description:
                    parsed.data.description ||
                    "Store Cash added by admin",

                  reference:
                    `ADMIN-${req.user.id}`,
                },
              });

            return {
              storeCash,
              transaction,
            };
          }
        );

      return res.status(201).json({
        message:
          "Store Cash added successfully.",

        customer: {
          id: customer.id,
          name: customer.name,
          phone: customer.phone,
        },

        balance:
          result.storeCash.balance,

        transaction:
          result.transaction,
      });
    } catch (err) {
      console.error(
        "Add Store Cash error:",
        err
      );

      return res.status(500).json({
        error:
          "Could not add Store Cash.",
      });
    }
  }
);


// Give Store Cash to ALL active customers
router.post(
  "/store-cash/all",
  async (req, res) => {
    try {
      const schema = z.object({
        amount: z.number().positive().max(100000),
        description: z.string().trim().max(250).optional(),
      });

      const parsed = schema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.errors[0].message });
      }

      const amount = parsed.data.amount;
      const description = parsed.data.description || "Free Store Cash";

      const result = await prisma.$transaction(async (tx) => {
        const customers = await tx.user.findMany({
          where: { role: "CUSTOMER", isActive: true },
          select: { id: true },
        });

        if (customers.length === 0) {
          return { customerCount: 0, totalAmount: 0 };
        }

        let totalAmount = 0;

        for (const customer of customers) {
          const storeCash = await tx.storeCash.upsert({
            where: { userId: customer.id },
            create: { userId: customer.id, balance: amount },
            update: { balance: { increment: amount } },
          });

          const balanceAfter = Number(storeCash.balance);
          const balanceBefore = balanceAfter - amount;

          await tx.storeCashTransaction.create({
            data: {
              userId: customer.id,
              storeCashId: storeCash.id,
              type: "CREDIT",
              amount,
              balanceBefore,
              balanceAfter,
              description,
              reference: `ADMIN-BULK-${req.user.id}`,
            },
          });

          totalAmount += amount;
        }

        return { customerCount: customers.length, totalAmount };
      });

      if (result.customerCount === 0) {
        return res.status(400).json({ error: "There are no active customers." });
      }

      return res.status(201).json({
        message: `₹${result.totalAmount.toFixed(2)} Store Cash given to ${result.customerCount} active customers successfully.`,
        customerCount: result.customerCount,
        amountPerCustomer: amount,
        totalAmount: result.totalAmount,
      });
    } catch (err) {
      console.error("Bulk Store Cash error:", err);
      return res.status(500).json({ error: "Could not give Store Cash to all customers." });
    }
  }
);


// ============================================================
// ENABLE / DISABLE CUSTOMER
// ============================================================

router.patch(
  "/customers/:id/status",
  async (req, res) => {
    try {
      const schema = z.object({
        isActive: z.boolean(),
      });

      const parsed = schema.safeParse(
        req.body
      );

      if (!parsed.success) {
        return res.status(400).json({
          error:
            parsed.error.errors[0].message,
        });
      }

      const customer =
        await prisma.user.findUnique({
          where: {
            id: req.params.id,
          },
        });

      if (!customer) {
        return res.status(404).json({
          error: "Customer not found.",
        });
      }

      if (customer.role !== "CUSTOMER") {
        return res.status(403).json({
          error:
            "Only customer accounts can be modified here.",
        });
      }

      const updated =
        await prisma.user.update({
          where: {
            id: req.params.id,
          },

          data: {
            isActive:
              parsed.data.isActive,
          },
        });

      return res.json(updated);
    } catch (err) {
      console.error(
        "Customer status error:",
        err
      );

      return res.status(500).json({
        error:
          "Could not update customer status.",
      });
    }
  }
);

// ============================================================
// DELETE CUSTOMER
// ============================================================

// Used for removing test/customer accounts.
//
// IMPORTANT:
// Customers who already have orders are NOT deleted.
// Their order history must remain intact.
// Use Disable instead for those accounts.

router.delete(
  "/customers/:id",
  async (req, res) => {
    try {
      const customer =
        await prisma.user.findUnique({
          where: {
            id: req.params.id,
          },

          include: {
            orders: {
              select: {
                id: true,
              },
            },
          },
        });

      if (!customer) {
        return res.status(404).json({
          error: "Customer not found.",
        });
      }

      if (customer.role !== "CUSTOMER") {
        return res.status(403).json({
          error:
            "Only customer accounts can be deleted.",
        });
      }

      // Never delete customers who have orders.
      if (customer.orders.length > 0) {
        return res.status(409).json({
          error:
            "This customer has existing orders and cannot be deleted. Disable the account instead.",
        });
      }

      // Delete related records first.
      await prisma.$transaction(
        async (tx) => {
          // OTP records
          await tx.otpRequest.deleteMany({
            where: {
              userId: customer.id,
            },
          });

          // Cart
          await tx.cartItem.deleteMany({
            where: {
              userId: customer.id,
            },
          });

          // Wishlist
          await tx.wishlistItem.deleteMany({
            where: {
              userId: customer.id,
            },
          });

          // Addresses
          await tx.address.deleteMany({
            where: {
              userId: customer.id,
            },
          });

          // Notifications
          await tx.notification.deleteMany({
            where: {
              userId: customer.id,
            },
          });

          // Push tokens
          await tx.pushToken.deleteMany({
            where: {
              userId: customer.id,
            },
          });

          // Store Cash
          // Explicitly remove transaction history
          // before deleting the wallet.
          await tx.storeCashTransaction.deleteMany({
            where: {
              userId: customer.id,
            },
          });

          await tx.storeCash.deleteMany({
            where: {
              userId: customer.id,
            },
          });

          // Finally delete user
          await tx.user.delete({
            where: {
              id: customer.id,
            },
          });
        }
      );

      return res.json({
        message:
          "Customer deleted successfully.",
        customerId: customer.id,
      });
    } catch (err) {
      console.error(
        "Delete customer error:",
        err
      );

      return res.status(500).json({
        error:
          "Could not delete customer.",

        ...(process.env.NODE_ENV !==
          "production" && {
          details: err.message,
        }),
      });
    }
  }
);

// ============================================================
// COUPONS
// ============================================================

router.get("/coupons", async (req, res) => {
  try {
    const coupons =
      await prisma.coupon.findMany({
        orderBy: {
          validFrom: "desc",
        },
      });

    return res.json(coupons);
  } catch (err) {
    console.error(
      "Coupons load error:",
      err
    );

    return res.status(500).json({
      error: "Could not load coupons.",
    });
  }
});

const couponSchema = z.object({
  code: z.string().min(3),
  description: z.string().optional(),

  discountType: z.enum([
    "PERCENT",
    "FLAT",
  ]),

  discountValue: z.number().positive(),
  minOrderValue: z.number().optional(),
  maxDiscount: z.number().optional(),
  usageLimit: z.number().int().optional(),
  validTill: z.string().optional(),
});

// Create coupon
router.post("/coupons", async (req, res) => {
  try {
    const parsed =
      couponSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({
        error:
          parsed.error.errors[0].message,
      });
    }

    const {
      code,
      validTill,
      ...rest
    } = parsed.data;

    const coupon =
      await prisma.coupon.create({
        data: {
          code: code.toUpperCase(),
          ...rest,

          ...(validTill && {
            validTill: new Date(validTill),
          }),
        },
      });

    return res.status(201).json(coupon);
  } catch (err) {
    console.error(
      "Create coupon error:",
      err
    );

    return res.status(500).json({
      error: "Could not create coupon.",
    });
  }
});

// Update coupon
router.put(
  "/coupons/:id",
  async (req, res) => {
    try {
      const parsed =
        couponSchema.partial().safeParse(
          req.body
        );

      if (!parsed.success) {
        return res.status(400).json({
          error:
            parsed.error.errors[0].message,
        });
      }

      const {
        code,
        validTill,
        ...rest
      } = parsed.data;

      const coupon =
        await prisma.coupon.update({
          where: {
            id: req.params.id,
          },

          data: {
            ...(code && {
              code: code.toUpperCase(),
            }),

            ...rest,

            ...(validTill && {
              validTill: new Date(validTill),
            }),
          },
        });

      return res.json(coupon);
    } catch (err) {
      console.error(
        "Update coupon error:",
        err
      );

      return res.status(500).json({
        error: "Could not update coupon.",
      });
    }
  }
);

// Deactivate coupon
router.delete(
  "/coupons/:id",
  async (req, res) => {
    try {
      await prisma.coupon.update({
        where: {
          id: req.params.id,
        },

        data: {
          isActive: false,
        },
      });

      return res.json({
        message: "Coupon deactivated",
      });
    } catch (err) {
      console.error(
        "Deactivate coupon error:",
        err
      );

      return res.status(500).json({
        error:
          "Could not deactivate coupon.",
      });
    }
  }
);

// ============================================================
// REPORTS
// ============================================================

router.get(
  "/reports/sales",
  async (req, res) => {
    try {
      const {
        from,
        to,
      } = req.query;

      const where = {
        paymentStatus: "PAID",

        ...(from || to
          ? {
              placedAt: {
                ...(from && {
                  gte: new Date(
                    String(from)
                  ),
                }),

                ...(to && {
                  lte: new Date(
                    String(to)
                  ),
                }),
              },
            }
          : {}),
      };

      const orders =
        await prisma.order.findMany({
          where,

          select: {
            total: true,
            placedAt: true,
          },
        });

      const totalRevenue =
        orders.reduce(
          (sum, order) =>
            sum + Number(order.total),
          0
        );

      const byDay = {};

      for (const order of orders) {
        const day =
          order.placedAt
            .toISOString()
            .slice(0, 10);

        byDay[day] =
          (byDay[day] || 0) +
          Number(order.total);
      }

      return res.json({
        totalRevenue,

        totalOrders:
          orders.length,

        averageOrderValue:
          orders.length
            ? totalRevenue /
              orders.length
            : 0,

        dailyRevenue:
          Object.entries(byDay)
            .map(
              ([date, revenue]) => ({
                date,
                revenue,
              })
            )
            .sort((a, b) =>
              a.date.localeCompare(
                b.date
              )
            ),
      });
    } catch (err) {
      console.error(
        "Sales report error:",
        err
      );

      return res.status(500).json({
        error:
          "Could not generate sales report.",
      });
    }
  }
);

// ============================================================
// STAFF MANAGEMENT
// ============================================================

router.post(
  "/staff",
  async (req, res) => {
    try {
      const schema = z.object({
        phone: z.string().min(10),
        name: z.string().min(1),

        role: z.enum([
          "ADMIN",
          "STAFF",
        ]),
      });

      const parsed =
        schema.safeParse(req.body);

      if (!parsed.success) {
        return res.status(400).json({
          error:
            parsed.error.errors[0].message,
        });
      }

      const staff =
        await prisma.user.upsert({
          where: {
            phone: parsed.data.phone,
          },

          update: {
            role: parsed.data.role,
            name: parsed.data.name,
          },

          create: {
            phone: parsed.data.phone,
            name: parsed.data.name,
            role: parsed.data.role,
          },
        });

      return res.status(201).json(staff);
    } catch (err) {
      console.error(
        "Staff management error:",
        err
      );

      return res.status(500).json({
        error:
          "Could not create/update staff account.",
      });
    }
  }
);

// ============================================================
// IMPORTANT: DEFAULT EXPORT
// ============================================================

export default router;