import { TestDriveStatus } from "@prisma/client";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser, isAdminRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const patchSchema = z.object({
  id: z.string(),
  status: z.enum(["APPROVED", "REJECTED", "RESCHEDULED"]),
  scheduledDate: z.string().datetime().optional(),
  adminObservation: z.string().optional(),
});

export async function GET() {
  const user = await getCurrentUser();
  if (!user || !isAdminRole(user.role)) {
    return NextResponse.json({ message: "Não autorizado." }, { status: 401 });
  }

  const testDrives = await prisma.testDrive.findMany({
    include: {
      vehicle: {
        select: { id: true, name: true, year: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ testDrives });
}

export async function PATCH(req: Request) {
  const user = await getCurrentUser();
  if (!user || !isAdminRole(user.role)) {
    return NextResponse.json({ message: "Não autorizado." }, { status: 401 });
  }

  try {
    const payload = patchSchema.parse(await req.json());
    const requiresScheduledDate =
      payload.status === "APPROVED" || payload.status === "RESCHEDULED";
    if (requiresScheduledDate && !payload.scheduledDate) {
      return NextResponse.json(
        {
          message:
            "Data e horário são obrigatórios para aprovar ou reagendar test-drive.",
        },
        { status: 400 },
      );
    }

    const updated = await prisma.testDrive.update({
      where: { id: payload.id },
      data: {
        status: payload.status as TestDriveStatus,
        scheduledDate: payload.scheduledDate
          ? new Date(payload.scheduledDate)
          : undefined,
        adminObservation: payload.adminObservation,
      },
    });

    return NextResponse.json({ testDrive: updated });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: "Dados inválidos.", issues: error.issues },
        { status: 400 },
      );
    }
    return NextResponse.json(
      { message: "Falha ao atualizar test-drive." },
      { status: 500 },
    );
  }
}
