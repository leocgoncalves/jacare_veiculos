import { NextResponse } from "next/server";
import { z } from "zod";
import { hashPassword } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
});

export async function POST(req: Request) {
  try {
    const payload = registerSchema.parse(await req.json());
    const email = payload.email.toLowerCase();

    const exists = await prisma.user.findUnique({ where: { email } });
    if (exists) {
      return NextResponse.json(
        { message: "E-mail já cadastrado." },
        { status: 409 },
      );
    }

    const user = await prisma.user.create({
      data: {
        name: payload.name,
        email,
        passwordHash: await hashPassword(payload.password),
        role: "CLIENT",
        isActive: true,
      },
    });

    return NextResponse.json(
      {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          isActive: user.isActive,
        },
        message: "Cadastro realizado com sucesso.",
      },
      { status: 201 },
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: "Dados inválidos.", issues: error.issues },
        { status: 400 },
      );
    }
    return NextResponse.json(
      { message: "Falha ao registrar usuário." },
      { status: 500 },
    );
  }
}
