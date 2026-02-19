import Image from "next/image";
import { FirstAccessModal } from "./components/FirstAccessModal";
import { FloatingWhatsApp } from "./components/FloatingWhatsApp";
import { Header } from "./components/Header";
import { HeroMediaLayer } from "./components/HeroMediaLayer";
import { VehiclePreviewShowcase } from "./components/VehiclePreviewShowcase";
import { benefits, featuredVehicles } from "./data/vehicles";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { normalizeWhatsAppUrl } from "@/lib/whatsapp";

// Força revalidação a cada 60 segundos para garantir que mudanças no admin sejam refletidas
export const revalidate = 60;

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

function formatPriceFromCents(priceInCents: number) {
  return `R$ ${(priceInCents / 100).toLocaleString("pt-BR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })}`;
}

function normalizeTextValue(value: string | null | undefined, fallback: string) {
  if (typeof value !== "string") return fallback;
  const normalized = value.trim();
  return normalized.length > 0 ? normalized : fallback;
}

async function loadSiteSettings() {
  try {
    return await prisma.siteSettings.findUnique({ where: { id: 1 } });
  } catch {
    return null;
  }
}

async function loadHomeVehicles() {
  const fallbackVehicles = featuredVehicles.map((vehicle) => ({
    id: vehicle.id,
    badge: "Veículo",
    brand: vehicle.brand,
    model: vehicle.model,
    name: vehicle.name,
    yearLabel: vehicle.year,
    kmLabel: vehicle.km,
    transmission: vehicle.transmission,
    fuel: vehicle.fuel,
    colorLabel: normalizeTextValue(vehicle.color, "Nao informado"),
    typeLabel: "Veículo",
    priceLabel: vehicle.price,
    imageUrl: vehicle.imageUrl,
    imageUrls: [vehicle.imageUrl],
    shortSpecs: vehicle.shortSpecs,
    description: vehicle.description || "Sem descrição detalhada no momento.",
    year: vehicle.year,
    km: vehicle.km,
    price: vehicle.price,
  }));

  try {
    const vehicles = await prisma.vehicle.findMany({
      where: { isPublished: true, isSold: false, deletedAt: null },
      include: {
        images: {
          orderBy: { sortOrder: "asc" },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 12,
    });

    if (vehicles.length === 0) {
      return {
        homeVehicles: fallbackVehicles,
      };
    }

    const mapped = vehicles.map((vehicle) => ({
      id: vehicle.id,
      badge: vehicle.type === "CAR" ? "Carro" : "Moto",
      brand: vehicle.brand,
      model: vehicle.model,
      name: vehicle.name,
      yearLabel: String(vehicle.year),
      kmLabel: `${vehicle.km.toLocaleString("pt-BR")} km`,
      transmission: vehicle.transmission,
      fuel: vehicle.fuel,
      colorLabel: normalizeTextValue(vehicle.color, "Nao informado"),
      typeLabel: vehicle.type === "CAR" ? "Carro" : "Moto",
      priceLabel: formatPriceFromCents(vehicle.priceInCents),
      year: String(vehicle.year),
      km: `${vehicle.km.toLocaleString("pt-BR")} km`,
      price: formatPriceFromCents(vehicle.priceInCents),
      imageUrl: vehicle.images[0]?.url ?? "/logo-jacare.png",
      imageUrls:
        vehicle.images.length > 0
          ? vehicle.images.map((image) => image.url)
          : ["/logo-jacare.png"],
      shortSpecs: vehicle.shortSpecs,
      description: vehicle.description || "Sem descrição detalhada no momento.",
    }));

    return {
      homeVehicles: mapped,
    };
  } catch {
    return {
      homeVehicles: fallbackVehicles,
    };
  }
}

export default async function Home() {
  let homeVehicles: Awaited<ReturnType<typeof loadHomeVehicles>> = {
    homeVehicles: [],
  };
  let siteSettings = null;
  let currentUser = null;

  try {
    homeVehicles = await loadHomeVehicles();
  } catch (error) {
    console.error("Erro ao carregar veículos:", error);
  }

  try {
    siteSettings = await loadSiteSettings();
  } catch (error) {
    console.error("Erro ao carregar configurações:", error);
  }

  try {
    currentUser = await getCurrentUser();
  } catch (error) {
    console.error("Erro ao carregar usuário:", error);
  }
  const logoUrl = siteSettings?.logoUrl ?? "/logo-jacare.png";
  const logoScale = siteSettings?.logoScale ?? 56;
  const homeBackgroundColor = siteSettings?.homeBackgroundColor ?? "#090b10";
  const processCardsBackgroundColor =
    siteSettings?.processCardsBackgroundColor ?? "#10141d";
  const isLightBackground = isLightHexColor(homeBackgroundColor);
  const isLightProcessCardsBackground = isLightHexColor(
    processCardsBackgroundColor,
  );
  const surfaceBorderClass = isLightBackground ? "border-black/10" : "border-white/10";
  const headerMutedTextClass = isLightBackground ? "text-[#374151]" : "text-white/60";
  const headerNavClass = isLightBackground ? "text-[#374151]" : "text-white/80";
  const headerNavHoverClass = isLightBackground
    ? "hover:text-[#111318]"
    : "hover:text-white";
  const footerTitleClass = isLightBackground ? "text-[#111318]" : "text-white";
  const footerBodyClass = isLightBackground ? "text-[#374151]" : "text-white/70";
  const footerMetaClass = isLightBackground ? "text-[#4b5563]" : "text-white/60";
  const footerIconButtonClass = isLightBackground
    ? "rounded-lg border border-black/15 p-2.5 text-sm font-medium text-[#111318] transition hover:bg-black/5"
    : "rounded-lg border border-white/20 p-2.5 text-sm font-medium transition hover:bg-white/5";
  const homeBackgroundUrl =
    siteSettings?.homeBackgroundUrl || "/carro.webp";
  const whatsappHref = normalizeWhatsAppUrl(siteSettings?.whatsappUrl);
  const heroVisualPreset: "clean" | "dramatic" = "clean";

  return (
    <div className="min-h-screen w-full overflow-x-hidden text-white" style={{ backgroundColor: homeBackgroundColor }}>
      <FirstAccessModal />
      <FloatingWhatsApp url={whatsappHref} />

      <Header
        currentUser={currentUser}
        logoUrl={logoUrl}
        logoScale={logoScale}
        isLightBackground={isLightBackground}
        showBottomBorder={false}
        surfaceBorderClass={surfaceBorderClass}
        headerMutedTextClass={headerMutedTextClass}
        headerNavClass={headerNavClass}
        headerNavHoverClass={headerNavHoverClass}
      />

      <main>
        <section
          id="hero-section"
          className="relative min-h-[60vh] overflow-hidden sm:min-h-0"
          style={{
            backgroundColor: homeBackgroundColor,
            backgroundImage: `url('${homeBackgroundUrl}')`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat",
          }}
        >
          <HeroMediaLayer
            posterUrl={homeBackgroundUrl}
            themeColor={homeBackgroundColor}
            preset={heroVisualPreset}
          />
          
          {/* Conteúdo da hero */}
          <div className="relative z-[3] mx-auto flex min-h-[60vh] w-full max-w-7xl flex-col justify-center px-4 py-12 sm:min-h-0 sm:px-6 sm:py-14 md:py-16">
            <div>
              <p className="mb-3 inline-flex rounded-full border border-[#c8a24c]/50 px-3 py-1 text-[11px] uppercase tracking-[0.14em] text-[#c8a24c] sm:mb-4 sm:text-xs sm:tracking-[0.18em]">
                Loja oficial Jacaré Veículos
              </p>
              <h1 className="animate-fade-in-up text-3xl font-bold leading-snug tracking-tight text-white sm:text-4xl sm:leading-tight md:text-6xl">
                <span className="block">Seu próximo carro ou moto</span>
                <span className="block text-[#c8a24c]">está aqui.</span>
              </h1>
              <p className="mt-4 max-w-xl text-[15px] leading-relaxed text-white/80 sm:mt-5 sm:text-base sm:text-white/75 md:text-lg">
                Estoque selecionado com critério técnico, histórico claro e
                negociação direta para você comprar com segurança.
              </p>
              <p className="mt-2.5 text-sm font-medium text-[#c8a24c] sm:mt-3">
                Agende seu test-drive e conheça o veículo de perto.
              </p>
              <div className="mt-6 sm:mt-8">
                <a
                  href="#estoque"
                  className="inline-flex min-h-[48px] w-full items-center justify-center rounded-xl bg-[#c8a24c] px-6 py-3.5 text-[15px] font-bold text-[#111318] shadow-lg shadow-[#c8a24c]/25 transition duration-300 hover:brightness-110 active:scale-[0.98] sm:w-auto sm:px-8 sm:py-4 sm:text-base md:hover:-translate-y-0.5"
                >
                  Encontrar meu carro agora
                </a>
              </div>
            </div>
          </div>
        </section>

        <section id="estoque" className="w-full py-10 sm:py-14">
          <div className="mx-auto w-full max-w-7xl px-4 sm:px-6">
          <div className="mb-8 flex items-end justify-between">
            <div>
              <h2
                className={`mt-2 text-3xl font-bold md:text-4xl ${
                  isLightBackground ? "text-[#111318]" : "text-white"
                }`}
              >
                Modelos selecionados com apresentação premium
              </h2>
            </div>
          </div>
          <VehiclePreviewShowcase
            vehicles={homeVehicles.homeVehicles || []}
            whatsappUrl={whatsappHref}
            themeColor={homeBackgroundColor}
          />

          <div
            className={`mt-10 flex flex-col items-center justify-center gap-6 rounded-2xl border py-8 px-4 text-center sm:mt-14 sm:px-6 md:flex-row md:gap-10 md:text-left ${
              isLightBackground ? "border-black/10 bg-black/[0.03]" : "border-white/10 bg-white/[0.03]"
            }`}
          >
            <p className="w-full text-sm font-semibold uppercase tracking-[0.18em] text-[#c8a24c] md:w-auto">
              Como funciona
            </p>
            <div className="flex w-full flex-col items-center gap-4 md:flex-row md:flex-wrap md:justify-center md:gap-8">
              <span className="flex items-center justify-center gap-2 md:justify-start">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#c8a24c] text-sm font-bold text-[#111318]">1</span>
                <span className={isLightBackground ? "text-[#111318]" : "text-white"}>Escolha o veículo</span>
              </span>
              <span className="hidden text-[#c8a24c]/60 md:inline" aria-hidden>→</span>
              <span className="flex items-center justify-center gap-2 md:justify-start">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#c8a24c] text-sm font-bold text-[#111318]">2</span>
                <span className={isLightBackground ? "text-[#111318]" : "text-white"}>Fale com o Jacaré</span>
              </span>
              <span className="hidden text-[#c8a24c]/60 md:inline" aria-hidden>→</span>
              <span className="flex items-center justify-center gap-2 md:justify-start">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#c8a24c] text-sm font-bold text-[#111318]">3</span>
                <span className={isLightBackground ? "text-[#111318]" : "text-white"}>Negócio fechado</span>
              </span>
            </div>
          </div>
          </div>
        </section>

        <section
          id="diferenciais"
          className="py-10 sm:py-14"
          style={{ backgroundColor: homeBackgroundColor }}
        >
          <div className="mx-auto w-full max-w-7xl px-4 sm:px-6">
            <p className="text-sm uppercase tracking-[0.18em] text-[#c8a24c]">
              Por que escolher a Jacare
            </p>
            <h2
              className={`mt-2 text-3xl font-bold md:text-4xl ${
                isLightBackground ? "text-[#111318]" : "text-white"
              }`}
            >
              Confiança e transparência em cada etapa
            </h2>
            <div className="mt-8 grid gap-4 md:grid-cols-2">
              {benefits.map((item) => (
                <div
                  key={item.text}
                  className={`flex gap-4 rounded-xl border p-5 ${
                    isLightBackground
                      ? "border-black/10 bg-black/[0.04]"
                      : "border-white/10 bg-white/[0.03]"
                  }`}
                >
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#c8a24c]/15 text-[#c8a24c]" aria-hidden>
                    {item.icon === "handshake" && (
                      <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11.5V14m0-2.5v-6a1.5 1.5 0 113 0m-3 6a1.5 1.5 0 00-3 0v2a7.5 7.5 0 0015 0v-5a1.5 1.5 0 00-3 0m-6 3V11m0-5.5v-1a7.5 7.5 0 0115 0v1m-15 0a1.5 1.5 0 013 0m0 0a1.5 1.5 0 013 0" /></svg>
                    )}
                    {item.icon === "shield" && (
                      <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                    )}
                    {item.icon === "whatsapp" && (
                      <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                    )}
                    {item.icon === "car" && (
                      <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 17a2 2 0 01-2-2V9a2 2 0 012-2h10a2 2 0 012 2v6a2 2 0 01-2 2H5zm0 0h14M5 9V7a2 2 0 012-2h10a2 2 0 012 2v2M7 13h10" /></svg>
                    )}
                  </span>
                  <p
                    className={`font-medium leading-snug ${
                      isLightBackground ? "text-[#1f2937]" : "text-white"
                    }`}
                  >
                    {item.text}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section
          id="processo"
          className="w-full py-10 sm:py-14"
          style={{ color: isLightBackground ? "#111318" : "#ffffff" }}
        >
          <div className="mx-auto w-full max-w-7xl px-4 sm:px-6">
          <p className="text-sm uppercase tracking-[0.18em] text-[#c8a24c]">
            Como funciona
          </p>
          <h2
            className={`mt-2 text-3xl font-bold md:text-4xl ${
              isLightBackground ? "text-[#111318]" : "text-white"
            }`}
          >
            Processo simples e rápido
          </h2>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {[
              "Escolha o modelo ideal no estoque",
              "Agende seu test-drive com a equipe",
              "Receba atendimento e feche negócio com segurança",
            ].map((step, idx) => (
              <div
                key={step}
                className={`rounded-xl border p-6 ${
                  isLightProcessCardsBackground
                    ? "border-black/10"
                    : "border-white/10"
                }`}
                style={{ backgroundColor: processCardsBackgroundColor }}
              >
                <p className="text-sm font-semibold text-[#c8a24c]">
                  Etapa {idx + 1}
                </p>
                <p
                  className={`mt-3 ${
                    isLightProcessCardsBackground
                      ? "text-[#1f2937]/90"
                      : "text-white/85"
                  }`}
                >
                  {step}
                </p>
              </div>
            ))}
          </div>
          </div>
        </section>

        <section id="contato" className="w-full pb-10 sm:pb-16">
          <div className="mx-auto w-full max-w-7xl px-4 sm:px-6">
          <div className="rounded-2xl border border-[#c8a24c]/30 bg-[#0f3d2e] p-6 sm:p-8 md:p-12">
            <p className="text-sm uppercase tracking-[0.18em] text-[#c8a24c]">
              Pronto para o próximo passo?
            </p>
            <h2 className="mt-2 text-3xl font-bold md:text-5xl">
              Fale com o Jacaré Veículos agora!
            </h2>
            <p className="mt-4 max-w-2xl text-white/80">
              Atendimento comercial para tirar dúvidas, apresentar opções e
              agendar visita.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <a
                href={whatsappHref}
                target="_blank"
                rel="noreferrer"
                className="rounded-xl bg-[#c8a24c] px-6 py-3 font-semibold text-[#111318] transition hover:brightness-95"
              >
                Chamar no WhatsApp
              </a>
            </div>
          </div>
          </div>
        </section>
      </main>

      <footer className={`border-t ${surfaceBorderClass}`}>
        <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
          <div className="flex flex-col items-center gap-6 border-b border-white/10 pb-8 md:flex-row md:justify-between">
            <p className={`text-center text-sm leading-relaxed ${footerBodyClass} md:text-left`}>
              <span className="font-semibold text-[#c8a24c]">Jacaré Veículos</span>
              {" "}
              — confiança do primeiro contato à entrega.
            </p>
          </div>

          <div className="mt-6 flex flex-wrap justify-center gap-4 md:justify-start">
            <span className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-medium ${surfaceBorderClass} ${footerBodyClass}`}>
              <span className="text-[#c8a24c]" aria-hidden>✓</span> Atendimento seguro
            </span>
            <span className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-medium ${surfaceBorderClass} ${footerBodyClass}`}>
              <span className="text-[#c8a24c]" aria-hidden>✓</span> Compra assistida
            </span>
            <span className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-medium ${surfaceBorderClass} ${footerBodyClass}`}>
              <span className="text-[#c8a24c]" aria-hidden>✓</span> Transparência
            </span>
          </div>

          <div className="mt-8 grid gap-8 md:grid-cols-[1.2fr_1fr_1fr]">
            <div>
              <p className="text-sm uppercase tracking-[0.18em] text-[#c8a24c]">
                {siteSettings?.siteTitle ?? "Jacaré Veículos"}
              </p>
              <p className={`mt-3 text-sm leading-6 ${footerBodyClass}`}>
                Loja especializada em carros e motos com procedência validada,
                atendimento transparente e suporte comercial rápido.
              </p>
              <div
                className={`relative mt-4 h-12 w-12 overflow-hidden rounded-lg border ${
                  isLightBackground ? "border-black/15" : "border-white/15"
                }`}
              >
                <Image
                  src={logoUrl}
                  alt="Emblema Jacaré Veículos"
                  fill
                  sizes="48px"
                  className="object-cover"
                />
              </div>
            </div>
            <div>
              <p className={`text-sm font-semibold ${footerTitleClass}`}>Endereço</p>
              <p className={`mt-3 text-sm leading-6 ${footerBodyClass}`}>
                {siteSettings?.footerAddress ??
                  "Av. Comercial, 1000 - Centro, São Paulo - SP"}
              </p>
            </div>
            <div>
              <p className={`text-sm font-semibold ${footerTitleClass}`}>
                Horário de atendimento
              </p>
              <p className={`mt-3 text-sm leading-6 ${footerBodyClass}`}>
                {siteSettings?.footerHours ??
                  "Segunda a Sexta: 08h às 18h | Sábado: 08h às 14h"}
              </p>
            </div>
          </div>

          <div className={`mt-8 border-t pt-6 ${surfaceBorderClass}`}>
            <div className="flex flex-col gap-5">
              <div className="flex gap-3">
                <a
                  href={siteSettings?.instagramUrl ?? "https://instagram.com"}
                  target="_blank"
                  rel="noreferrer"
                  aria-label="Instagram Jacaré Veículos"
                  className={footerIconButtonClass}
                >
                  <svg
                    aria-hidden="true"
                    viewBox="0 0 24 24"
                    className="h-5 w-5 fill-current"
                  >
                    <path d="M7.5 2h9A5.5 5.5 0 0 1 22 7.5v9a5.5 5.5 0 0 1-5.5 5.5h-9A5.5 5.5 0 0 1 2 16.5v-9A5.5 5.5 0 0 1 7.5 2Zm0 1.8A3.7 3.7 0 0 0 3.8 7.5v9a3.7 3.7 0 0 0 3.7 3.7h9a3.7 3.7 0 0 0 3.7-3.7v-9a3.7 3.7 0 0 0-3.7-3.7h-9Zm9.2 1.6a1.1 1.1 0 1 1 0 2.2 1.1 1.1 0 0 1 0-2.2ZM12 7a5 5 0 1 1 0 10 5 5 0 0 1 0-10Zm0 1.8a3.2 3.2 0 1 0 0 6.4 3.2 3.2 0 0 0 0-6.4Z" />
                  </svg>
                </a>
                <a
                  href={siteSettings?.facebookUrl ?? "https://facebook.com"}
                  target="_blank"
                  rel="noreferrer"
                  aria-label="Facebook Jacaré Veículos"
                  className={footerIconButtonClass}
                >
                  <svg
                    aria-hidden="true"
                    viewBox="0 0 24 24"
                    className="h-5 w-5 fill-current"
                  >
                    <path d="M13.6 22v-8.1h2.7l.4-3.2h-3.1V8.7c0-.9.3-1.6 1.6-1.6h1.7V4.3c-.3 0-1.3-.1-2.4-.1-2.4 0-4 1.4-4 4.2v2.3H8v3.2h2.5V22h3.1Z" />
                  </svg>
                </a>
                <a
                  href={whatsappHref}
                  target="_blank"
                  rel="noreferrer"
                  aria-label="WhatsApp Jacaré Veículos"
                  className={footerIconButtonClass}
                >
                  <Image
                    src="/whatsapp-footer-icon.png"
                    alt="Ícone WhatsApp"
                    width={20}
                    height={20}
                    className={`h-5 w-5 ${isLightBackground ? "" : "invert"}`}
                  />
                </a>
              </div>
              <div className={`text-sm ${footerMetaClass}`}>
                <p>
                  © {new Date().getFullYear()} Jacaré Veículos. Todos os direitos
                  reservados.
                </p>
                <p>
                  {siteSettings?.footerEmail ?? "contato@jacareveiculos.com.br"} |
                  {" "}
                  {siteSettings?.footerPhone ?? "(11) 0000-0000"}
                </p>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
