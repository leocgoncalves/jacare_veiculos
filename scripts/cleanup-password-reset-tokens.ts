import { cleanupPasswordResetTokens } from "../lib/password-reset";
import { prisma } from "../lib/prisma";

async function run() {
  const result = await cleanupPasswordResetTokens();
  console.info(
    `[maintenance] PasswordResetToken cleanup finalizado: expirados=${result.expiredDeleted}, usados=${result.usedDeleted}, total=${result.totalDeleted}`,
  );
}

run()
  .catch((error) => {
    console.error("[maintenance] Falha ao limpar PasswordResetToken", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
