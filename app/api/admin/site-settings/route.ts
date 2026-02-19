import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser, isAdminRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { saveImageAsWebp } from "@/lib/upload";
import { normalizeWhatsAppUrl } from "@/lib/whatsapp";

export const runtime = "nodejs";

const settingsSchema = z.object({
  siteTitle: z.string().trim().min(2),
  logoScale: z.coerce.number().int().min(32).max(180),
  homeBackgroundColor: z
    .string()
    .trim()
    .regex(/^#([0-9A-Fa-f]{6}|[0-9A-Fa-f]{3})$/, "Cor inválida"),
  processCardsBackgroundColor: z
    .string()
    .trim()
    .regex(/^#([0-9A-Fa-f]{6}|[0-9A-Fa-f]{3})$/, "Cor inválida"),
  footerAddress: z.string().trim().min(8),
  // Permite telefone vazio para não bloquear salvamento de ajustes visuais.
  footerPhone: z
    .string()
    .trim()
    .refine((value) => value.length === 0 || value.length >= 8, {
      message: "Telefone inválido",
    }),
  footerEmail: z.string().trim().email(),
  footerHours: z.string().trim().min(6),
  instagramUrl: z.string().trim().url(),
  facebookUrl: z.string().trim().url(),
  whatsappUrl: z.string().trim().min(3),
  metaAppId: z.string().trim().optional(),
  metaAppSecret: z.string().trim().optional(),
  metaAccessToken: z.string().trim().optional(),
});

export async function GET() {
  const user = await getCurrentUser();
  if (!user || !isAdminRole(user.role)) {
    return NextResponse.json({ message: "Não autorizado." }, { status: 401 });
  }

  const settings = await prisma.siteSettings.upsert({
    where: { id: 1 },
    update: {},
    create: { id: 1 },
  });

  return NextResponse.json({ settings });
}

export async function PUT(req: Request) {
  const user = await getCurrentUser();
  if (!user || !isAdminRole(user.role)) {
    return NextResponse.json({ message: "Não autorizado." }, { status: 401 });
  }

  try {
    const formData = await req.formData();
    const logoFile = formData.get("logoFile");
    const backgroundFile = formData.get("backgroundFile");

    // Valida campos obrigatórios primeiro
    const parsedPayload = settingsSchema.parse({
      siteTitle: formData.get("siteTitle"),
      logoScale: formData.get("logoScale"),
      homeBackgroundColor: formData.get("homeBackgroundColor"),
      processCardsBackgroundColor: formData.get("processCardsBackgroundColor"),
      footerAddress: formData.get("footerAddress"),
      footerPhone: formData.get("footerPhone"),
      footerEmail: formData.get("footerEmail"),
      footerHours: formData.get("footerHours"),
      instagramUrl: formData.get("instagramUrl"),
      facebookUrl: formData.get("facebookUrl"),
      whatsappUrl: formData.get("whatsappUrl"),
      metaAppId: (formData.get("metaAppId") || undefined) as string | undefined,
      metaAppSecret: (formData.get("metaAppSecret") || undefined) as string | undefined,
      metaAccessToken: (formData.get("metaAccessToken") || undefined) as
        | string
        | undefined,
    });
    const payload = {
      ...parsedPayload,
      whatsappUrl: normalizeWhatsAppUrl(parsedPayload.whatsappUrl),
    };

    let logoUrl: string | undefined;
    if (logoFile instanceof File && logoFile.size > 0 && logoFile.type.startsWith("image/")) {
      logoUrl = (
        await saveImageAsWebp(logoFile, {
          targetRelativeDir: "uploads/branding",
          maxWidth: 700,
          quality: 90,
        })
      ).publicUrl;
    }

    let backgroundUrl: string | undefined;
    if (
      backgroundFile instanceof File &&
      backgroundFile.size > 0 &&
      backgroundFile.type.startsWith("image/")
    ) {
      backgroundUrl = (
        await saveImageAsWebp(backgroundFile, {
          targetRelativeDir: "uploads/branding",
          maxWidth: 1800,
          quality: 82,
        })
      ).publicUrl;
    }

    // Prepara dados de atualização (apenas campos que existem no schema do Prisma)
    const updateData: Record<string, unknown> = {
      siteTitle: payload.siteTitle,
      logoScale: payload.logoScale,
      homeBackgroundColor: payload.homeBackgroundColor,
      processCardsBackgroundColor: payload.processCardsBackgroundColor,
      footerAddress: payload.footerAddress,
      footerPhone: payload.footerPhone,
      footerEmail: payload.footerEmail,
      footerHours: payload.footerHours,
      instagramUrl: payload.instagramUrl,
      facebookUrl: payload.facebookUrl,
      whatsappUrl: payload.whatsappUrl,
      metaAppId: payload.metaAppId ?? null,
      metaAppSecret: payload.metaAppSecret ?? null,
      metaAccessToken: payload.metaAccessToken ?? null,
    };

    if (logoUrl) updateData.logoUrl = logoUrl;
    if (backgroundUrl) updateData.homeBackgroundUrl = backgroundUrl;

    const createData = { id: 1, ...updateData };

    const settings = await prisma.siteSettings.upsert({
      where: { id: 1 },
      update: updateData,
      create: createData,
    });

    return NextResponse.json({ settings });
  } catch (error) {
    console.error("Erro ao salvar configuracoes:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          message:
            error.issues.length > 0
              ? `Dados inválidos para configurações: ${error.issues
                  .map((issue) => issue.message)
                  .join(" | ")}`
              : "Dados inválidos para configurações.",
          issues: error.issues,
          details: error.issues,
        },
        { status: 400 },
      );
    }
    const errorMessage =
      error instanceof Error ? error.message : "Erro desconhecido";
    return NextResponse.json(
      {
        message: "Falha ao salvar configuracoes.",
        error: errorMessage,
      },
      { status: 500 },
    );
  }
}
