import { UserRole } from "@prisma/client";
import { NextResponse } from "next/server";
import { z } from "zod";
import { createSession, isAdminRole, verifyPassword } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  role: z.enum(["CLIENT", "ADMIN"]).default("CLIENT"),
});

export async function POST(req: Request) {
  try {
    const payload = loginSchema.parse(await req.json());

    const user = await prisma.user.findUnique({
      where: { email: payload.email.toLowerCase() },
    });

    if (!user) {
      return NextResponse.json(
        { message: "Credenciais invalidas." },
        { status: 401 },
      );
    }

    const isClientPortal = payload.role === "CLIENT";
    const canAccessPortal = isClientPortal
      ? user.role === UserRole.CLIENT
      : isAdminRole(user.role);

    if (!canAccessPortal) {
      return NextResponse.json(
        { message: "Credenciais invalidas." },
        { status: 401 },
      );
    }

    if (!user.isActive) {
      return NextResponse.json(
        {
          message:
            "Conta pendente de aprovação. Aguarde um administrador liberar seu acesso.",
        },
        { status: 403 },
      );
    }

    const validPassword = await verifyPassword(payload.password, user.passwordHash);
    if (!validPassword) {
      return NextResponse.json(
        { message: "Credenciais invalidas." },
        { status: 401 },
      );
    }

    await createSession(user.id);

    return NextResponse.json({
      id: user.id,
      name: user.name,
      email: user.email,
      role: isAdminRole(user.role) ? "admin" : "cliente",
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: "Dados de login inválidos.", issues: error.issues },
        { status: 400 },
      );
    }
    return NextResponse.json(
      { message: "Falha ao autenticar. Tente novamente." },
      { status: 500 },
    );
  }
}
