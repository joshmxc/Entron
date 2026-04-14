import { PrismaClient } from "../generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
dotenv.config();

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  const passwordHash = await bcrypt.hash("Admin@1234", 12);

  const admin = await prisma.user.upsert({
    where: { phone: "0700000000" },
    update: {},
    create: {
      name: "Admin",
      phone: "0700000000",
      passwordHash,
      role: "ADMIN",
    },
  });

  const staff = await prisma.user.upsert({
    where: { phone: "0711111111" },
    update: {},
    create: {
      name: "Staff Member",
      phone: "0711111111",
      passwordHash: await bcrypt.hash("Staff@1234", 12),
      role: "STAFF",
    },
  });

  const event = await prisma.event.upsert({
    where: { id: "00000000-0000-0000-0000-000000000001" },
    update: {},
    create: {
      id: "00000000-0000-0000-0000-000000000001",
      name: "Harusi ya Amani na Baraka",
      nameSwahili: "Harusi ya Amani na Baraka",
      venue: "Mlimani City Hall, Dar es Salaam",
      venueSwahili: "Ukumbi wa Mlimani City, Dar es Salaam",
      startDate: new Date("2026-06-15T15:00:00Z"),
      description: "Sample wedding event",
    },
  });

  console.log("✓ Seeded admin:", admin.phone, "/ Admin@1234");
  console.log("✓ Seeded staff:", staff.phone, "/ Staff@1234");
  console.log("✓ Seeded event:", event.name);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
