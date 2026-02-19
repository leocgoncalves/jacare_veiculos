import { NextResponse } from "next/server";
import { UserRole } from "@prisma/client";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getCurrentUser();
  if (!user || user.role !== UserRole.CLIENT || !user.isActive) {
    return NextResponse.json({ message: "Não autorizado." }, { status: 401 });
  }

  const { id } = await params;
  if (!id) {
    return NextResponse.json({ message: "Solicitação inválida." }, { status: 400 });
  }

  const deleted = await prisma.testDrive.deleteMany({
    where: {
      id,
      customerEmail: user.email.toLowerCase(),
    },
  });

  if (deleted.count === 0) {
    return NextResponse.json(
      { message: "Solicitação não encontrada para este usuário." },
      { status: 404 },
    );
  }

  return NextResponse.json({ ok: true });
}
