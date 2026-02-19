import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const DEFAULT_LIMIT = 12;
const MAX_LIMIT = 24;

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const page = Math.max(1, Number(searchParams.get("page")) || 1);
  const limit = Math.min(
    MAX_LIMIT,
    Math.max(1, Number(searchParams.get("limit")) || DEFAULT_LIMIT),
  );

  const where = {
    isPublished: true,
    isSold: false,
    deletedAt: null,
  };

  const [total, vehicles] = await Promise.all([
    prisma.vehicle.count({ where }),
    prisma.vehicle.findMany({
      where,
      include: {
        images: {
          orderBy: { sortOrder: "asc" },
          take: 1,
        },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / limit));

  return NextResponse.json({
    vehicles: vehicles.map((vehicle) => ({
      id: vehicle.id,
      brand: vehicle.brand,
      model: vehicle.model,
      name: vehicle.name,
      year: vehicle.year,
      km: vehicle.km,
      transmission: vehicle.transmission,
      fuel: vehicle.fuel,
      color: vehicle.color,
      priceInCents: vehicle.priceInCents,
      shortSpecs: vehicle.shortSpecs,
      description: vehicle.description,
      type: vehicle.type,
      isWeeklyHighlight: vehicle.isWeeklyHighlight,
      imageUrl: vehicle.images[0]?.url ?? null,
      compliance: {
        laudoStatus: vehicle.laudoStatus,
        ipvaStatus: vehicle.ipvaStatus,
        manualChaveStatus: vehicle.manualChaveStatus,
        prontaEntrega: vehicle.prontaEntrega,
      },
    })),
    total,
    totalPages,
    page,
    limit,
  });
}
