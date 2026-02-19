import { createHash, randomBytes } from "crypto";
import { prisma } from "@/lib/prisma";

const PASSWORD_RESET_TTL_MINUTES = 30;

export class PasswordResetError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PasswordResetError";
  }
}

export function buildPasswordResetToken() {
  return randomBytes(32).toString("hex");
}

export function hashPasswordResetToken(rawToken: string) {
  return createHash("sha256").update(rawToken).digest("hex");
}

export function getPasswordResetExpiryDate() {
  return new Date(Date.now() + PASSWORD_RESET_TTL_MINUTES * 60 * 1000);
}

export function getPasswordResetTtlMinutes() {
  return PASSWORD_RESET_TTL_MINUTES;
}

export async function createPasswordResetTokenForUser(userId: string) {
  const rawToken = buildPasswordResetToken();
  const tokenHash = hashPasswordResetToken(rawToken);
  const expiresAt = getPasswordResetExpiryDate();

  await prisma.passwordResetToken.deleteMany({
    where: {
      userId,
      usedAt: null,
    },
  });

  await prisma.passwordResetToken.create({
    data: {
      userId,
      tokenHash,
      expiresAt,
    },
  });

  return { rawToken, expiresAt };
}

export async function consumePasswordResetToken(
  rawToken: string,
  newPasswordHash: string,
) {
  const tokenHash = hashPasswordResetToken(rawToken);
  const now = new Date();

  const resetToken = await prisma.passwordResetToken.findUnique({
    where: { tokenHash },
    include: { user: true },
  });

  if (!resetToken) {
    throw new PasswordResetError("Link de redefinição inválido.");
  }

  if (resetToken.usedAt || resetToken.expiresAt <= now) {
    throw new PasswordResetError("Este link de redefinição já expirou.");
  }

  await prisma.$transaction(async (tx) => {
    const consumeResult = await tx.passwordResetToken.updateMany({
      where: {
        id: resetToken.id,
        usedAt: null,
        expiresAt: { gt: new Date() },
      },
      data: { usedAt: new Date() },
    });

    if (consumeResult.count === 0) {
      throw new PasswordResetError("Este link de redefinição já foi utilizado.");
    }

    await tx.user.update({
      where: { id: resetToken.userId },
      data: { passwordHash: newPasswordHash },
    });

    await tx.session.deleteMany({
      where: { userId: resetToken.userId },
    });
  });
}

export async function cleanupPasswordResetTokens() {
  const now = new Date();

  const [expiredResult, usedResult] = await Promise.all([
    prisma.passwordResetToken.deleteMany({
      where: {
        expiresAt: { lt: now },
      },
    }),
    prisma.passwordResetToken.deleteMany({
      where: {
        usedAt: { not: null },
        createdAt: {
          lt: new Date(Date.now() - 24 * 60 * 60 * 1000),
        },
      },
    }),
  ]);

  return {
    expiredDeleted: expiredResult.count,
    usedDeleted: usedResult.count,
    totalDeleted: expiredResult.count + usedResult.count,
  };
}
