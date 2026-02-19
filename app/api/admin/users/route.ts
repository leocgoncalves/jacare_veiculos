import { UserRole } from "@prisma/client";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser, hashPassword } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const PRINCIPAL_ADMIN_EMAIL = "leo_cardoso1003@hotmail.com";

const actionSchema = z.object({
  userId: z.string().min(1),
  action: z.enum(["approve_admin", "reject_admin", "remove_admin"]),
});

const createAdminSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
});

function isSuperAdminRole(role: UserRole) {
  return role === UserRole.SUPER_ADMIN;
}

async function getSuperAdminOrReject() {
  const admin = await getCurrentUser();
  if (!admin) {
    return null;
  }

  if (isSuperAdminRole(admin.role)) {
    return admin;
  }

  if (admin.email.toLowerCase() === PRINCIPAL_ADMIN_EMAIL && admin.role === UserRole.ADMIN) {
    const promoted = await prisma.user.update({
      where: { id: admin.id },
      data: { role: UserRole.SUPER_ADMIN, isActive: true },
    });
    return promoted;
  }

  return null;
}

export async function GET() {
  const admin = await getSuperAdminOrReject();
  if (!admin) {
    return NextResponse.json(
      { message: "Apenas o administrador principal pode gerenciar administradores." },
      { status: 403 },
    );
  }

  const pendingAdmins = await prisma.user.findMany({
    where: { role: UserRole.ADMIN, isActive: false },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      email: true,
      createdAt: true,
    },
  });

  const admins = await prisma.user.findMany({
    where: { role: { in: [UserRole.ADMIN, UserRole.SUPER_ADMIN] } },
    orderBy: [{ role: "desc" }, { createdAt: "desc" }],
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isActive: true,
      createdAt: true,
    },
  });

  return NextResponse.json({ pendingAdmins, admins });
}

export async function POST(req: Request) {
  const admin = await getSuperAdminOrReject();
  if (!admin) {
    return NextResponse.json(
      { message: "Apenas o administrador principal pode cadastrar administradores." },
      { status: 403 },
    );
  }

  try {
    const payload = createAdminSchema.parse(await req.json());
    const email = payload.email.toLowerCase();

    const exists = await prisma.user.findUnique({ where: { email } });
    if (exists) {
      return NextResponse.json({ message: "E-mail já cadastrado." }, { status: 409 });
    }

    const user = await prisma.user.create({
      data: {
        name: payload.name.trim(),
        email,
        passwordHash: await hashPassword(payload.password),
        role: UserRole.ADMIN,
        isActive: true,
        approvedById: admin.id,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    });

    return NextResponse.json(
      { user, message: "Administrador criado com sucesso." },
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
      { message: "Falha ao cadastrar administrador." },
      { status: 500 },
    );
  }
}

export async function PATCH(req: Request) {
  const admin = await getSuperAdminOrReject();
  if (!admin) {
    return NextResponse.json(
      { message: "Apenas o administrador principal pode gerenciar administradores." },
      { status: 403 },
    );
  }

  try {
    const payload = actionSchema.parse(await req.json());

    if (payload.action === "approve_admin" || payload.action === "reject_admin") {
      const candidate = await prisma.user.findFirst({
        where: { id: payload.userId, role: UserRole.ADMIN, isActive: false },
        select: { id: true },
      });

      if (!candidate) {
        return NextResponse.json(
          { message: "Cadastro de admin pendente não encontrado." },
          { status: 404 },
        );
      }

      if (payload.action === "approve_admin") {
        await prisma.user.update({
          where: { id: payload.userId },
          data: {
            isActive: true,
            approvedById: admin.id,
          },
        });
        return NextResponse.json({ ok: true });
      }

      await prisma.user.delete({ where: { id: payload.userId } });
      return NextResponse.json({ ok: true });
    }

    const managedAdmin = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { id: true, role: true, isActive: true },
    });

    if (!managedAdmin || managedAdmin.role !== UserRole.ADMIN || !managedAdmin.isActive) {
      return NextResponse.json(
        { message: "Administrador ativo não encontrado." },
        { status: 404 },
      );
    }

    if (managedAdmin.id === admin.id) {
      return NextResponse.json(
        { message: "Não é permitido remover o próprio acesso." },
        { status: 400 },
      );
    }

    await prisma.user.update({
      where: { id: managedAdmin.id },
      data: {
        isActive: false,
        approvedById: admin.id,
      },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: "Dados inválidos.", issues: error.issues },
        { status: 400 },
      );
    }
    return NextResponse.json(
      { message: "Falha ao atualizar cadastro de administrador." },
      { status: 500 },
    );
  }
}
