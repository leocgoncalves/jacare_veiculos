"use client";

import Image from "next/image";
import { useMemo, useState, type ReactNode } from "react";
import { normalizeWhatsAppUrl } from "@/lib/whatsapp";
import { brandTokens, getModalTheme } from "@/app/styles/tokens";

type VehiclePreviewItem = {
  id: string;
  badge: string;
  brand: string;
  model: string;
  name: string;
  yearLabel: string;
  kmLabel: string;
  transmission: string;
  fuel: string;
  colorLabel: string;
  typeLabel: string;
  priceLabel: string;
  imageUrl: string;
  imageUrls?: string[];
  description: string;
  shortSpecs: string;
};

const BRAND_LOGOS: Record<string, string> = {
  fiat: "/brands/fiat.svg",
  ford: "/brands/ford.svg",
  chevrolet: "/brands/chevrolet.png",
  volkswagen: "/brands/volkswagen.svg",
  toyota: "/brands/toyota.svg",
  hyundai: "/brands/hyundai.svg",
  hondaMoto: "/brands/honda-moto.svg",
  hondaCar: "/brands/honda-car.svg",
  yamaha: "/brands/yamaha.svg",
};

function resolveBrandLogo(brand: string, typeLabel?: string) {
  const normalized = brand.trim().toLowerCase();
  if (!normalized) return null;
  const normalizedType = typeLabel?.trim().toLowerCase() ?? "";

  if (normalized.includes("chevrolet") || normalized === "gm") {
    return BRAND_LOGOS.chevrolet;
  }
  if (normalized.includes("volks")) {
    return BRAND_LOGOS.volkswagen;
  }
  if (normalized.includes("toyota")) {
    return BRAND_LOGOS.toyota;
  }
  if (normalized.includes("hyundai")) {
    return BRAND_LOGOS.hyundai;
  }
  if (normalized.includes("honda")) {
    return normalizedType.includes("moto")
      ? BRAND_LOGOS.hondaMoto
      : BRAND_LOGOS.hondaCar;
  }
  if (normalized.includes("yamaha")) {
    return BRAND_LOGOS.yamaha;
  }
  if (normalized.includes("ford")) {
    return BRAND_LOGOS.ford;
  }
  if (normalized.includes("fiat")) {
    return BRAND_LOGOS.fiat;
  }

  return null;
}

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

function formatPhoneToPtBr(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  const ddd = digits.slice(0, 2);
  const first = digits.slice(2, 3);
  const middle = digits.slice(3, 7);
  const last = digits.slice(7, 11);

  if (!ddd) return "";
  if (digits.length <= 2) return `(${ddd}`;
  if (digits.length <= 3) return `(${ddd}) ${first}`;
  if (digits.length <= 7) return `(${ddd}) ${first}-${middle}`;
  return `(${ddd}) ${first}-${middle}-${last}`;
}

