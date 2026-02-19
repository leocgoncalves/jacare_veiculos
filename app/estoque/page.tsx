import { Suspense } from "react";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { EstoqueClient } from "./EstoqueClient";

function isLightHexColor(hexColor: string) {
  const normalized = hexColor.replace("#", "");
  if (![3, 6].includes(normalized.length)) return false;
  const fullHex =
    normalized.length === 3
      ? normalized
          .split("")
          .map((char) => char + char)
          .join("")
      : normalized;
  const red = parseInt(fullHex.slice(0, 2), 16);
  const green = parseInt(fullHex.slice(2, 4), 16);
  const blue = parseInt(fullHex.slice(4, 6), 16);
  const luminance = (0.2126 * red + 0.7152 * green + 0.0722 * blue) / 255;
  return luminance > 0.58;
}

async function loadEstoqueTheme() {
  try {
    const settings = await prisma.siteSettings.findUnique({ where: { id: 1 } });
    const backgroundColor = settings?.homeBackgroundColor ?? "#090b10";
    const isLightTheme = isLightHexColor(backgroundColor);
    return { backgroundColor, isLightTheme };
  } catch {
    return { backgroundColor: "#090b10", isLightTheme: false };
  }
}

export default async function EstoquePage() {
  const { backgroundColor, isLightTheme } = await loadEstoqueTheme();

  return (
    <>
      <div className="border-b border-white/10 bg-[#090b10] px-4 py-3 sm:px-6">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <Link
            href="/#estoque"
            className="rounded-lg border border-white/20 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/10"
          >
            ← Voltar
          </Link>
        </div>
      </div>
      <Suspense
        fallback={
          <main
            className="flex min-h-[320px] items-center justify-center px-4 py-12 text-white/60"
            style={{ backgroundColor }}
          >
            <p>Carregando estoque...</p>
          </main>
        }
      >
        <EstoqueClient
          backgroundColor={backgroundColor}
          isLightTheme={isLightTheme}
        />
      </Suspense>
    </>
  );
}
