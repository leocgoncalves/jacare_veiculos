"use client";

import { UserRole } from "@prisma/client";
import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { LogoutButton } from "@/app/components/LogoutButton";

type VehicleType = "CAR" | "MOTORCYCLE";
type AdminTab =
  | "dashboard"
  | "vehicles"
  | "testdrives"
  | "visual"
  | "apis"
  | "admins";

type VehicleSummary = {
  id: string;
  brand: string;
  model: string;
  type: VehicleType;
  name: string;
  year: number;
  km: number;
  transmission: string;
  fuel: string;
  color: string;
  priceInCents: number;
  shortSpecs: string;
  description: string | null;
  isPublished: boolean;
  isSold: boolean;
  deletedAt: string | null;
};

type TestDriveSummary = {
  id: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  preferredDate: string;
  scheduledDate: string | null;
  status: "PENDING" | "APPROVED" | "REJECTED" | "RESCHEDULED";
  adminObservation: string | null;
  vehicle: { id: string; name: string; year: number };
};

type PendingAdmin = {
  id: string;
  name: string;
  email: string;
  createdAt: string;
};

type ManagedAdmin = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  isActive: boolean;
  createdAt: string;
};

type PendingDeleteVehicle = {
  id: string;
  name: string;
};

type SiteSettings = {
  siteTitle: string;
  logoScale: number;
  homeBackgroundColor: string;
  processCardsBackgroundColor: string;
  footerAddress: string;
  footerPhone: string;
  footerEmail: string;
  footerHours: string;
  instagramUrl: string;
  facebookUrl: string;
  whatsappUrl: string;
  metaAppId?: string | null;
  metaAppSecret?: string | null;
  metaAccessToken?: string | null;
};

const initialForm = {
  brand: "",
  model: "",
  name: "",
  type: "CAR" as VehicleType,
  year: new Date().getFullYear().toString(),
  km: "0",
  transmission: "Automatico",
  fuel: "Flex",
  color: "Nao informado",
  priceInCents: "0",
  shortSpecs: "",
  description: "",
  isPublished: true,
};

const initialSettings: SiteSettings = {
  siteTitle: "Jacaré Veículos",
  logoScale: 56,
  homeBackgroundColor: "#090b10",
  processCardsBackgroundColor: "#10141d",
  footerAddress: "Av. Comercial, 1000 - Centro, Sao Paulo - SP",
  footerPhone: "(11) 0000-0000",
  footerEmail: "contato@jacareveiculos.com.br",
  footerHours: "Segunda a Sexta: 08h as 18h | Sabado: 08h as 14h",
  instagramUrl: "https://instagram.com",
  facebookUrl: "https://facebook.com",
  whatsappUrl: "https://wa.me/5500000000000",
  metaAppId: "",
  metaAppSecret: "",
  metaAccessToken: "",
};

const MAX_VEHICLE_IMAGES = 8;
// Limite conservador para evitar 413 em provedores serverless.
const MAX_VEHICLE_UPLOAD_TOTAL_BYTES = 4 * 1024 * 1024;

function keepOnlyDigits(value: string) {
  return value.replace(/\D/g, "");
}

