import { ComplianceStatus, VehicleType } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser, isAdminRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { saveVehicleImageAsWebp } from "@/lib/upload";

export const runtime = "nodejs";

const statusSchema = z.enum(["OK", "PENDING"]);

const vehicleSchema = z.object({
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
  isWeeklyHighlight: z.coerce.boolean().default(false),
  laudoStatus: statusSchema.optional(),
  ipvaStatus: statusSchema.optional(),
  manualChaveStatus: statusSchema.optional(),
  prontaEntrega: statusSchema.optional(),
});

function parseBoolean(value: FormDataEntryValue | null, fallback = false) {
  if (value === null) return fallback;
  return value === "true" || value === "on" || value === "1";
}

export async function GET() {
  const user = await getCurrentUser();
  if (!user || !isAdminRole(user.role)) {
    return NextResponse.json({ message: "Não autorizado." }, { status: 401 });
  }

  const vehicles = await prisma.vehicle.findMany({
    include: { images: { orderBy: { sortOrder: "asc" } } },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ vehicles });
}

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user || !isAdminRole(user.role)) {
    return NextResponse.json({ message: "Não autorizado." }, { status: 401 });
  }

  try {
    const formData = await req.formData();
    const files = formData
      .getAll("images")
      .filter((item): item is File => item instanceof File && item.size > 0);

    const payload = vehicleSchema.parse({
      brand: formData.get("brand"),
      model: formData.get("model"),
      name: formData.get("name"),
      type: formData.get("type"),
      year: formData.get("year"),
      km: formData.get("km"),
      transmission: formData.get("transmission"),
      fuel: formData.get("fuel"),
      color: formData.get("color"),
      priceInCents: formData.get("priceInCents"),
      shortSpecs: formData.get("shortSpecs"),
      description: formData.get("description") || undefined,
      isPublished: parseBoolean(formData.get("isPublished"), true),
      isWeeklyHighlight: parseBoolean(formData.get("isWeeklyHighlight"), false),
      laudoStatus: formData.get("laudoStatus") || undefined,
      ipvaStatus: formData.get("ipvaStatus") || undefined,
      manualChaveStatus: formData.get("manualChaveStatus") || undefined,
      prontaEntrega: formData.get("prontaEntrega") || undefined,
    });

    if (files.length === 0) {
      return NextResponse.json(
        { message: "Envie pelo menos uma imagem do veículo." },
        { status: 400 },
      );
    }

    if (files.some((file) => !file.type.startsWith("image/"))) {
      return NextResponse.json(
        { message: "Formato de arquivo inválido." },
        { status: 400 },
      );
    }

    const convertedImages = await Promise.all(
      files.map((file) => saveVehicleImageAsWebp(file)),
    );

    const baseData = {
      brand: payload.brand,
      model: payload.model,
      name: payload.name,
      type: payload.type as VehicleType,
      year: payload.year,
      km: payload.km,
      transmission: payload.transmission,
      fuel: payload.fuel,
      color: payload.color,
      priceInCents: payload.priceInCents,
      shortSpecs: payload.shortSpecs,
      description: payload.description,
      isPublished: payload.isPublished,
      isWeeklyHighlight: payload.isWeeklyHighlight,
      ...(payload.laudoStatus
        ? { laudoStatus: payload.laudoStatus as ComplianceStatus }
        : {}),
      ...(payload.ipvaStatus
        ? { ipvaStatus: payload.ipvaStatus as ComplianceStatus }
        : {}),
      ...(payload.manualChaveStatus
        ? { manualChaveStatus: payload.manualChaveStatus as ComplianceStatus }
        : {}),
      ...(payload.prontaEntrega
        ? { prontaEntrega: payload.prontaEntrega as ComplianceStatus }
        : {}),
      createdById: user.id,
      images: {
        create: convertedImages.map((image, index) => ({
          url: image.publicUrl,
          alt: payload.name,
          sortOrder: index,
        })),
      },
    } as const;
    const vehicle = await prisma.vehicle.create({
      data: baseData,
      include: { images: true },
    });

    revalidatePath("/");
    revalidatePath("/estoque");
    revalidatePath(`/veiculos/${vehicle.id}`);

    return NextResponse.json({ vehicle }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: "Dados do veículo inválidos.", issues: error.issues },
        { status: 400 },
      );
    }
    return NextResponse.json(
      { message: "Erro ao cadastrar veículo." },
      { status: 500 },
    );
  }
}
