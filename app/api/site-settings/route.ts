import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const settings = await prisma.siteSettings.upsert({
    where: { id: 1 },
    update: {},
    create: { id: 1 },
  });

  const publicSettings = {
    id: settings.id,
    siteTitle: settings.siteTitle,
    logoUrl: settings.logoUrl,
    logoScale: settings.logoScale,
    homeBackgroundUrl: settings.homeBackgroundUrl,
    homeBackgroundColor: settings.homeBackgroundColor,
    processCardsBackgroundColor: settings.processCardsBackgroundColor,
    heroVideoUrl: settings.heroVideoUrl,
    heroVideoPosterUrl: settings.heroVideoPosterUrl,
    footerAddress: settings.footerAddress,
    footerPhone: settings.footerPhone,
    footerEmail: settings.footerEmail,
    footerHours: settings.footerHours,
    instagramUrl: settings.instagramUrl,
    facebookUrl: settings.facebookUrl,
    whatsappUrl: settings.whatsappUrl,
    updatedAt: settings.updatedAt,
  };

  return NextResponse.json({ settings: publicSettings });
}