function formatDateToIso(value: Date) {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatDateToPtBr(value: string) {
  if (!value) return "Selecione o dia";
  const [year, month, day] = value.split("-");
  if (!year || !month || !day) return "Selecione o dia";
  return `${day}/${month}/${year}`;
}

function formatHourToPtBr(value: string) {
  if (!value) return "Selecione o horário";
  return value;
}

function addMonths(value: Date, months: number) {
  return new Date(value.getFullYear(), value.getMonth() + months, 1);
}

function getMonthLabel(value: Date) {
  return new Intl.DateTimeFormat("pt-BR", {
    month: "long",
    year: "numeric",
  }).format(value);
}

function buildMonthGrid(value: Date) {
  const year = value.getFullYear();
  const month = value.getMonth();
  const firstDayWeekIndex = (new Date(year, month, 1).getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const totalCells = Math.ceil((firstDayWeekIndex + daysInMonth) / 7) * 7;

  return Array.from({ length: totalCells }, (_, index) => {
    const dayNumber = index - firstDayWeekIndex + 1;
    if (dayNumber < 1 || dayNumber > daysInMonth) {
      return null;
    }
    return new Date(year, month, dayNumber);
  });
}

export function VehiclePreviewShowcase({
  vehicles,
  whatsappUrl,
  themeColor = "#0b0f18",
}: {
  vehicles: VehiclePreviewItem[];
  whatsappUrl?: string;
  themeColor?: string;
}) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [showTestDriveForm, setShowTestDriveForm] = useState(false);
  const [testDriveForm, setTestDriveForm] = useState({
    fullName: "",
    phone: "",
    preferredDay: "",
    preferredHour: "",
  });
  const [isSubmittingTestDrive, setIsSubmittingTestDrive] = useState(false);
  const [testDriveMessage, setTestDriveMessage] = useState<string | null>(null);
  const [showCalendar, setShowCalendar] = useState(false);
  const [showTimeGrid, setShowTimeGrid] = useState(false);
  const [isShareSheetOpen, setIsShareSheetOpen] = useState(false);
  const [isImageFullscreen, setIsImageFullscreen] = useState(false);
  const [calendarCursor, setCalendarCursor] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });

  const selectedVehicle = useMemo(
    () => vehicles.find((item) => item.id === selectedId) ?? null,
    [selectedId, vehicles],
  );
  const selectedImages = useMemo(() => {
    if (!selectedVehicle) {
      return [];
    }

    if (selectedVehicle.imageUrls && selectedVehicle.imageUrls.length > 0) {
      return selectedVehicle.imageUrls;
    }

    return [selectedVehicle.imageUrl];
  }, [selectedVehicle]);

  const currentImageUrl =
    selectedImages[activeImageIndex] ??
    selectedVehicle?.imageUrl ??
    "/logo-jacare.png";
  const selectedBrandLogo = selectedVehicle
    ? resolveBrandLogo(selectedVehicle.brand, selectedVehicle.typeLabel)
    : null;
  const isLightTheme = isLightHexColor(themeColor);
  const modalTheme = getModalTheme(isLightTheme);
  const modalTextClass = modalTheme.textPrimary;
  const modalMutedTextClass = modalTheme.textMuted;
  const modalLabelMutedTextClass = modalTheme.textLabel;
  const modalBorderClass = modalTheme.borderMedium;
  const modalSoftCardClass = modalTheme.softCard;
  const modalInputClass = modalTheme.input;
  const modalBaseBackground = modalTheme.baseBackground;
  const calendarDays = useMemo(() => buildMonthGrid(calendarCursor), [calendarCursor]);
  const weekLabels = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];
  const timeOptions = useMemo(() => {
    const startMinutes = 8 * 60;
    return Array.from({ length: 25 }, (_, idx) => {
      const minutes = startMinutes + idx * 30;
      const hour = String(Math.floor(minutes / 60)).padStart(2, "0");
      const minute = String(minutes % 60).padStart(2, "0");
      return `${hour}:${minute}`;
    });
  }, []);

  function handleNextImage() {
    if (selectedImages.length <= 1) return;
    setActiveImageIndex((current) => (current + 1) % selectedImages.length);
  }

  function handlePrevImage() {
    if (selectedImages.length <= 1) return;
    setActiveImageIndex(
      (current) => (current - 1 + selectedImages.length) % selectedImages.length,
    );
  }

  function openVehicleWhatsAppContact(vehicleId: string, vehicleName: string) {
    if (typeof window === "undefined") return;

    const baseUrl = normalizeWhatsAppUrl(whatsappUrl);
    const vehicleUrl = getVehicleShareUrl(vehicleId);
    const message = [
      `Olá! Tenho interesse no veículo ${vehicleName}.`,
      "Poderia me passar mais informações?",
      `Link do anúncio: ${vehicleUrl}`,
    ].join("\n");
    const separator = baseUrl.includes("?") ? "&" : "?";
    window.open(`${baseUrl}${separator}text=${encodeURIComponent(message)}`, "_blank");
  }

  function getVehicleShareUrl(vehicleId: string) {
    if (typeof window === "undefined") {
      return `/veiculos/${vehicleId}`;
    }
    return `${window.location.origin}/veiculos/${vehicleId}`;
  }

  async function copyVehicleLink(vehicleId: string) {
    try {
      const url = getVehicleShareUrl(vehicleId);
      if (typeof navigator !== "undefined" && navigator.clipboard) {
        await navigator.clipboard.writeText(url);
        setTestDriveMessage("Link copiado com sucesso.");
      } else {
        setTestDriveMessage("Não foi possível copiar automaticamente.");
      }
    } catch {
      setTestDriveMessage("Não foi possível copiar o link.");
    }
  }

  function shareVehicleOnWhatsApp(vehicleId: string, vehicleName: string) {
    const url = getVehicleShareUrl(vehicleId);
    const text = `Confira este veículo na Jacaré Veículos: ${vehicleName} - ${url}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
  }

  function shareVehicleOnFacebook(vehicleId: string) {
    const url = getVehicleShareUrl(vehicleId);
    window.open(
      `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
      "_blank",
    );
  }

  async function shareVehicleOnInstagram(vehicleId: string) {
    await copyVehicleLink(vehicleId);
    window.open("https://www.instagram.com/", "_blank");
    setTestDriveMessage(
      "Instagram aberto. O link do veículo foi copiado para você colar na conversa.",
    );
  }

  async function handleNativeShare(vehicleId: string, vehicleName: string) {
    if (typeof navigator === "undefined" || !navigator.share) {
      return false;
    }

    try {
      await navigator.share({
        title: `Jacaré Veículos - ${vehicleName}`,
        text: `Confira este veículo na Jacaré Veículos: ${vehicleName}`,
        url: getVehicleShareUrl(vehicleId),
      });
      return true;
    } catch {
      return false;
    }
  }

  async function handleShareClick(vehicleId: string, vehicleName: string) {
    const wasShared = await handleNativeShare(vehicleId, vehicleName);
    if (wasShared) {
      return;
    }
    setIsShareSheetOpen(true);
  }

  function closeShareSheet() {
    setIsShareSheetOpen(false);
  }

  function shareViaWhatsAppFromSheet(vehicleId: string, vehicleName: string) {
    shareVehicleOnWhatsApp(vehicleId, vehicleName);
    closeShareSheet();
  }

  function shareViaFacebookFromSheet(vehicleId: string) {
    shareVehicleOnFacebook(vehicleId);
    closeShareSheet();
  }

  async function shareViaInstagramFromSheet(vehicleId: string) {
    await shareVehicleOnInstagram(vehicleId);
    closeShareSheet();
  }

  async function copyVehicleLinkFromSheet(vehicleId: string) {
    await copyVehicleLink(vehicleId);
    closeShareSheet();
  }

  function resetTestDriveState() {
    setShowTestDriveForm(false);
    setIsSubmittingTestDrive(false);
    setTestDriveMessage(null);
    setTestDriveForm({
      fullName: "",
      phone: "",
      preferredDay: "",
      preferredHour: "",
    });
    setShowCalendar(false);
    setShowTimeGrid(false);
    setIsShareSheetOpen(false);
    setIsImageFullscreen(false);
  }

  async function submitTestDriveRequest() {
    if (!selectedVehicle) return;

    const fullName = testDriveForm.fullName.trim();
    const phone = testDriveForm.phone.trim();
    const preferredDay = testDriveForm.preferredDay.trim();
    const preferredHour = testDriveForm.preferredHour.trim();

    if (!fullName || !phone || !preferredDay || !preferredHour) {
      setTestDriveMessage(
        "Preencha os campos obrigatórios: Nome completo, Telefone, Dia e Horário.",
      );
      return;
    }

    const preferredDate = new Date(`${preferredDay}T${preferredHour}:00`);
    if (Number.isNaN(preferredDate.getTime())) {
      setTestDriveMessage("Data ou horário inválido para o agendamento.");
      return;
    }

    setIsSubmittingTestDrive(true);
    setTestDriveMessage(null);

    try {
      const response = await fetch("/api/test-drives", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vehicleId: selectedVehicle.id,
          customerName: fullName,
          customerPhone: phone,
          preferredDate: preferredDate.toISOString(),
        }),
      });

      const body = (await response.json()) as { message?: string };
      if (!response.ok) {
        throw new Error(body.message || "Falha ao enviar solicitação de test-drive.");
      }

      setTestDriveMessage(
        "Solicitação enviada com sucesso. O administrador irá aprovar, recusar ou reagendar.",
      );
      setTestDriveForm({
        fullName: "",
        phone: "",
        preferredDay: "",
        preferredHour: "",
      });
      setShowTestDriveForm(false);
    } catch (error) {
      setTestDriveMessage(
        error instanceof Error
          ? error.message
          : "Não foi possível enviar a solicitação.",
      );
    } finally {
      setIsSubmittingTestDrive(false);
    }
  }

  return (
    <>
      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {vehicles.map((vehicle) => (
          <button
            key={vehicle.id}
            type="button"
            onClick={() => {
              setSelectedId(vehicle.id);
              setActiveImageIndex(0);
              resetTestDriveState();
            }}
            className="group overflow-hidden rounded-[28px] border border-slate-200 bg-[#f7f8fb] text-left shadow-[0_14px_34px_rgba(16,24,40,0.08)] transition hover:-translate-y-0.5 hover:shadow-[0_18px_36px_rgba(16,24,40,0.14)]"
          >
            <div className="relative h-[238px] overflow-hidden">
              <Image
                src={vehicle.imageUrl}
                alt={`Foto de ${vehicle.name}`}
                fill
                sizes="(max-width: 1200px) 100vw, 360px"
                className="object-cover transition duration-500 group-hover:scale-[1.03]"
              />
              <span className="absolute bottom-4 right-4 rounded-full bg-[#c8a24c] px-5 py-2 text-xs font-bold uppercase tracking-[0.1em] text-[#111318]">
                Ver detalhes
              </span>
            </div>

            <div className="space-y-5 px-7 pb-7 pt-6 text-[#111827]">
              <div>
                <div className="flex items-center gap-2">
                  {resolveBrandLogo(vehicle.brand, vehicle.typeLabel) ? (
                    <Image
                      src={resolveBrandLogo(vehicle.brand, vehicle.typeLabel) as string}
                      alt={`Logo ${vehicle.brand}`}
                      width={18}
                      height={18}
                      className="h-[18px] w-[18px] rounded-sm bg-[#111827]/5 p-0.5"
                      unoptimized
                    />
                  ) : null}
                  <p className="text-[11px] font-semibold uppercase tracking-[0.4em] text-[#c8a24c]">
                    {vehicle.brand}
                  </p>
                </div>
                <h3 className="mt-2 text-2xl font-bold leading-tight text-[#111827]">
                  {vehicle.model}
                </h3>
                <p className="mt-1 text-sm text-slate-500">{vehicle.yearLabel} · {vehicle.kmLabel}</p>
              </div>

              <div className="grid grid-cols-1 gap-y-3 border-t border-slate-200 pt-4 text-sm sm:grid-cols-3 sm:gap-x-4 sm:gap-y-2">
                <div className="flex min-w-0 items-baseline justify-between gap-2 sm:flex-col sm:justify-start">
                  <p className="shrink-0 text-[11px] uppercase tracking-[0.12em] text-slate-400">
                    Ano
                  </p>
                  <p className="font-semibold text-slate-800 sm:mt-1">{vehicle.yearLabel}</p>
                </div>
                <div className="flex min-w-0 items-baseline justify-between gap-2 sm:flex-col sm:justify-start">
                  <p className="shrink-0 text-[11px] uppercase tracking-[0.12em] text-slate-400">
                    Quilometragem
                  </p>
                  <p className="min-w-0 truncate text-right font-semibold text-slate-800 sm:mt-1 sm:overflow-visible sm:whitespace-normal sm:text-left">
                    {vehicle.kmLabel}
                  </p>
                </div>
                <div className="flex min-w-0 items-baseline justify-between gap-2 sm:flex-col sm:justify-start">
                  <p className="shrink-0 text-[11px] uppercase tracking-[0.12em] text-slate-400">
                    Câmbio
                  </p>
                  <p className="min-w-0 truncate text-right font-semibold text-slate-800 sm:mt-1 sm:overflow-visible sm:whitespace-normal sm:text-left">
                    {vehicle.transmission}
                  </p>
                </div>
              </div>

              <div className="flex items-end justify-between gap-3 rounded-xl border-2 border-[#c8a24c]/25 bg-[#c8a24c]/5 px-4 py-4">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#c8a24c]">
                    Preço
                  </p>
                  <p className="mt-1 text-3xl font-black tracking-tight text-[#0f3d2e]">
                    {vehicle.priceLabel}
                  </p>
                </div>
                <span className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#0f3d2e] text-xl font-bold text-[#f6d784]">
                  →
                </span>
              </div>
            </div>
          </button>
        ))}
      </div>

      {selectedVehicle ? (
        <div
          className={`fixed inset-0 z-[90] ${brandTokens.colors.darkBackdropClass} backdrop-blur-sm`}
        >
          <div className="mx-auto flex h-full w-full max-w-7xl items-stretch px-4 py-4 md:px-8 md:py-6">
            <div
              className={`grid h-full w-full overflow-hidden ${brandTokens.radius.modal} border ${brandTokens.shadow.modal} lg:grid-cols-[1.1fr_0.9fr] ${modalBorderClass} ${modalTextClass}`}
              style={{ backgroundColor: modalBaseBackground }}
            >
              <div
                className={`relative min-h-[56vh] ${modalTheme.photoBackgroundClass} lg:min-h-full`}
              >
                <button
                  type="button"
                  onClick={() => {
                    setSelectedId(null);
                    setActiveImageIndex(0);
                    resetTestDriveState();
                  }}
                  className="absolute right-4 top-4 z-20 rounded-full border border-[#c8a24c]/50 bg-[#0d241f]/75 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-[#f4cd74] transition hover:bg-[#c8a24c]/15 hover:text-[#f6ddb0]"
                >
                  Fechar
                </button>
                <button
                  type="button"
                  onClick={() => setIsImageFullscreen(true)}
                  className="absolute inset-0 z-[1]"
                  aria-label="Abrir visualização em tela cheia"
                >
                  <Image
                    src={currentImageUrl}
                    alt={`Foto de ${selectedVehicle.name}`}
                    fill
                    sizes="(max-width: 1024px) 100vw, 60vw"
                    className="object-contain"
                  />
                </button>
                {selectedImages.length > 1 ? (
                  <>
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        handlePrevImage();
                      }}
                      aria-label="Imagem anterior"
                      className={`absolute left-4 top-1/2 z-10 inline-flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border text-2xl transition ${isLightTheme ? "border-black/20 bg-white/65 text-[#111318] hover:bg-white/85" : "border-emerald-100/25 bg-[#0d241f]/65 text-white hover:bg-[#12322b]/85"}`}
                    >
                      ‹
                    </button>
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        handleNextImage();
                      }}
                      aria-label="Próxima imagem"
                      className={`absolute right-4 top-1/2 z-10 inline-flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border text-2xl transition ${isLightTheme ? "border-black/20 bg-white/65 text-[#111318] hover:bg-white/85" : "border-emerald-100/25 bg-[#0d241f]/65 text-white hover:bg-[#12322b]/85"}`}
                    >
                      ›
                    </button>
                  </>
                ) : null}
                {selectedImages.length > 1 ? (
                  <p
                    className={`absolute bottom-4 left-1/2 z-10 -translate-x-1/2 rounded-full border px-2.5 py-0.5 text-[10px] font-medium ${
                      isLightTheme
                        ? "border-black/15 bg-white/45 text-[#111318]/80"
                        : "border-white/15 bg-black/35 text-white/75"
                    }`}
                  >
                    {activeImageIndex + 1}/{selectedImages.length}
                  </p>
                ) : null}
                <div
                  className={`pointer-events-none absolute inset-0 hidden lg:block ${
                    isLightTheme
                      ? "bg-gradient-to-t from-white/75 via-transparent to-transparent"
                      : "bg-gradient-to-t from-[#0d241f]/78 via-transparent to-transparent"
                  }`}
                />
                <div className="absolute bottom-6 left-6 right-6 z-10 hidden lg:block">
                  <div className="flex items-center gap-2 text-sm uppercase tracking-[0.25em] text-[#f4cd74]">
                    {selectedBrandLogo ? (
                      <Image
                        src={selectedBrandLogo}
                        alt={`Logo ${selectedVehicle.brand}`}
                        width={22}
                        height={22}
                        className="h-[22px] w-[22px] rounded-sm bg-white/5 p-0.5"
                        unoptimized
                      />
                    ) : null}
                    <p>{selectedVehicle.brand}</p>
                  </div>
                  <h3 className={`mt-2 text-4xl font-bold ${modalTextClass}`}>
                    {selectedVehicle.name}
                  </h3>
                  <p className={`mt-2 text-sm ${modalMutedTextClass}`}>
                    {selectedVehicle.shortSpecs}
                  </p>
                </div>
              </div>

              <aside
                className={`relative -mt-6 flex h-full flex-col overflow-y-auto ${brandTokens.radius.panelTop} border-t ${modalTheme.borderSoft} ${modalTheme.panelBackgroundClass} ${brandTokens.spacing.panel} md:mt-0 md:rounded-none md:border-t-0 md:bg-transparent`}
              >
                <div className="mt-2 lg:hidden">
                  <div className="flex items-center gap-2 text-sm uppercase tracking-[0.25em] text-[#f4cd74]">
                    {selectedBrandLogo ? (
                      <Image
                        src={selectedBrandLogo}
                        alt={`Logo ${selectedVehicle.brand}`}
                        width={22}
                        height={22}
                        className="h-[22px] w-[22px] rounded-sm bg-white/5 p-0.5"
                        unoptimized
                      />
                    ) : null}
                    <p>{selectedVehicle.brand}</p>
                  </div>
                  <h3 className={`mt-2 text-3xl font-bold ${modalTextClass}`}>
                    {selectedVehicle.name}
                  </h3>
                  <p className={`mt-2 text-sm ${modalMutedTextClass}`}>
                    {selectedVehicle.shortSpecs}
                  </p>
                </div>

                <div className="mt-6 border-b border-white/10 pb-5">
                  <p className="text-xs uppercase tracking-[0.2em] text-[#f4cd74]">
                    Informações complementares
                  </p>
                  <p className="mt-3 text-4xl font-black text-[#f4cd74]">
                    {selectedVehicle.priceLabel}
                  </p>
                </div>

                <div className="mt-5 grid grid-cols-2 gap-3">
                  <DetailCard
                    label="Ano"
                    value={selectedVehicle.yearLabel}
                    isLightTheme={isLightTheme}
                  />
                  <DetailCard
                    label="Modelo"
                    value={selectedVehicle.model}
                    isLightTheme={isLightTheme}
                  />
                  <DetailCard
                    label="Quilometragem"
                    value={selectedVehicle.kmLabel}
                    isLightTheme={isLightTheme}
                  />
                  <DetailCard
                    label="Câmbio"
                    value={selectedVehicle.transmission}
                    isLightTheme={isLightTheme}
                  />
                  <DetailCard
                    label="Combustível"
                    value={selectedVehicle.fuel}
                    isLightTheme={isLightTheme}
                  />
                  <DetailCard
                    label="Cor"
                    value={selectedVehicle.colorLabel}
                    isLightTheme={isLightTheme}
                  />
                </div>

                <div className={`mt-5 rounded-2xl border p-4 ${modalSoftCardClass}`}>
                  <p className={`text-xs uppercase tracking-[0.14em] ${modalLabelMutedTextClass}`}>
                    Descrição do veículo
                  </p>
                  <p className={`mt-2 text-sm leading-relaxed ${modalMutedTextClass}`}>
                    {selectedVehicle.description}
                  </p>
                </div>

                {showTestDriveForm ? (
                  <div
                    className={`mt-6 rounded-2xl border p-4 ${
                      isLightTheme
                        ? "border-[#c8a24c]/45 bg-black/[0.06]"
                        : "border-[#c8a24c]/35 bg-[#163930]"
                    }`}
                  >
                    <p className="text-xs uppercase tracking-[0.14em] text-[#f4cd74]">
                      Agendamento de test-drive
                    </p>
                    <div className="mt-3 grid gap-3">
                      <label className="text-sm">
                        Nome completo
                        <input
                          required
                          value={testDriveForm.fullName}
                          onChange={(event) =>
                            setTestDriveForm((prev) => ({
                              ...prev,
                              fullName: event.target.value,
                            }))
                          }
                          className={`mt-1.5 w-full rounded-lg border px-3 py-2 text-sm ${modalInputClass}`}
                        />
                      </label>
                      <label className="text-sm">
                        Telefone
                        <input
                          required
                          type="tel"
                          inputMode="numeric"
                          maxLength={16}
                          placeholder="(69) 9-9999-9999"
                          value={testDriveForm.phone}
                          onChange={(event) =>
                            setTestDriveForm((prev) => ({
                              ...prev,
                              phone: formatPhoneToPtBr(event.target.value),
                            }))
                          }
                          className={`mt-1.5 w-full rounded-lg border px-3 py-2 text-sm ${modalInputClass}`}
                        />
                      </label>
                      <div className="grid gap-3 sm:grid-cols-2">
                        <div className="relative text-sm">
                          <p className="text-sm">Dia para test-drive</p>
                          <button
                            type="button"
                            onClick={() => {
                              setShowCalendar((current) => !current);
                              setShowTimeGrid(false);
                              if (testDriveForm.preferredDay) {
                                const [year, month] = testDriveForm.preferredDay
                                  .split("-")
                                  .map(Number);
                                if (year && month) {
                                  setCalendarCursor(new Date(year, month - 1, 1));
                                }
                              }
                            }}
                            className={`mt-1.5 flex w-full items-center justify-between rounded-lg border px-3 py-2 text-sm ${modalInputClass}`}
                          >
                            <span>{formatDateToPtBr(testDriveForm.preferredDay)}</span>
                            <span aria-hidden="true">📅</span>
                          </button>
                          {showCalendar ? (
                            <div
                              className={`absolute left-0 z-20 mt-2 w-full rounded-xl border p-3 shadow-2xl ${
                                isLightTheme
                                  ? "border-black/15 bg-white text-[#111318]"
                                  : "border-emerald-100/15 bg-[#0f2b24] text-white"
                              }`}
                            >
                              <div className="mb-2 flex items-center justify-between">
                                <button
                                  type="button"
                                  onClick={() => setCalendarCursor((prev) => addMonths(prev, -1))}
                                  className={`rounded-md border px-2 py-1 text-xs ${
                                    isLightTheme ? "border-black/15" : "border-white/15"
                                  }`}
                                >
                                  ◀
                                </button>
                                <p className="text-xs font-semibold capitalize text-[#f4cd74]">
                                  {getMonthLabel(calendarCursor)}
                                </p>
                                <button
                                  type="button"
                                  onClick={() => setCalendarCursor((prev) => addMonths(prev, 1))}
                                  className={`rounded-md border px-2 py-1 text-xs ${
                                    isLightTheme ? "border-black/15" : "border-white/15"
                                  }`}
                                >
                                  ▶
                                </button>
                              </div>
                              <div className="grid grid-cols-7 gap-1 pb-1">
                                {weekLabels.map((label) => (
                                  <span
                                    key={label}
                                    className={`text-center text-[10px] font-semibold uppercase tracking-[0.08em] ${
                                      isLightTheme ? "text-[#6b7280]" : "text-white/55"
                                    }`}
                                  >
                                    {label}
                                  </span>
                                ))}
                              </div>
                              <div className="grid grid-cols-7 gap-1">
                                {calendarDays.map((dateItem, idx) =>
                                  dateItem ? (
                                    <button
                                      key={formatDateToIso(dateItem)}
                                      type="button"
                                      onClick={() => {
                                        setTestDriveForm((prev) => ({
                                          ...prev,
                                          preferredDay: formatDateToIso(dateItem),
                                        }));
                                        setShowCalendar(false);
                                      }}
                                      className={`rounded-md px-1 py-1.5 text-xs transition ${
                                        testDriveForm.preferredDay === formatDateToIso(dateItem)
                                          ? "bg-[#c8a24c] font-semibold text-[#111318]"
                                          : isLightTheme
                                            ? "border border-black/10 text-[#111318] hover:bg-black/5"
                                            : "border border-white/10 text-white hover:bg-white/10"
                                      }`}
                                    >
                                      {dateItem.getDate()}
                                    </button>
                                  ) : (
                                    <span key={`empty-${idx}`} />
                                  ),
                                )}
                              </div>
                            </div>
                          ) : null}
                        </div>
                        <div className="relative text-sm">
                          <p className="text-sm">Horário para test-drive</p>
                          <button
                            type="button"
                            onClick={() => {
                              setShowTimeGrid((current) => !current);
                              setShowCalendar(false);
                            }}
                            className={`mt-1.5 flex w-full items-center justify-between rounded-lg border px-3 py-2 text-sm ${modalInputClass}`}
                          >
                            <span>{formatHourToPtBr(testDriveForm.preferredHour)}</span>
                            <span aria-hidden="true">🕒</span>
                          </button>
                          {showTimeGrid ? (
                            <div
                              className={`absolute left-0 z-20 mt-2 w-full rounded-xl border p-3 shadow-2xl ${
                                isLightTheme
                                  ? "border-black/15 bg-white text-[#111318]"
                                  : "border-emerald-100/15 bg-[#0f2b24] text-white"
                              }`}
                            >
                              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.08em] text-[#f4cd74]">
                                Selecione o horário
                              </p>
                              <div className="grid grid-cols-5 gap-1.5">
                                {timeOptions.map((hourLabel) => (
                                  <button
                                    key={hourLabel}
                                    type="button"
                                    onClick={() => {
                                      setTestDriveForm((prev) => ({
                                        ...prev,
                                        preferredHour: hourLabel,
                                      }));
                                      setShowTimeGrid(false);
                                    }}
                                    className={`rounded-md px-1 py-1.5 text-xs transition ${
                                      testDriveForm.preferredHour === hourLabel
                                        ? "bg-[#c8a24c] font-semibold text-[#111318]"
                                        : isLightTheme
                                          ? "border border-black/10 text-[#111318] hover:bg-black/5"
                                          : "border border-white/10 text-white hover:bg-white/10"
                                    }`}
                                  >
                                    {hourLabel}
                                  </button>
                                ))}
                              </div>
                            </div>
                          ) : null}
                        </div>
                      </div>
                    </div>
                    <div className="mt-4 grid gap-2 sm:grid-cols-2">
                      <button
                        type="button"
                        onClick={submitTestDriveRequest}
                        disabled={isSubmittingTestDrive}
                        className="inline-flex items-center justify-center rounded-xl border border-emerald-300/35 px-4 py-2.5 text-sm font-semibold text-emerald-300 transition hover:bg-emerald-500/10 disabled:opacity-70"
                      >
                        {isSubmittingTestDrive ? "Enviando..." : "Enviar solicitação"}
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowTestDriveForm(false)}
                        className="inline-flex items-center justify-center rounded-xl border border-red-300/35 px-4 py-2.5 text-sm font-semibold text-red-300 transition hover:bg-red-500/10"
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                ) : null}

                {testDriveMessage ? (
                  <p className={`mt-4 rounded-lg border px-3 py-2 text-sm ${modalSoftCardClass} ${modalMutedTextClass}`}>
                    {testDriveMessage}
                  </p>
                ) : null}

                <div className="mt-auto flex flex-col gap-3 pt-6">
                  <button
                    type="button"
                    onClick={() => {
                      setShowTestDriveForm(true);
                      setTestDriveMessage(null);
                    }}
                    className="inline-flex items-center justify-center rounded-xl bg-[#c8a24c] px-6 py-3 text-sm font-semibold text-[#111318] transition hover:brightness-95"
                  >
                    Agende seu test-drive
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      openVehicleWhatsAppContact(selectedVehicle.id, selectedVehicle.name)
                    }
                    className="inline-flex items-center justify-center rounded-xl bg-[#25D366] px-6 py-3 text-sm font-semibold text-[#05361b] transition hover:brightness-95"
                  >
                    Chamar no WhatsApp
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      void handleShareClick(selectedVehicle.id, selectedVehicle.name)
                    }
                    className={`inline-flex w-full items-center justify-center rounded-xl border px-6 py-3 text-sm font-semibold transition ${
                      isLightTheme
                        ? "border-black/20 bg-white text-[#111318] hover:bg-black/5"
                        : "border-emerald-100/20 bg-[#173e34] text-white hover:bg-[#1f4a3f]"
                    }`}
                  >
                    Compartilhar
                  </button>
                </div>
              </aside>
            </div>
          </div>
        </div>
      ) : null}

      {selectedVehicle && isShareSheetOpen ? (
        <div className="fixed inset-0 z-[115]">
          <button
            type="button"
            onClick={closeShareSheet}
            className="absolute inset-0 bg-black/55 backdrop-blur-[1px]"
            aria-label="Fechar opções de compartilhamento"
          />
          <div className="absolute bottom-0 left-0 right-0 rounded-t-3xl border border-emerald-100/20 bg-[#12322b] p-4 shadow-[0_-16px_40px_rgba(0,0,0,0.4)]">
            <div className="mx-auto mb-3 h-1.5 w-14 rounded-full bg-white/20" />
            <p className="mb-3 text-sm font-semibold text-white/90">
              Compartilhar anúncio
            </p>
            <div className="grid gap-2">
              <ShareOptionButton
                label="Copiar link"
                onClick={() => void copyVehicleLinkFromSheet(selectedVehicle.id)}
                icon={<LinkShareIcon />}
              />
              <ShareOptionButton
                label="Compartilhar no WhatsApp"
                onClick={() =>
                  shareViaWhatsAppFromSheet(selectedVehicle.id, selectedVehicle.name)
                }
                icon={<WhatsAppShareIcon />}
              />
              <ShareOptionButton
                label="Compartilhar no Instagram"
                onClick={() => void shareViaInstagramFromSheet(selectedVehicle.id)}
                icon={<InstagramShareIcon />}
              />
              <ShareOptionButton
                label="Compartilhar no Facebook"
                onClick={() => shareViaFacebookFromSheet(selectedVehicle.id)}
                icon={<FacebookShareIcon />}
              />
            </div>
          </div>
        </div>
      ) : null}

      {selectedVehicle && isImageFullscreen ? (
        <div className="fixed inset-0 z-[120] bg-black/95">
          <button
            type="button"
            onClick={() => setIsImageFullscreen(false)}
            className="absolute right-4 top-4 z-20 rounded-full border border-white/25 bg-black/60 px-4 py-2 text-xs font-semibold uppercase tracking-[0.08em] text-white"
          >
            Fechar foto
          </button>
          <div className="relative h-full w-full">
            <Image
              src={currentImageUrl}
              alt={`Foto ampliada de ${selectedVehicle.name}`}
              fill
              sizes="100vw"
              className="object-contain"
            />
            {selectedImages.length > 1 ? (
              <>
                <button
                  type="button"
                  onClick={handlePrevImage}
                  aria-label="Imagem anterior"
                  className="absolute left-4 top-1/2 z-20 inline-flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/25 bg-black/60 text-2xl text-white"
                >
                  ‹
                </button>
                <button
                  type="button"
                  onClick={handleNextImage}
                  aria-label="Próxima imagem"
                  className="absolute right-4 top-1/2 z-20 inline-flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/25 bg-black/60 text-2xl text-white"
                >
                  ›
                </button>
                <p className="absolute bottom-4 left-1/2 z-20 -translate-x-1/2 rounded-full border border-white/20 bg-black/35 px-2.5 py-0.5 text-[10px] font-medium text-white/80">
                  {activeImageIndex + 1}/{selectedImages.length}
                </p>
              </>
            ) : null}
          </div>
        </div>
      ) : null}
    </>
  );
}

