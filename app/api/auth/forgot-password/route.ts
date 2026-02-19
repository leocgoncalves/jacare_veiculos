import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { sendPasswordResetEmail } from "@/lib/mailer";
import {
  createPasswordResetTokenForUser,
  getPasswordResetTtlMinutes,
} from "@/lib/password-reset";
import { consumeRateLimit } from "@/lib/rate-limit";

const forgotPasswordSchema = z.object({
  email: z.string().email(),
});

function getPublicAppUrl() {
  const rawUrl =
    process.env.APP_URL ?? process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  return rawUrl.endsWith("/") ? rawUrl.slice(0, -1) : rawUrl;
}

const genericSuccessMessage =
  "Se o e-mail estiver cadastrado, você receberá um link seguro para redefinir sua senha.";

function parsePositiveInt(value: string | undefined, fallback: number) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback;
  }
  return Math.floor(parsed);
}

function getRateLimitConfig() {
  const windowMs = parsePositiveInt(
    process.env.FORGOT_PASSWORD_RATE_LIMIT_WINDOW_MS,
    15 * 60 * 1000,
  );
  const perIpMax = parsePositiveInt(
    process.env.FORGOT_PASSWORD_RATE_LIMIT_PER_IP,
    10,
  );
  const perEmailMax = parsePositiveInt(
    process.env.FORGOT_PASSWORD_RATE_LIMIT_PER_EMAIL,
    3,
  );

  return {
    windowMs,
    perIpMax,
    perEmailMax,
  };
}

function extractClientIp(req: Request) {
  const forwardedFor = req.headers.get("x-forwarded-for");
  if (forwardedFor) {
    const firstIp = forwardedFor.split(",")[0]?.trim();
    if (firstIp) return firstIp;
  }

  const realIp = req.headers.get("x-real-ip");
  if (realIp?.trim()) return realIp.trim();

  return "unknown";
}

export async function POST(req: Request) {
  try {
    const payload = forgotPasswordSchema.parse(await req.json());
    const normalizedEmail = payload.email.toLowerCase();
    const { windowMs, perIpMax, perEmailMax } = getRateLimitConfig();
    const clientIp = extractClientIp(req);

    const ipRateResult = await consumeRateLimit(
      "forgot-password:ip",
      clientIp,
      { windowMs, maxHits: perIpMax },
    );
    if (!ipRateResult.allowed) {
      return NextResponse.json(
        { message: "Muitas tentativas. Aguarde alguns minutos e tente novamente." },
        { status: 429 },
      );
    }

    const emailRateResult = await consumeRateLimit(
      "forgot-password:email",
      normalizedEmail,
      { windowMs, maxHits: perEmailMax },
    );
    if (!emailRateResult.allowed) {
      return NextResponse.json(
        { message: "Muitas tentativas. Aguarde alguns minutos e tente novamente." },
        { status: 429 },
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      select: { id: true, name: true, email: true },
    });

    if (!user) {
      return NextResponse.json({ message: genericSuccessMessage });
    }

    const { rawToken } = await createPasswordResetTokenForUser(user.id);
    const resetUrl = `${getPublicAppUrl()}/reset-password?token=${encodeURIComponent(rawToken)}`;

    await sendPasswordResetEmail({
      to: user.email,
      name: user.name,
      resetUrl,
      expiresInMinutes: getPasswordResetTtlMinutes(),
    });

    return NextResponse.json({ message: genericSuccessMessage });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: "Dados inválidos.", issues: error.issues },
        { status: 400 },
      );
    }

    console.error("[forgot-password] erro ao solicitar reset", error);
    return NextResponse.json(
      { message: "Não foi possível processar sua solicitação agora." },
      { status: 500 },
    );
  }
}
