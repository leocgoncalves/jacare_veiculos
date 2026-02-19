import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser, isAdminRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const patchSchema = z.object({
  action: z.enum([
    "mark_sold",
    "mark_available",
    "delete_permanently",
    "publish",
    "unpublish",
  ]),
});

const updateVehicleSchema = z.object({
  brand: z.string().min(2),
  model: z.string().min(1),
  name: z.string().min(2),
  type: z.enum(["CAR", "MOTORCYCLE"]),
  year: z.coerce.number().int().min(1950).max(2100),
  km: z.coerce.number().int().min(0),
  transmission: z.string().min(2),
  fuel: z.string().min(2),
  color: z.string().min(2),
  priceInCents: z.coerce.number().int().min(1000),
  shortSpecs: z.string().min(6),
  description: z.string().optional(),
  isPublished: z.coerce.boolean().default(true),
});

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getCurrentUser();
  if (!user || !isAdminRole(user.role)) {
    return NextResponse.json({ message: "Não autorizado." }, { status: 401 });
  }

  const { id } = await params;

  try {
    const body = patchSchema.parse(await req.json());

    if (body.action === "delete_permanently") {
      await prisma.vehicle.delete({
        where: { id },
      });

      revalidatePath("/");
      revalidatePath("/estoque");
      revalidatePath(`/veiculos/${id}`);

      return NextResponse.json({ deleted: true });
    }

    const updateByAction = {
      mark_sold: { isSold: true },
      mark_available: { isSold: false },
      publish: { isPublished: true },
      unpublish: { isPublished: false },
    } as const;

    const updated = await prisma.vehicle.update({
      where: { id },
      data: updateByAction[body.action],
    });

    revalidatePath("/");
    revalidatePath("/estoque");
    revalidatePath(`/veiculos/${updated.id}`);

    return NextResponse.json({ vehicle: updated });
  } catch {
    return NextResponse.json(
      { message: "Falha ao atualizar status do veículo." },
      { status: 400 },
    );
  }
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getCurrentUser();
  if (!user || !isAdminRole(user.role)) {
    return NextResponse.json({ message: "Não autorizado." }, { status: 401 });
  }

  const { id } = await params;

  try {
    const rawBody = await req.json();
    const parsed = updateVehicleSchema.safeParse(rawBody);
    if (!parsed.success) {
      return NextResponse.json(
        {
          message: "Dados inválidos para edição.",
          issues: parsed.error.issues,
        },
        { status: 400 },
      );
    }

    const body = parsed.data;
    const normalizedDescription = body.description?.trim();
    const data = {
      brand: body.brand.trim(),
      model: body.model.trim(),
      name: body.name.trim(),
      type: body.type,
      year: body.year,
      km: body.km,
      transmission: body.transmission.trim(),
      fuel: body.fuel.trim(),
      color: body.color.trim(),
      priceInCents: body.priceInCents,
      shortSpecs: body.shortSpecs.trim(),
      description:
        normalizedDescription && normalizedDescription.length > 0
          ? normalizedDescription
          : null,
      isPublished: body.isPublished,
    } as const;
    const updated = await prisma.vehicle.update({
      where: { id },
      data,
    });

    revalidatePath("/");
    revalidatePath("/estoque");
    revalidatePath(`/veiculos/${updated.id}`);

    return NextResponse.json({ vehicle: updated });
  } catch (error) {
    return NextResponse.json(
      {
        message:
          error instanceof Error
            ? `Falha ao editar publicação: ${error.message}`
            : "Falha ao editar publicação.",
      },
      { status: 500 },
    );
  }
}
