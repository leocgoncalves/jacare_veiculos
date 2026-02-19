import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const requestSchema = z.object({
  vehicleId: z.string().min(1),
  customerName: z.string().min(2),
  customerEmail: z.string().email().optional(),
  customerPhone: z.string().min(8),
  preferredDate: z.string().datetime(),
  note: z.string().optional(),
});

export async function POST(req: Request) {
  try {
    const payload = requestSchema.parse(await req.json());
    const currentUser = await getCurrentUser();

    const vehicle = await prisma.vehicle.findFirst({
      where: {
        id: payload.vehicleId,
        isPublished: true,
        isSold: false,
        deletedAt: null,
      },
      select: { id: true },
    });

    if (!vehicle) {
      return NextResponse.json(
        { message: "Veículo indisponível para test-drive." },
        { status: 404 },
      );
    }

    // Nunca confia em e-mail enviado pelo client quando há usuário autenticado.
    const resolvedEmail =
      currentUser?.email?.toLowerCase() ?? payload.customerEmail?.toLowerCase();
    if (!resolvedEmail) {
      return NextResponse.json(
        { message: "Informe um e-mail válido para registrar o test-drive." },
        { status: 400 },
      );
    }

    const request = await prisma.testDrive.create({
      data: {
        vehicleId: payload.vehicleId,
        customerName: payload.customerName,
        customerEmail: resolvedEmail,
        customerPhone: payload.customerPhone,
        preferredDate: new Date(payload.preferredDate),
        note: payload.note,
      },
    });

    return NextResponse.json({ request }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: "Dados inválidos para test-drive.", issues: error.issues },
        { status: 400 },
      );
    }
    return NextResponse.json(
      { message: "Não foi possível enviar a solicitação." },
      { status: 500 },
    );
  }
}
