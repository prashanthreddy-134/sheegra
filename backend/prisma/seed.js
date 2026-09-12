import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function slugify(text) {
  return text.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

async function main() {
  // --- Admin account ---
  // Replace with your real phone number, then log in via /api/auth/admin/otp/request.
  const adminPhone = process.env.SEED_ADMIN_PHONE || "+919999999999";
  await prisma.user.upsert({
    where: { phone: adminPhone },
    update: { role: "ADMIN" },
    create: { phone: adminPhone, name: "Store Owner", role: "ADMIN" },
  });
  console.log(`Admin account ready: ${adminPhone}`);

  // --- Categories ---
  const categoryDefs = [
    { name: "Fruits & Vegetables", imageUrl: "" },
    { name: "Dairy & Eggs", imageUrl: "" },
    { name: "Atta, Rice & Dal", imageUrl: "" },
    { name: "Snacks & Beverages", imageUrl: "" },
    { name: "Bakery", imageUrl: "" },
    { name: "Personal Care", imageUrl: "" },
  ];

  const categories = [];
  for (const [i, c] of categoryDefs.entries()) {
    const cat = await prisma.category.upsert({
      where: { slug: slugify(c.name) },
      update: {},
      create: { name: c.name, slug: slugify(c.name), sortOrder: i },
    });
    categories.push(cat);
  }

  // --- Sample products ---
  const productDefs = [
    { name: "Fresh Tomato", unit: "1 kg", mrp: 60, sellingPrice: 45, category: "Fruits & Vegetables", stockQty: 100 },
    { name: "Banana (Robusta)", unit: "1 dozen", mrp: 60, sellingPrice: 50, category: "Fruits & Vegetables", stockQty: 80 },
    { name: "Onion", unit: "1 kg", mrp: 40, sellingPrice: 32, category: "Fruits & Vegetables", stockQty: 120 },
    { name: "Toned Milk", unit: "500 ml", mrp: 30, sellingPrice: 28, category: "Dairy & Eggs", stockQty: 60 },
    { name: "Farm Eggs", unit: "6 pcs", mrp: 45, sellingPrice: 42, category: "Dairy & Eggs", stockQty: 90 },
    { name: "Toor Dal", unit: "1 kg", mrp: 160, sellingPrice: 145, category: "Atta, Rice & Dal", stockQty: 50 },
    { name: "Sona Masoori Rice", unit: "5 kg", mrp: 320, sellingPrice: 299, category: "Atta, Rice & Dal", stockQty: 40 },
    { name: "Whole Wheat Atta", unit: "5 kg", mrp: 260, sellingPrice: 239, category: "Atta, Rice & Dal", stockQty: 45 },
    { name: "Potato Chips", unit: "150 g", mrp: 40, sellingPrice: 35, category: "Snacks & Beverages", stockQty: 100 },
    { name: "Cola Soft Drink", unit: "750 ml", mrp: 45, sellingPrice: 40, category: "Snacks & Beverages", stockQty: 70 },
    { name: "Brown Bread", unit: "400 g", mrp: 55, sellingPrice: 49, category: "Bakery", stockQty: 30 },
    { name: "Bathing Soap", unit: "125 g", mrp: 45, sellingPrice: 39, category: "Personal Care", stockQty: 60 },
  ];

  for (const p of productDefs) {
    const category = categories.find((c) => c.name === p.category);
    const slug = `${slugify(p.name)}-${Math.random().toString(36).slice(2, 7)}`;
    const discountPct = p.mrp > p.sellingPrice ? ((p.mrp - p.sellingPrice) / p.mrp) * 100 : 0;
    await prisma.product.create({
      data: {
        name: p.name,
        slug,
        unit: p.unit,
        mrp: p.mrp,
        sellingPrice: p.sellingPrice,
        discountPct,
        categoryId: category.id,
        stockQty: p.stockQty,
      },
    });
  }

  // --- Sample coupon ---
  await prisma.coupon.upsert({
    where: { code: "SHEE50" },
    update: {},
    create: {
      code: "SHEE50",
      description: "₹50 off on orders above ₹299",
      discountType: "FLAT",
      discountValue: 50,
      minOrderValue: 299,
    },
  });

  console.log(`Seeded ${categories.length} categories and ${productDefs.length} products.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
