import assert from "node:assert/strict";
import { after, beforeEach, test } from "node:test";
import { randomUUID } from "crypto";
import { POST as forgotPasswordPost } from "@/app/api/auth/forgot-password/route";
import { POST as resetPasswordPost } from "@/app/api/auth/reset-password/route";
import { hashPassword, verifyPassword } from "@/lib/auth";
import { createPasswordResetTokenForUser } from "@/lib/password-reset";
import { prisma } from "@/lib/prisma";
import { clearRateLimitStore } from "@/lib/rate-limit";

process.env.FORGOT_PASSWORD_RATE_LIMIT_WINDOW_MS = "60000";
process.env.FORGOT_PASSWORD_RATE_LIMIT_PER_IP = "2";
process.env.FORGOT_PASSWORD_RATE_LIMIT_PER_EMAIL = "2";

type JsonResponse = {
  message?: string;
};

async function parseJson(response: Response): Promise<JsonResponse> {
  return (await response.json()) as JsonResponse;
}

function makeJsonRequest(url: string, body: unknown, ip = "127.0.0.1") {
  return new Request(url, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-forwarded-for": ip,
    },
    body: JSON.stringify(body),
  });
}

beforeEach(async () => {
  clearRateLimitStore();

  await prisma.session.deleteMany();
  await prisma.passwordResetToken.deleteMany();
  await prisma.user.deleteMany();
});

after(async () => {
  await prisma.$disconnect();
});


  const response = await forgotPasswordPost(
    makeJsonRequest("http://localhost/api/auth/forgot-password", {
      email: user.email,
    }),
  );

  const body = await parseJson(response);

  assert.equal(response.status, 200);
  assert.match(body.message ?? "", /Se o e-mail estiver cadastrado/i);

  const tokensCount = await prisma.passwordResetToken.count({
    where: { userId: user.id },
  });
  assert.equal(tokensCount, 1);
});

test("POST /api/auth/forgot-password aplica rate limit por e-mail/IP", async () => {
  await prisma.user.create({
    data: {
      name: "Cliente Teste",
      email: "cliente@jacareveiculos.com",
      passwordHash: await hashPassword("Senha@123"),
      role: "CLIENT",
      isActive: true,
    },
  });

  const first = await forgotPasswordPost(
    makeJsonRequest("http://localhost/api/auth/forgot-password", {
      email: "cliente@jacareveiculos.com",
    }),
  );
  const second = await forgotPasswordPost(
    makeJsonRequest("http://localhost/api/auth/forgot-password", {
      email: "cliente@jacareveiculos.com",
    }),
  );
  const third = await forgotPasswordPost(
    makeJsonRequest("http://localhost/api/auth/forgot-password", {
      email: "cliente@jacareveiculos.com",
    }),
  );

  assert.equal(first.status, 200);
  assert.equal(second.status, 200);
  assert.equal(third.status, 429);

  const body = await parseJson(third);
  assert.match(body.message ?? "", /Muitas tentativas/i);
});

test("POST /api/auth/reset-password redefine senha e invalida sessões", async () => {
  const oldPassword = "SenhaAntiga@123";
  const newPassword = "SenhaNova@123";

  const user = await prisma.user.create({
    data: {
      name: "Usuário Teste",
      email: "usuario@jacareveiculos.com",
      passwordHash: await hashPassword(oldPassword),
      role: "CLIENT",
      isActive: true,
    },
  });

  await prisma.session.create({
    data: {
      token: randomUUID(),
      userId: user.id,
      expiresAt: new Date(Date.now() + 60 * 60 * 1000),
    },
  });

  const { rawToken } = await createPasswordResetTokenForUser(user.id);

  const response = await resetPasswordPost(
    makeJsonRequest("http://localhost/api/auth/reset-password", {
      token: rawToken,
      password: newPassword,
    }),
  );
  const body = await parseJson(response);

  assert.equal(response.status, 200);
  assert.match(body.message ?? "", /Senha redefinida com sucesso/i);

  const updatedUser = await prisma.user.findUnique({
    where: { id: user.id },
  });
  assert.ok(updatedUser);
  assert.equal(await verifyPassword(newPassword, updatedUser.passwordHash), true);
  assert.equal(await verifyPassword(oldPassword, updatedUser.passwordHash), false);

  const sessionsCount = await prisma.session.count({
    where: { userId: user.id },
  });
  assert.equal(sessionsCount, 0);

  const consumedToken = await prisma.passwordResetToken.findFirst({
    where: { userId: user.id },
  });
  assert.ok(consumedToken?.usedAt);
});

test("POST /api/auth/reset-password retorna erro para token inválido", async () => {
  const response = await resetPasswordPost(
    makeJsonRequest("http://localhost/api/auth/reset-password", {
      token: "token-invalido-12345678901234567890",
      password: "SenhaNova@123",
    }),
  );
  const body = await parseJson(response);

  assert.equal(response.status, 400);
  assert.match(body.message ?? "", /inválido|invalido/i);
});