function formatIntegerPtBrFromDigits(digitsValue: string) {
  const digits = keepOnlyDigits(digitsValue);
  if (!digits) return "";
  const normalized = digits.replace(/^0+(?=\d)/, "");
  return normalized.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

function formatCurrencyPtBrFromCentsDigits(centsDigitsValue: string) {
  const digits = keepOnlyDigits(centsDigitsValue);
  if (!digits) return "";
  const padded = digits.padStart(3, "0");
  const reaisPart = padded.slice(0, -2) || "0";
  const centsPart = padded.slice(-2);
  const formattedReais = formatIntegerPtBrFromDigits(reaisPart);
  return `R$ ${formattedReais},${centsPart}`;
}

function toLocalDateTimeInputValue(isoDate: string | null | undefined) {
  if (!isoDate) return "";
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return "";
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

function testDriveStatusLabel(status: TestDriveSummary["status"]) {
  switch (status) {
    case "APPROVED":
      return "Aprovado";
    case "REJECTED":
      return "Recusado";
    case "RESCHEDULED":
      return "Reagendado";
    default:
      return "Pendente";
  }
}

function testDriveStatusClass(status: TestDriveSummary["status"]) {
  switch (status) {
    case "APPROVED":
      return "text-emerald-300";
    case "REJECTED":
      return "text-red-300";
    case "RESCHEDULED":
      return "text-amber-300";
    default:
      return "text-[#c8a24c]";
  }
}

async function readApiErrorMessage(
  response: Response,
  fallbackMessage: string,
): Promise<string> {
  const contentType = response.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    const jsonBody = (await response.json().catch(() => ({}))) as {
      message?: string;
      error?: string;
      issues?: { message?: string }[];
    };
    const issues = Array.isArray(jsonBody.issues)
      ? jsonBody.issues
          .map((issue) => issue?.message)
          .filter((value): value is string => Boolean(value))
      : [];

    const baseMessage = jsonBody.message || jsonBody.error || fallbackMessage;
    return issues.length > 0 ? `${baseMessage} (${issues.join(" | ")})` : baseMessage;
  }

  const textBody = await response.text().catch(() => "");
  if (
    response.status === 413 ||
    /request entity too large|payload too large/i.test(textBody)
  ) {
    return "As imagens excedem o limite de upload. Envie menos arquivos ou imagens mais leves (total até 4 MB).";
  }

  const sanitizedText = textBody.trim();
  return sanitizedText || fallbackMessage;
}

type NewAdminForm = {
  name: string;
  email: string;
  password: string;
};

const initialNewAdminForm: NewAdminForm = {
  name: "",
  email: "",
  password: "",
};

export function AdminDashboard({
  adminName,
  adminRole,
  adminId,
  adminEmail,
  isSuperAdmin,
}: {
  adminName: string;
  adminRole: UserRole;
  adminId: string;
  adminEmail: string;
  isSuperAdmin: boolean;
}) {
  const [activeTab, setActiveTab] = useState<AdminTab>("dashboard");
  const [form, setForm] = useState(initialForm);
  const [editingVehicleId, setEditingVehicleId] = useState<string | null>(null);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [vehicles, setVehicles] = useState<VehicleSummary[]>([]);
  const [testDrives, setTestDrives] = useState<TestDriveSummary[]>([]);
  const [settings, setSettings] = useState<SiteSettings>(initialSettings);
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [backgroundFile, setBackgroundFile] = useState<File | null>(null);
  const [adminObservation, setAdminObservation] = useState<Record<string, string>>(
    {},
  );
  const [rescheduleDate, setRescheduleDate] = useState<Record<string, string>>(
    {},
  );
  const [pendingAdmins, setPendingAdmins] = useState<PendingAdmin[]>([]);
  const [managedAdmins, setManagedAdmins] = useState<ManagedAdmin[]>([]);
  const [newAdminForm, setNewAdminForm] = useState<NewAdminForm>(initialNewAdminForm);
  const [isCreatingAdmin, setIsCreatingAdmin] = useState(false);
  const [isRemovingAdminId, setIsRemovingAdminId] = useState<string | null>(null);
  const [isUpdatingTestDriveId, setIsUpdatingTestDriveId] = useState<string | null>(
    null,
  );
  const [pendingDeleteVehicle, setPendingDeleteVehicle] =
    useState<PendingDeleteVehicle | null>(null);
  const [isDeletingVehicle, setIsDeletingVehicle] = useState(false);

  const soldCount = useMemo(
    () => vehicles.filter((vehicle) => vehicle.isSold).length,
    [vehicles],
  );
  const messageCount = testDrives.length;

  async function loadVehicles() {
    const response = await fetch("/api/admin/vehicles");
    if (!response.ok) return;
    const body = (await response.json()) as { vehicles: VehicleSummary[] };
    setVehicles(body.vehicles);
  }

  async function loadTestDrives() {
    const response = await fetch("/api/admin/test-drives");
    if (!response.ok) return;
    const body = (await response.json()) as { testDrives: TestDriveSummary[] };
    setTestDrives(body.testDrives);
  }

  async function loadSettings() {
    const response = await fetch("/api/admin/site-settings");
    if (!response.ok) return;
    const body = (await response.json()) as { settings: SiteSettings };
    setSettings({
      ...initialSettings,
      ...body.settings,
      metaAppId: body.settings.metaAppId || "",
      metaAppSecret: body.settings.metaAppSecret || "",
      metaAccessToken: body.settings.metaAccessToken || "",
    });
  }

  async function loadPendingAdmins() {
    const response = await fetch("/api/admin/users");
    if (!response.ok) return;
    const body = (await response.json()) as {
      pendingAdmins: PendingAdmin[];
      admins?: ManagedAdmin[];
    };
    setPendingAdmins(body.pendingAdmins ?? []);
    setManagedAdmins(body.admins ?? []);
  }

  useEffect(() => {
    void loadVehicles();
    void loadTestDrives();
    void loadSettings();
    if (isSuperAdmin) {
      void loadPendingAdmins();
    }
  }, [isSuperAdmin]);

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      if (editingVehicleId) {
        const response = await fetch(`/api/admin/vehicles/${editingVehicleId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });

        const body = (await response
          .json()
          .catch(() => ({}))) as { message?: string; issues?: { message?: string }[] };
        if (!response.ok) {
          const issueMessages = Array.isArray(body.issues)
            ? body.issues
                .map((issue) => issue?.message)
                .filter((value): value is string => Boolean(value))
            : [];
          const details =
            issueMessages.length > 0 ? ` (${issueMessages.join(" | ")})` : "";
          throw new Error(
            `${body.message || "Não foi possível editar publicação."}${details}`,
          );
        }

        setMessage("Publicação atualizada com sucesso.");
      } else {
        if (imageFiles.length === 0) {
          throw new Error("Selecione ao menos uma imagem para o veículo.");
        }
        if (imageFiles.length > MAX_VEHICLE_IMAGES) {
          throw new Error(`Envie no máximo ${MAX_VEHICLE_IMAGES} imagens por veículo.`);
        }
        const totalUploadSize = imageFiles.reduce((sum, file) => sum + file.size, 0);
        if (totalUploadSize > MAX_VEHICLE_UPLOAD_TOTAL_BYTES) {
          throw new Error(
            "As imagens excedem o limite de upload (4 MB no total). Reduza a quantidade ou comprima os arquivos.",
          );
        }

        const payload = new FormData();
        payload.set("brand", form.brand);
        payload.set("model", form.model);
        payload.set("name", form.name);
        payload.set("type", form.type);
        payload.set("year", form.year);
        payload.set("km", form.km);
        payload.set("transmission", form.transmission);
        payload.set("fuel", form.fuel);
        payload.set("color", form.color);
        payload.set("priceInCents", form.priceInCents);
        payload.set("shortSpecs", form.shortSpecs);
        payload.set("description", form.description);
        payload.set("isPublished", String(form.isPublished));
        imageFiles.forEach((file) => payload.append("images", file));

        const response = await fetch("/api/admin/vehicles", {
          method: "POST",
          body: payload,
        });

        if (!response.ok) {
          throw new Error(
            await readApiErrorMessage(
              response,
              "Não foi possível cadastrar veículo.",
            ),
          );
        }

        setMessage("Veículo cadastrado com sucesso.");
      }

      setForm(initialForm);
      setImageFiles([]);
      setEditingVehicleId(null);
      await loadVehicles();
    } catch (submitError) {
      setMessage(
        submitError instanceof Error
          ? submitError.message
          : "Erro ao salvar publicação.",
      );
    } finally {
      setLoading(false);
    }
  };

  function startEditVehicle(vehicle: VehicleSummary) {
    setEditingVehicleId(vehicle.id);
    setForm({
      brand: vehicle.brand,
      model: vehicle.model,
      name: vehicle.name,
      type: vehicle.type,
      year: String(vehicle.year),
      km: String(vehicle.km),
      transmission: vehicle.transmission,
      fuel: vehicle.fuel,
      color: vehicle.color,
      priceInCents: String(vehicle.priceInCents),
      shortSpecs: vehicle.shortSpecs,
      description: vehicle.description ?? "",
      isPublished: vehicle.isPublished,
    });
    setImageFiles([]);
    setActiveTab("vehicles");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function updateVehicleStatus(
    vehicleId: string,
    action:
      | "mark_sold"
      | "mark_available"
      | "delete_permanently"
      | "publish"
      | "unpublish",
  ) {
    const response = await fetch(`/api/admin/vehicles/${vehicleId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    if (response.ok) {
      await loadVehicles();
      return true;
    }
    return false;
  }

  async function confirmPermanentDelete() {
    if (!pendingDeleteVehicle) return;

    setIsDeletingVehicle(true);
    const deleted = await updateVehicleStatus(
      pendingDeleteVehicle.id,
      "delete_permanently",
    );
    setIsDeletingVehicle(false);

    if (deleted) {
      setMessage("Anúncio excluído permanentemente.");
      setPendingDeleteVehicle(null);
      if (editingVehicleId === pendingDeleteVehicle.id) {
        setEditingVehicleId(null);
        setForm(initialForm);
        setImageFiles([]);
      }
    } else {
      setMessage("Não foi possível excluir o anúncio.");
    }
  }

  async function updateTestDrive(
    request: TestDriveSummary,
    status: "APPROVED" | "REJECTED" | "RESCHEDULED",
  ) {
    setIsUpdatingTestDriveId(request.id);
    setMessage(null);
    try {
      const localDateTimeValue =
        rescheduleDate[request.id] ??
        toLocalDateTimeInputValue(request.scheduledDate ?? request.preferredDate);
      const shouldSendScheduleDate = status === "RESCHEDULED" || status === "APPROVED";
      if (shouldSendScheduleDate && !localDateTimeValue) {
        setMessage("Informe data e horário para aprovar ou reagendar o test-drive.");
        return;
      }
      const parsedDate =
        shouldSendScheduleDate && localDateTimeValue
          ? new Date(localDateTimeValue)
          : null;
      if (parsedDate && Number.isNaN(parsedDate.getTime())) {
        setMessage("Data/hora inválida para o agendamento.");
        return;
      }
      const scheduledDate = shouldSendScheduleDate
        ? parsedDate?.toISOString()
        : undefined;

      const response = await fetch("/api/admin/test-drives", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: request.id,
          status,
          scheduledDate,
          adminObservation: adminObservation[request.id] || undefined,
        }),
      });

      const body = (await response.json().catch(() => ({}))) as { message?: string };
      if (!response.ok) {
        throw new Error(body.message || "Falha ao atualizar test-drive.");
      }

      await loadTestDrives();
      setMessage(`Test-drive atualizado: ${testDriveStatusLabel(status)}.`);
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Falha ao atualizar test-drive.",
      );
    } finally {
      setIsUpdatingTestDriveId(null);
    }
  }

  async function submitSettings(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSettingsLoading(true);
    setMessage(null);

    try {
      const payload = new FormData();
      payload.set("siteTitle", settings.siteTitle);
      payload.set("logoScale", String(settings.logoScale));
      payload.set("homeBackgroundColor", settings.homeBackgroundColor);
      payload.set(
        "processCardsBackgroundColor",
        settings.processCardsBackgroundColor,
      );
      payload.set("footerAddress", settings.footerAddress);
      payload.set("footerPhone", settings.footerPhone);
      payload.set("footerEmail", settings.footerEmail);
      payload.set("footerHours", settings.footerHours);
      payload.set("instagramUrl", settings.instagramUrl);
      payload.set("facebookUrl", settings.facebookUrl);
      payload.set("whatsappUrl", settings.whatsappUrl);
      payload.set("metaAppId", settings.metaAppId || "");
      payload.set("metaAppSecret", settings.metaAppSecret || "");
      payload.set("metaAccessToken", settings.metaAccessToken || "");
      if (logoFile) payload.set("logoFile", logoFile);
      if (backgroundFile) payload.set("backgroundFile", backgroundFile);

      const response = await fetch("/api/admin/site-settings", {
        method: "PUT",
        body: payload,
      });

      if (!response.ok) {
        const errorBody = await response.json().catch(() => ({}));
        const issueMessages = Array.isArray(errorBody.issues)
          ? errorBody.issues
              .map((issue: { message?: string }) => issue?.message)
              .filter((value: unknown): value is string => typeof value === "string")
          : [];
        const errorMessage =
          errorBody.message ||
          errorBody.error ||
          `Erro ${response.status}: ${response.statusText}`;
        const details = issueMessages.length > 0 ? ` (${issueMessages.join(" | ")})` : "";
        throw new Error(`${errorMessage}${details}`);
      }

      setMessage("Configuracoes salvas com sucesso.");
      setLogoFile(null);
      setBackgroundFile(null);
      await loadSettings();
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Falha ao salvar configuracoes.",
      );
    } finally {
      setSettingsLoading(false);
    }
  }

  async function handlePendingAdminAction(
    userId: string,
    action: "approve_admin" | "reject_admin" | "remove_admin",
  ) {
    const response = await fetch("/api/admin/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, action }),
    });
    if (response.ok) {
      await loadPendingAdmins();
      setMessage(
        action === "approve_admin"
          ? "Administrador aprovado com sucesso."
          : action === "reject_admin"
            ? "Solicitação de admin removida."
            : "Administrador inativado com sucesso.",
      );
    }
  }

  async function createAdminAccount(event: FormEvent) {
    event.preventDefault();
    setIsCreatingAdmin(true);
    setMessage(null);

    try {
      const response = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newAdminForm),
      });
      const body = (await response.json().catch(() => ({}))) as { message?: string };

      if (!response.ok) {
        throw new Error(body.message || "Não foi possível cadastrar administrador.");
      }

      setNewAdminForm(initialNewAdminForm);
      await loadPendingAdmins();
      setMessage("Administrador cadastrado com sucesso.");
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Falha ao cadastrar administrador.",
      );
    } finally {
      setIsCreatingAdmin(false);
    }
  }

  async function removeAdminAccess(userId: string) {
    setIsRemovingAdminId(userId);
    setMessage(null);
    try {
      await handlePendingAdminAction(userId, "remove_admin");
    } finally {
      setIsRemovingAdminId(null);
    }
  }

  const tabs: Array<{ id: AdminTab; label: string }> = [
    { id: "dashboard", label: "Dashboard" },
    { id: "vehicles", label: "Veículos" },
    { id: "testdrives", label: "Test Drives" },
    { id: "visual", label: "Ajustes visuais" },
    { id: "apis", label: "APIs" },
  ];

  if (isSuperAdmin) {
    tabs.push({ id: "admins", label: "Gestão de admins" });
  }

  return (
    <main
      className="min-h-screen px-6 py-12 text-white"
      style={{ backgroundColor: settings.homeBackgroundColor || "#090b10" }}
    >
      <div className="mx-auto grid w-full max-w-7xl gap-6 lg:grid-cols-[260px_1fr]">
        <aside className="rounded-2xl border border-white/10 bg-[#10141d] p-4 lg:flex lg:min-h-[80vh] lg:flex-col">
          <p className="text-xs uppercase tracking-[0.18em] text-[#c8a24c]">
            Painel administrativo
          </p>
          <h1 className="mt-2 text-2xl font-bold">Olá, {adminName}</h1>
          <p className="mt-2 text-sm text-white/70">
            Organize seu sistema com abas no menu lateral.
          </p>
          <p className="mt-1 text-xs text-white/55">
            Perfil: {adminRole === "SUPER_ADMIN" ? "Administrador principal" : "Administrador"}
          </p>
          <p className="text-xs text-white/50">{adminEmail}</p>

          <nav className="mt-5 space-y-2">
            {tabs.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveTab(item.id as AdminTab)}
                className={`w-full rounded-lg px-3 py-2 text-left text-sm transition ${
                  activeTab === item.id
                    ? "bg-[#c8a24c] font-semibold text-[#111318]"
                    : "border border-white/10 hover:bg-white/[0.04]"
                }`}
              >
                {item.label}
              </button>
            ))}
          </nav>

          <div className="mt-6 space-y-2 lg:mt-auto">
            <LogoutButton fullWidth />
            <Link
              href="/"
              className="block rounded-lg border border-white/20 px-3 py-2 text-center text-sm transition hover:bg-white/5"
            >
              Voltar para o site
            </Link>
          </div>
        </aside>

        <section className="space-y-6">
          {message ? (
            <div className="rounded-xl border border-[#c8a24c]/30 bg-[#10141d] px-4 py-3 text-sm text-[#c8a24c]">
              {message}
            </div>
          ) : null}

          {pendingDeleteVehicle ? (
            <div className="rounded-2xl border border-red-300/35 bg-[#10141d] p-5">
              <p className="text-sm font-semibold text-red-200">
                Confirma exclusão permanente do anúncio?
              </p>
              <p className="mt-2 text-sm text-white/75">
                O anúncio{" "}
                <span className="font-semibold text-white">
                  {pendingDeleteVehicle.name}
                </span>{" "}
                será excluído do site e do banco de dados. Esta ação não poderá
                ser desfeita.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => void confirmPermanentDelete()}
                  disabled={isDeletingVehicle}
                  className="rounded-md border border-red-300/45 px-3 py-1.5 text-xs font-semibold text-red-200 disabled:opacity-70"
                >
                  {isDeletingVehicle
                    ? "Excluindo..."
                    : "Confirmar exclusão permanente"}
                </button>
                <button
                  type="button"
                  onClick={() => setPendingDeleteVehicle(null)}
                  disabled={isDeletingVehicle}
                  className="rounded-md border border-white/25 px-3 py-1.5 text-xs font-semibold text-white/85 disabled:opacity-70"
                >
                  Cancelar
                </button>
              </div>
            </div>
          ) : null}

          {activeTab === "dashboard" ? (
            <>
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
                <article className="rounded-xl border border-white/10 bg-[#10141d] p-4">
                  <p className="text-sm text-white/65">Mensagens recebidas</p>
                  <p className="mt-2 text-3xl font-bold">{messageCount}</p>
                </article>
                <article className="rounded-xl border border-white/10 bg-[#10141d] p-4">
                  <p className="text-sm text-white/65">Agendamentos test-drive</p>
                  <p className="mt-2 text-3xl font-bold">{testDrives.length}</p>
                </article>
                <article className="rounded-xl border border-white/10 bg-[#10141d] p-4">
                  <p className="text-sm text-white/65">Veículos cadastrados</p>
                  <p className="mt-2 text-3xl font-bold">{vehicles.length}</p>
                </article>
                <article className="rounded-xl border border-white/10 bg-[#10141d] p-4">
                  <p className="text-sm text-white/65">Veículos vendidos</p>
                  <p className="mt-2 text-3xl font-bold text-emerald-300">{soldCount}</p>
                </article>
              </div>

              <div className="grid gap-6 lg:grid-cols-2">
                <section className="rounded-2xl border border-white/10 bg-[#10141d] p-6">
                  <h2 className="text-xl font-semibold">Últimos agendamentos</h2>
                  <div className="mt-4 space-y-3">
                    {testDrives.slice(0, 5).map((item) => (
                      <article
                        key={item.id}
                        className="rounded-lg border border-white/10 bg-white/[0.03] p-3"
                      >
                        <p className="font-medium">
                          {item.customerName} - {item.vehicle.name}
                        </p>
                        <p className="text-sm text-white/65">{item.customerPhone}</p>
                      </article>
                    ))}
                    {testDrives.length === 0 ? (
                      <p className="text-sm text-white/60">Sem solicitações até o momento.</p>
                    ) : null}
                  </div>
                </section>

                <section className="rounded-2xl border border-white/10 bg-[#10141d] p-6">
                  <h2 className="text-xl font-semibold">Resumo rápido</h2>
                  <ul className="mt-4 space-y-2 text-sm text-white/75">
                    <li>
                      - Gestão de administradores:{" "}
                      {isSuperAdmin
                        ? `${pendingAdmins.length} pendência(s)`
                        : "restrito ao administrador principal"}
                    </li>
                    <li>- Veículos vendidos: {soldCount}</li>
                    <li>- Mensagens recebidas: {messageCount}</li>
                  </ul>
                </section>
              </div>
            </>
          ) : null}

          {activeTab === "vehicles" ? (
            <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
              <form
                onSubmit={onSubmit}
                className="space-y-4 rounded-2xl border border-white/10 bg-[#10141d] p-6"
              >
                <h2 className="text-xl font-semibold">
                  {editingVehicleId ? "Editar publicação" : "Novo veículo"}
                </h2>
                <div className="grid gap-4 md:grid-cols-2">
                  <label className="text-sm">
                    Marca
                    <input
                      required
                      value={form.brand}
                      onChange={(event) =>
                        setForm((prev) => ({ ...prev, brand: event.target.value }))
                      }
                      className="mt-1.5 w-full rounded-lg border border-white/15 bg-[#090b10] px-3 py-2"
                    />
                  </label>
                  <label className="text-sm">
                    Modelo
                    <input
                      required
                      value={form.model}
                      onChange={(event) =>
                        setForm((prev) => ({ ...prev, model: event.target.value }))
                      }
                      className="mt-1.5 w-full rounded-lg border border-white/15 bg-[#090b10] px-3 py-2"
                    />
                  </label>
                  <label className="text-sm">
                    Nome do anúncio
                    <input
                      required
                      value={form.name}
                      onChange={(event) =>
                        setForm((prev) => ({ ...prev, name: event.target.value }))
                      }
                      className="mt-1.5 w-full rounded-lg border border-white/15 bg-[#090b10] px-3 py-2"
                    />
                  </label>
                  <label className="text-sm">
                    Tipo
                    <select
                      value={form.type}
                      onChange={(event) =>
                        setForm((prev) => ({
                          ...prev,
                          type: event.target.value as VehicleType,
                        }))
                      }
                      className="mt-1.5 w-full rounded-lg border border-white/15 bg-[#090b10] px-3 py-2"
                    >
                      <option value="CAR">Carro</option>
                      <option value="MOTORCYCLE">Moto</option>
                    </select>
                  </label>
                  <label className="text-sm">
                    Ano
                    <input
                      type="number"
                      required
                      value={form.year}
                      onChange={(event) =>
                        setForm((prev) => ({ ...prev, year: event.target.value }))
                      }
                      className="mt-1.5 w-full rounded-lg border border-white/15 bg-[#090b10] px-3 py-2"
                    />
                  </label>
                  <label className="text-sm">
                    KM
                    <input
                      type="text"
                      inputMode="numeric"
                      required
                      value={formatIntegerPtBrFromDigits(form.km)}
                      onChange={(event) =>
                        setForm((prev) => ({
                          ...prev,
                          km: keepOnlyDigits(event.target.value),
                        }))
                      }
                      className="mt-1.5 w-full rounded-lg border border-white/15 bg-[#090b10] px-3 py-2"
                    />
                  </label>
                  <label className="text-sm">
                    Câmbio
                    <input
                      required
                      value={form.transmission}
                      onChange={(event) =>
                        setForm((prev) => ({ ...prev, transmission: event.target.value }))
                      }
                      className="mt-1.5 w-full rounded-lg border border-white/15 bg-[#090b10] px-3 py-2"
                    />
                  </label>
                  <label className="text-sm">
                    Combustível
                    <input
                      required
                      value={form.fuel}
                      onChange={(event) =>
                        setForm((prev) => ({ ...prev, fuel: event.target.value }))
                      }
                      className="mt-1.5 w-full rounded-lg border border-white/15 bg-[#090b10] px-3 py-2"
                    />
                  </label>
                  <label className="text-sm">
                    Cor
                    <input
                      required
                      value={form.color}
                      onChange={(event) =>
                        setForm((prev) => ({ ...prev, color: event.target.value }))
                      }
                      className="mt-1.5 w-full rounded-lg border border-white/15 bg-[#090b10] px-3 py-2"
                    />
                  </label>
                  <label className="text-sm">
                    Preço (R$)
                    <input
                      type="text"
                      inputMode="numeric"
                      required
                      value={formatCurrencyPtBrFromCentsDigits(form.priceInCents)}
                      onChange={(event) =>
                        setForm((prev) => ({
                          ...prev,
                          priceInCents: keepOnlyDigits(event.target.value),
                        }))
                      }
                      className="mt-1.5 w-full rounded-lg border border-white/15 bg-[#090b10] px-3 py-2"
                    />
                    <p className="mt-1 text-xs text-white/60">
                      Valor exibido em real, salvo internamente em centavos.
                    </p>
                  </label>
                  <label className="text-sm">
                    Imagens
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      required={!editingVehicleId}
                      onChange={(event) =>
                        setImageFiles(Array.from(event.target.files ?? []))
                      }
                      className="mt-1.5 w-full rounded-lg border border-white/15 bg-[#090b10] px-3 py-2"
                    />
                    {editingVehicleId ? (
                      <p className="mt-1 text-xs text-white/60">
                        Edição mantém imagens atuais. Selecione arquivos apenas
                        para preparar uma nova publicação.
                      </p>
                    ) : (
                      <p className="mt-1 text-xs text-white/60">
                        {imageFiles.length} arquivo(s) selecionado(s)
                      </p>
                    )}
                  </label>
                </div>

                <label className="block text-sm">
                  Especificações curtas
                  <input
                    required
                    value={form.shortSpecs}
                    onChange={(event) =>
                      setForm((prev) => ({ ...prev, shortSpecs: event.target.value }))
                    }
                    className="mt-1.5 w-full rounded-lg border border-white/15 bg-[#090b10] px-3 py-2"
                  />
                </label>

                <label className="block text-sm">
                  Descrição
                  <textarea
                    rows={3}
                    value={form.description}
                    onChange={(event) =>
                      setForm((prev) => ({ ...prev, description: event.target.value }))
                    }
                    className="mt-1.5 w-full rounded-lg border border-white/15 bg-[#090b10] px-3 py-2"
                  />
                </label>

                <div className="flex flex-wrap gap-6 text-sm">
                  <label className="inline-flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={form.isPublished}
                      onChange={(event) =>
                        setForm((prev) => ({ ...prev, isPublished: event.target.checked }))
                      }
                    />
                    Publicar no site
                  </label>
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className="rounded-lg bg-[#c8a24c] px-5 py-2.5 font-semibold text-[#111318] disabled:opacity-70"
                  >
                    {loading
                      ? "Salvando..."
                      : editingVehicleId
                        ? "Salvar edição"
                        : "Cadastrar veículo"}
                  </button>
                  {editingVehicleId ? (
                    <button
                      type="button"
                      onClick={() => {
                        setEditingVehicleId(null);
                        setForm(initialForm);
                        setImageFiles([]);
                      }}
                      className="rounded-lg border border-white/20 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-white/5"
                    >
                      Cancelar edição
                    </button>
                  ) : null}
                </div>
              </form>

              <section className="rounded-2xl border border-white/10 bg-[#10141d] p-6">
                <h2 className="text-xl font-semibold">Últimos veículos cadastrados</h2>
                <div className="mt-4 space-y-3">
                  {vehicles.length === 0 ? (
                    <p className="text-sm text-white/60">Nenhum veículo cadastrado.</p>
                  ) : (
                    vehicles.slice(0, 12).map((vehicle) => (
                      <article
                        key={vehicle.id}
                        className="rounded-lg border border-white/10 bg-white/[0.03] p-3"
                      >
                        <p className="font-medium">
                          {vehicle.brand} {vehicle.model}
                        </p>
                        <p className="text-sm text-white/65">
                          {vehicle.year} | {vehicle.km.toLocaleString("pt-BR")} km
                        </p>
                        <p className="mt-1 text-xs text-white/55">
                          Publicação: {vehicle.isPublished ? "Publicado" : "Rascunho"}
                        </p>
                        <div className="mt-2 flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => startEditVehicle(vehicle)}
                            className="rounded-md border border-[#c8a24c]/40 px-2 py-1 text-xs text-[#f0cd7a]"
                          >
                            Editar publicação
                          </button>
                          {vehicle.isPublished ? (
                            <button
                              type="button"
                              onClick={() => updateVehicleStatus(vehicle.id, "unpublish")}
                              className="rounded-md border border-indigo-300/35 px-2 py-1 text-xs text-indigo-200"
                            >
                              Despublicar
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => updateVehicleStatus(vehicle.id, "publish")}
                              className="rounded-md border border-cyan-300/35 px-2 py-1 text-xs text-cyan-200"
                            >
                              Publicar
                            </button>
                          )}
                          {vehicle.isSold ? (
                            <button
                              type="button"
                              onClick={() => updateVehicleStatus(vehicle.id, "mark_available")}
                              className="rounded-md border border-emerald-300/35 px-2 py-1 text-xs text-emerald-200"
                            >
                              Marcar disponível
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => updateVehicleStatus(vehicle.id, "mark_sold")}
                              className="rounded-md border border-amber-300/35 px-2 py-1 text-xs text-amber-200"
                            >
                              Marcar vendido
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() =>
                              setPendingDeleteVehicle({
                                id: vehicle.id,
                                name: `${vehicle.brand} ${vehicle.model}`.trim(),
                              })
                            }
                            className="rounded-md border border-red-300/35 px-2 py-1 text-xs text-red-200"
                          >
                            Excluir
                          </button>
                        </div>
                      </article>
                    ))
                  )}
                </div>
              </section>
            </div>
          ) : null}

          {activeTab === "testdrives" ? (
            <section className="rounded-2xl border border-white/10 bg-[#10141d] p-6">
              <h2 className="text-xl font-semibold">Gestão de test-drive</h2>
              <div className="mt-4 space-y-3">
                {testDrives.length === 0 ? (
                  <p className="text-sm text-white/60">Nenhuma solicitação recebida.</p>
                ) : (
                  testDrives.map((item) => (
                    <article
                      key={item.id}
                      className="rounded-lg border border-white/10 bg-white/[0.03] p-4"
                    >
                      <p className="font-medium">
                        {item.customerName} - {item.vehicle.name} ({item.vehicle.year})
                      </p>
                      <p className="text-sm text-white/70">
                        {item.customerPhone} | {item.customerEmail}
                      </p>
                      <p className="text-sm text-white/70">
                        Data preferida: {new Date(item.preferredDate).toLocaleString("pt-BR")}
                      </p>
                      <p className="text-sm text-white/70">
                        Status:{" "}
                        <span className={`font-semibold ${testDriveStatusClass(item.status)}`}>
                          {testDriveStatusLabel(item.status)}
                        </span>
                      </p>
                      <div className="mt-3 grid gap-2 md:grid-cols-2">
                        <input
                          type="datetime-local"
                          value={
                            rescheduleDate[item.id] ??
                            toLocalDateTimeInputValue(
                              item.scheduledDate ?? item.preferredDate,
                            )
                          }
                          onChange={(event) =>
                            setRescheduleDate((prev) => ({
                              ...prev,
                              [item.id]: event.target.value,
                            }))
                          }
                          className="rounded-lg border border-white/15 bg-[#090b10] px-3 py-2 text-sm"
                        />
                        <input
                          placeholder="Observação do admin"
                          value={adminObservation[item.id] ?? ""}
                          onChange={(event) =>
                            setAdminObservation((prev) => ({
                              ...prev,
                              [item.id]: event.target.value,
                            }))
                          }
                          className="rounded-lg border border-white/15 bg-[#090b10] px-3 py-2 text-sm"
                        />
                      </div>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => updateTestDrive(item, "APPROVED")}
                          disabled={isUpdatingTestDriveId === item.id}
                          className="rounded-md border border-emerald-300/35 px-2 py-1 text-xs text-emerald-200"
                        >
                          {isUpdatingTestDriveId === item.id ? "Salvando..." : "Aprovar"}
                        </button>
                        <button
                          type="button"
                          onClick={() => updateTestDrive(item, "REJECTED")}
                          disabled={isUpdatingTestDriveId === item.id}
                          className="rounded-md border border-red-300/35 px-2 py-1 text-xs text-red-200"
                        >
                          Recusar
                        </button>
                        <button
                          type="button"
                          onClick={() => updateTestDrive(item, "RESCHEDULED")}
                          disabled={isUpdatingTestDriveId === item.id}
                          className="rounded-md border border-amber-300/35 px-2 py-1 text-xs text-amber-200"
                        >
                          Reagendar
                        </button>
                      </div>
                    </article>
                  ))
                )}
              </div>
            </section>
          ) : null}

          {activeTab === "visual" ? (
            <form
              onSubmit={submitSettings}
              className="space-y-4 rounded-2xl border border-white/10 bg-[#10141d] p-6"
            >
              <h2 className="text-xl font-semibold">Ajustes visuais</h2>
              <div className="grid gap-4 md:grid-cols-2">
                <label className="text-sm">
                  Título do site
                  <input
                    value={settings.siteTitle}
                    onChange={(event) =>
                      setSettings((prev) => ({ ...prev, siteTitle: event.target.value }))
                    }
                    className="mt-1.5 w-full rounded-lg border border-white/15 bg-[#090b10] px-3 py-2"
                  />
                </label>
                <label className="text-sm">
                  Tamanho da logo
                  <input
                    type="number"
                    min={32}
                    max={180}
                    value={settings.logoScale}
                    onChange={(event) =>
                      setSettings((prev) => ({
                        ...prev,
                        logoScale: Number(event.target.value),
                      }))
                    }
                    className="mt-1.5 w-full rounded-lg border border-white/15 bg-[#090b10] px-3 py-2"
                  />
                </label>
                <label className="text-sm">
                  Cor de fundo do site
                  <input
                    type="color"
                    value={settings.homeBackgroundColor}
                    onChange={(event) =>
                      setSettings((prev) => ({
                        ...prev,
                        homeBackgroundColor: event.target.value,
                      }))
                    }
                    className="mt-1.5 h-11 w-full rounded-lg border border-white/15 bg-[#090b10] px-2 py-1"
                  />
                </label>
                <label className="text-sm">
                  Cor dos cards do processo (Etapas 1, 2 e 3)
                  <input
                    type="color"
                    value={settings.processCardsBackgroundColor}
                    onChange={(event) =>
                      setSettings((prev) => ({
                        ...prev,
                        processCardsBackgroundColor: event.target.value,
                      }))
                    }
                    className="mt-1.5 h-11 w-full rounded-lg border border-white/15 bg-[#090b10] px-2 py-1"
                  />
                </label>
                <label className="text-sm">
                  Novo background (arquivo)
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(event) =>
                      setBackgroundFile(event.target.files?.[0] ?? null)
                    }
                    className="mt-1.5 w-full rounded-lg border border-white/15 bg-[#090b10] px-3 py-2"
                  />
                </label>
                <label className="text-sm">
                  Nova logo (arquivo)
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(event) => setLogoFile(event.target.files?.[0] ?? null)}
                    className="mt-1.5 w-full rounded-lg border border-white/15 bg-[#090b10] px-3 py-2"
                  />
                </label>
                <label className="text-sm md:col-span-2">
                  Endereço (footer)
                  <input
                    value={settings.footerAddress}
                    onChange={(event) =>
                      setSettings((prev) => ({ ...prev, footerAddress: event.target.value }))
                    }
                    className="mt-1.5 w-full rounded-lg border border-white/15 bg-[#090b10] px-3 py-2"
                  />
                </label>
                <label className="text-sm">
                  Telefone (footer)
                  <input
                    value={settings.footerPhone}
                    onChange={(event) =>
                      setSettings((prev) => ({ ...prev, footerPhone: event.target.value }))
                    }
                    className="mt-1.5 w-full rounded-lg border border-white/15 bg-[#090b10] px-3 py-2"
                  />
                </label>
                <label className="text-sm">
                  E-mail (footer)
                  <input
                    type="email"
                    value={settings.footerEmail}
                    onChange={(event) =>
                      setSettings((prev) => ({ ...prev, footerEmail: event.target.value }))
                    }
                    className="mt-1.5 w-full rounded-lg border border-white/15 bg-[#090b10] px-3 py-2"
                  />
                </label>
                <label className="text-sm md:col-span-2">
                  Horário de atendimento
                  <input
                    value={settings.footerHours}
                    onChange={(event) =>
                      setSettings((prev) => ({ ...prev, footerHours: event.target.value }))
                    }
                    className="mt-1.5 w-full rounded-lg border border-white/15 bg-[#090b10] px-3 py-2"
                  />
                </label>
                <label className="text-sm">
                  Instagram URL
                  <input
                    value={settings.instagramUrl}
                    onChange={(event) =>
                      setSettings((prev) => ({ ...prev, instagramUrl: event.target.value }))
                    }
                    className="mt-1.5 w-full rounded-lg border border-white/15 bg-[#090b10] px-3 py-2"
                  />
                </label>
                <label className="text-sm">
                  Facebook URL
                  <input
                    value={settings.facebookUrl}
                    onChange={(event) =>
                      setSettings((prev) => ({ ...prev, facebookUrl: event.target.value }))
                    }
                    className="mt-1.5 w-full rounded-lg border border-white/15 bg-[#090b10] px-3 py-2"
                  />
                </label>
                <label className="text-sm md:col-span-2">
                  WhatsApp (URL ou número)
                  <input
                    value={settings.whatsappUrl}
                    onChange={(event) =>
                      setSettings((prev) => ({ ...prev, whatsappUrl: event.target.value }))
                    }
                    placeholder="Ex.: https://wa.me/5569999999999 ou 69999999999"
                    className="mt-1.5 w-full rounded-lg border border-white/15 bg-[#090b10] px-3 py-2"
                  />
                </label>
              </div>

              <button
                type="submit"
                disabled={settingsLoading}
                className="rounded-lg bg-[#c8a24c] px-5 py-2.5 font-semibold text-[#111318] disabled:opacity-70"
              >
                {settingsLoading ? "Salvando..." : "Salvar ajustes visuais"}
              </button>
            </form>
          ) : null}

          {activeTab === "apis" ? (
            <form
              onSubmit={submitSettings}
              className="space-y-4 rounded-2xl border border-white/10 bg-[#10141d] p-6"
            >
              <h2 className="text-xl font-semibold">APIs e integrações</h2>
              <div className="grid gap-4 md:grid-cols-2">
                <label className="text-sm">
                  Meta App ID
                  <input
                    value={settings.metaAppId ?? ""}
                    onChange={(event) =>
                      setSettings((prev) => ({ ...prev, metaAppId: event.target.value }))
                    }
                    className="mt-1.5 w-full rounded-lg border border-white/15 bg-[#090b10] px-3 py-2"
                  />
                </label>
                <label className="text-sm">
                  Meta App Secret
                  <input
                    value={settings.metaAppSecret ?? ""}
                    onChange={(event) =>
                      setSettings((prev) => ({ ...prev, metaAppSecret: event.target.value }))
                    }
                    className="mt-1.5 w-full rounded-lg border border-white/15 bg-[#090b10] px-3 py-2"
                  />
                </label>
                <label className="text-sm md:col-span-2">
                  Meta Access Token
                  <input
                    value={settings.metaAccessToken ?? ""}
                    onChange={(event) =>
                      setSettings((prev) => ({ ...prev, metaAccessToken: event.target.value }))
                    }
                    className="mt-1.5 w-full rounded-lg border border-white/15 bg-[#090b10] px-3 py-2"
                  />
                </label>
              </div>
              <button
                type="submit"
                disabled={settingsLoading}
                className="rounded-lg bg-[#c8a24c] px-5 py-2.5 font-semibold text-[#111318] disabled:opacity-70"
              >
                {settingsLoading ? "Salvando..." : "Salvar configurações de API"}
              </button>
            </form>
          ) : null}

          {activeTab === "admins" ? (
            <section className="rounded-2xl border border-white/10 bg-[#10141d] p-6">
              <h2 className="text-xl font-semibold">Gestão de administradores</h2>
              <p className="mt-2 text-sm text-white/65">
                Somente o administrador principal pode cadastrar e remover acessos
                administrativos.
              </p>

              <form
                onSubmit={createAdminAccount}
                className="mt-5 grid gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-4 md:grid-cols-2"
              >
                <label className="text-sm">
                  Nome do administrador
                  <input
                    required
                    value={newAdminForm.name}
                    onChange={(event) =>
                      setNewAdminForm((prev) => ({ ...prev, name: event.target.value }))
                    }
                    className="mt-1.5 w-full rounded-lg border border-white/15 bg-[#090b10] px-3 py-2"
                  />
                </label>
                <label className="text-sm">
                  E-mail
                  <input
                    type="email"
                    required
                    value={newAdminForm.email}
                    onChange={(event) =>
                      setNewAdminForm((prev) => ({ ...prev, email: event.target.value }))
                    }
                    className="mt-1.5 w-full rounded-lg border border-white/15 bg-[#090b10] px-3 py-2"
                  />
                </label>
                <label className="text-sm">
                  Senha inicial
                  <input
                    required
                    minLength={8}
                    value={newAdminForm.password}
                    onChange={(event) =>
                      setNewAdminForm((prev) => ({ ...prev, password: event.target.value }))
                    }
                    className="mt-1.5 w-full rounded-lg border border-white/15 bg-[#090b10] px-3 py-2"
                  />
                </label>
                <div className="md:col-span-2">
                  <button
                    type="submit"
                    disabled={isCreatingAdmin}
                    className="rounded-lg bg-[#c8a24c] px-5 py-2.5 text-sm font-semibold text-[#111318] disabled:opacity-70"
                  >
                    {isCreatingAdmin ? "Cadastrando..." : "Cadastrar administrador"}
                  </button>
                </div>
              </form>

              <div className="mt-5 space-y-3">
                <h3 className="text-base font-semibold">Administradores ativos</h3>
                {managedAdmins.filter((item) => item.isActive).length === 0 ? (
                  <p className="text-sm text-white/60">Nenhum administrador ativo.</p>
                ) : (
                  managedAdmins
                    .filter((item) => item.isActive)
                    .map((item) => (
                      <article
                        key={item.id}
                        className="rounded-lg border border-white/10 bg-white/[0.03] p-4"
                      >
                        <p className="font-medium">{item.name}</p>
                        <p className="text-sm text-white/70">{item.email}</p>
                        <p className="text-xs text-white/60">
                          {item.role === "SUPER_ADMIN"
                            ? "Administrador principal"
                            : "Administrador"}
                          {" • "}
                          Desde {new Date(item.createdAt).toLocaleDateString("pt-BR")}
                        </p>
                        <div className="mt-3 flex gap-2">
                          <button
                            type="button"
                            onClick={() => void removeAdminAccess(item.id)}
                            disabled={
                              isRemovingAdminId === item.id ||
                              item.id === adminId ||
                              item.role === "SUPER_ADMIN"
                            }
                            className="rounded-md border border-red-300/35 px-3 py-1.5 text-xs text-red-200 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            {isRemovingAdminId === item.id
                              ? "Removendo..."
                              : "Remover acesso"}
                          </button>
                        </div>
                      </article>
                    ))
                )}
              </div>

              <div className="mt-5 space-y-3">
                <h3 className="text-base font-semibold">Pendências antigas</h3>
                {pendingAdmins.length === 0 ? (
                  <p className="text-sm text-white/60">Nenhuma solicitação pendente.</p>
                ) : (
                  pendingAdmins.map((item) => (
                    <article
                      key={item.id}
                      className="rounded-lg border border-white/10 bg-white/[0.03] p-4"
                    >
                      <p className="font-medium">{item.name}</p>
                      <p className="text-sm text-white/70">{item.email}</p>
                      <p className="text-xs text-white/60">
                        Solicitado em {new Date(item.createdAt).toLocaleString("pt-BR")}
                      </p>
                      <div className="mt-3 flex gap-2">
                        <button
                          type="button"
                          onClick={() => handlePendingAdminAction(item.id, "approve_admin")}
                          className="rounded-md border border-emerald-300/35 px-3 py-1.5 text-xs text-emerald-200"
                        >
                          Aprovar
                        </button>
                        <button
                          type="button"
                          onClick={() => handlePendingAdminAction(item.id, "reject_admin")}
                          className="rounded-md border border-red-300/35 px-3 py-1.5 text-xs text-red-200"
                        >
                          Recusar
                        </button>
                      </div>
                    </article>
                  ))
                )}
              </div>
            </section>
          ) : null}

        </section>
      </div>
    </main>
  );
}