function ShareOptionButton({
  label,
  onClick,
  icon,
}: {
  label: string;
  onClick: () => void;
  icon: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex h-12 w-full items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-3 text-left text-sm text-white/90 transition hover:bg-white/[0.08] active:scale-[0.99]"
    >
      <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-black/30">
        {icon}
      </span>
      <span>{label}</span>
    </button>
  );
}

function WhatsAppShareIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4 fill-[#25D366]">
      <path d="M20.52 3.48A11.86 11.86 0 0 0 12.06 0C5.53 0 .2 5.3.2 11.84c0 2.09.55 4.13 1.6 5.94L0 24l6.4-1.67a11.8 11.8 0 0 0 5.66 1.45h.01c6.53 0 11.86-5.3 11.86-11.84 0-3.16-1.23-6.12-3.41-8.46Zm-8.46 18.3h-.01a9.8 9.8 0 0 1-4.98-1.36l-.36-.22-3.8 1 1.02-3.7-.23-.38a9.8 9.8 0 0 1-1.5-5.28C2.2 6.4 6.63 1.98 12.06 1.98c2.6 0 5.03 1.01 6.87 2.86a9.78 9.78 0 0 1 2.85 6.99c0 5.44-4.43 9.95-9.72 9.95Zm5.46-7.44c-.3-.15-1.76-.87-2.03-.97-.27-.1-.46-.15-.66.15-.2.3-.76.97-.93 1.17-.17.2-.34.22-.64.07-.3-.15-1.25-.46-2.38-1.47-.88-.78-1.48-1.75-1.65-2.04-.17-.3-.02-.46.13-.6.13-.13.3-.34.45-.5.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.07-.15-.66-1.58-.9-2.16-.24-.58-.48-.5-.66-.5h-.56c-.2 0-.52.07-.8.37-.27.3-1.04 1.02-1.04 2.5 0 1.47 1.06 2.89 1.2 3.1.15.2 2.08 3.18 5.05 4.45.7.3 1.25.47 1.68.6.7.22 1.33.19 1.83.12.56-.08 1.76-.72 2-1.42.25-.7.25-1.3.17-1.42-.07-.12-.27-.2-.56-.35Z" />
    </svg>
  );
}

function FacebookShareIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4 fill-[#1877F2]">
      <path d="M24 12.07C24 5.4 18.63 0 12 0S0 5.4 0 12.07C0 18.1 4.39 23.1 10.13 24v-8.44H7.08v-3.5h3.05V9.4c0-3.03 1.79-4.7 4.54-4.7 1.31 0 2.68.24 2.68.24v2.97h-1.51c-1.49 0-1.95.93-1.95 1.88v2.26h3.32l-.53 3.5h-2.79V24C19.61 23.1 24 18.1 24 12.07Z" />
    </svg>
  );
}

function InstagramShareIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4">
      <defs>
        <linearGradient id="instagram-share-gradient" x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#F58529" />
          <stop offset="35%" stopColor="#DD2A7B" />
          <stop offset="70%" stopColor="#8134AF" />
          <stop offset="100%" stopColor="#515BD4" />
        </linearGradient>
      </defs>
      <path
        fill="url(#instagram-share-gradient)"
        d="M12 2.16c3.2 0 3.58.01 4.85.07 1.17.05 1.8.25 2.22.41.56.22.96.49 1.38.91.42.42.7.82.91 1.38.17.43.36 1.05.42 2.22.06 1.27.07 1.66.07 4.85 0 3.2-.01 3.58-.07 4.85-.06 1.17-.25 1.8-.42 2.22-.22.56-.49.96-.91 1.38-.42.42-.82.7-1.38.91-.43.17-1.05.36-2.22.42-1.27.06-1.65.07-4.85.07-3.2 0-3.58-.01-4.85-.07-1.17-.06-1.8-.25-2.22-.42a3.77 3.77 0 0 1-1.38-.91 3.8 3.8 0 0 1-.91-1.38c-.17-.43-.36-1.05-.41-2.22-.06-1.27-.07-1.66-.07-4.85 0-3.2.01-3.58.07-4.85.05-1.17.24-1.8.41-2.22.22-.56.49-.96.91-1.38.42-.42.82-.7 1.38-.91.43-.17 1.05-.36 2.22-.41 1.27-.06 1.66-.07 4.85-.07Zm0 1.9c-3.15 0-3.52.01-4.76.06-1.04.05-1.6.22-1.97.37-.49.19-.84.42-1.2.78-.36.36-.59.71-.78 1.2-.15.37-.33.93-.37 1.97-.06 1.24-.07 1.61-.07 4.76s.01 3.52.07 4.76c.05 1.04.22 1.6.37 1.97.19.49.42.84.78 1.2.36.36.71.59 1.2.78.37.15.93.33 1.97.37 1.24.06 1.61.07 4.76.07s3.52-.01 4.76-.07c1.04-.05 1.6-.22 1.97-.37.49-.19.84-.42 1.2-.78.36-.36.59-.71.78-1.2.15-.37.33-.93.37-1.97.06-1.24.07-1.61.07-4.76s-.01-3.52-.07-4.76c-.05-1.04-.22-1.6-.37-1.97a3.2 3.2 0 0 0-.78-1.2 3.2 3.2 0 0 0-1.2-.78c-.37-.15-.93-.33-1.97-.37-1.24-.06-1.61-.07-4.76-.07Zm0 3.24a4.7 4.7 0 1 1 0 9.4 4.7 4.7 0 0 1 0-9.4Zm0 7.5a2.8 2.8 0 1 0 0-5.6 2.8 2.8 0 0 0 0 5.6Zm5.98-7.72a1.1 1.1 0 1 1-2.2 0 1.1 1.1 0 0 1 2.2 0Z"
      />
    </svg>
  );
}

function LinkShareIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="h-4 w-4"
      fill="none"
      stroke="#d1d5db"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M10 13a5 5 0 0 0 7.07 0l2.83-2.83a5 5 0 1 0-7.07-7.07L11.2 4.73" />
      <path d="M14 11a5 5 0 0 0-7.07 0L4.1 13.83a5 5 0 1 0 7.07 7.07L12.8 19.27" />
    </svg>
  );
}

function DetailCard({
  label,
  value,
  isLightTheme,
}: {
  label: string;
  value: string;
  isLightTheme: boolean;
}) {
  const displayValue = value?.trim() ? value : "Nao informado";

  return (
    <article
      className={`rounded-xl border p-3 ${
        isLightTheme ? "border-black/10 bg-black/[0.04]" : "border-white/10 bg-white/[0.03]"
      }`}
    >
      <p
        className={`text-[11px] uppercase tracking-[0.12em] ${
          isLightTheme ? "text-[#4b5563]" : "text-white/60"
        }`}
      >
        {label}
      </p>
      <p className={`mt-1.5 text-sm font-semibold ${isLightTheme ? "text-[#111318]" : "text-white"}`}>
        {displayValue}
      </p>
    </article>
  );
}
