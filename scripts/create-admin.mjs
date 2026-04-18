import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const email = process.env.ADMIN_EMAIL ?? "admin@dentflow.kz";
  const password = process.env.ADMIN_PASSWORD ?? "Admin123!";
  const name = process.env.ADMIN_NAME ?? "Security Admin";

  if (password.length < 8) {
    throw new Error("ADMIN_PASSWORD кемінде 8 таңба болуы керек");
  }

  const passwordHash = await hash(password, 14);

  const user = await prisma.user.upsert({
    where: { email },
    update: {
      name,
      password: passwordHash,
      role: "ADMIN",
      isVerified: true,
    },
    create: {
      email,
      password: passwordHash,
      role: "ADMIN",
      name,
      isVerified: true,
    },
    select: {
      id: true,
      email: true,
      role: true,
      twoFactorEnabled: true,
    },
  });

  console.log("Admin дайын:", user);
  console.log("Кіру: /login -> /admin/profile (алдымен 2FA қосыңыз) -> /admin/security");
}

main()
  .catch((error) => {
    console.error("Admin құру қатесі:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
