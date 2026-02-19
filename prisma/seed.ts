import { UserRole } from "@prisma/client";
import bcrypt from "bcryptjs";
import { prisma } from "../lib/prisma";

async function run() {
  const [adminPassword, clientPassword] = await Promise.all([
    bcrypt.hash("Admin@123", 10),
    bcrypt.hash("Cliente@123", 10),
  ]);

  await prisma.user.upsert({
    where: { email: "leo_cardoso1003@hotmail.com" },
    update: {
      name: "Leo Cardoso",
      role: UserRole.SUPER_ADMIN,
      passwordHash: adminPassword,
      isActive: true,
    },
    create: {
      name: "Leo Cardoso",
      email: "leo_cardoso1003@hotmail.com",
      role: UserRole.SUPER_ADMIN,
      passwordHash: adminPassword,
      isActive: true,
    },
  });

  await prisma.user.upsert({
    where: { email: "admin@jacareveiculos.com" },
    update: {
      name: "Administrador Jacare",
      role: UserRole.ADMIN,
      passwordHash: adminPassword,
      isActive: true,
    },
    create: {
      name: "Administrador Jacare",
      email: "admin@jacareveiculos.com",
      role: UserRole.ADMIN,
      passwordHash: adminPassword,
      isActive: true,
    },
  });

  await prisma.user.upsert({
    where: { email: "cliente@jacareveiculos.com" },
    update: {
      name: "Cliente Jacare",
      role: UserRole.CLIENT,
      passwordHash: clientPassword,
      isActive: true,
    },
    create: {
      name: "Cliente Jacare",
      email: "cliente@jacareveiculos.com",
      role: UserRole.CLIENT,
      passwordHash: clientPassword,
      isActive: true,
    },
  });

  await prisma.siteSettings.upsert({
    where: { id: 1 },
    update: {},
    create: { id: 1 },
  });

  console.log("Seed concluído com usuários padrão.");
}

run()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
