import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🧹  Clearing all data…");
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.review.deleteMany();
  await prisma.productImage.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();
  await prisma.visit.deleteMany();
  await prisma.adminUser.deleteMany();

  const email = (process.env.ADMIN_EMAIL ?? "admin@rakhibazaar.in").toLowerCase();
  const password = process.env.ADMIN_PASSWORD ?? "admin123";
  await prisma.adminUser.create({
    data: {
      email,
      name: "Store Admin",
      passwordHash: await bcrypt.hash(password, 10),
      role: "admin",
    },
  });
  console.log(`👤  Admin recreated: ${email} / ${password}`);
  console.log("✅  Database is now empty (admin user only).");
}

main()
  .catch((e) => {
    console.error("❌ Clear failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
