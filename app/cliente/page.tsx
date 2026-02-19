import { redirect } from "next/navigation";
import Link from "next/link";
import { UserRole } from "@prisma/client";
import { getCurrentUser } from "@/lib/auth";
import { LogoutButton } from "@/app/components/LogoutButton";
import { prisma } from "@/lib/prisma";
import { ClientRequestsPanel } from "./ClientRequestsPanel";

export default async function ClientePage() {
  const user = await getCurrentUser();
  if (!user || user.role !== UserRole.CLIENT || !user.isActive) {
    redirect("/login");
  }

  const requests = await prisma.testDrive.findMany({
    where: { customerEmail: user.email.toLowerCase() },
    include: {
      vehicle: {
        select: {
          id: true,
          name: true,
          brand: true,
          model: true,
          year: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 6,
  });

  const approved = requests.filter((item) => item.status === "APPROVED").length;
  const pending = requests.filter((item) => item.status === "PENDING").length;
  const serializedRequests = requests.map((item) => ({
    id: item.id,
    vehicleLabel: `${item.vehicle.brand} ${item.vehicle.model} - ${item.vehicle.year}`,
    preferredDateIso: item.preferredDate.toISOString(),
    scheduledDateIso: item.scheduledDate ? item.scheduledDate.toISOString() : null,
    status: item.status,
    adminObservation: item.adminObservation,
  }));
  const siteSettings = await prisma.siteSettings.upsert({
    where: { id: 1 },
    update: {},
    create: { id: 1 },
  });

  return (
    <main
      className="min-h-screen px-6 py-14 text-white"
      style={{ backgroundColor: siteSettings.homeBackgroundColor ?? "#090b10" }}
    >
      <div className="mx-auto w-full max-w-6xl">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-[#c8a24c]">
              Área do cliente
            </p>
            <h1 className="mt-2 text-3xl font-bold">Bem-vindo, {user.name}</h1>
            <p className="mt-3 text-white/75">
              Acompanhe seus agendamentos e acesse o estoque completo com rapidez.
            </p>
          </div>
          <div className="flex gap-2">
            <Link
              href="/"
              className="rounded-lg border border-white/20 px-4 py-2 text-sm font-medium transition hover:bg-white/5"
            >
              Ir para Home
            </Link>
            <LogoutButton />
          </div>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          <article className="rounded-2xl border border-white/10 bg-[#10141d] p-5">
            <p className="text-sm text-white/65">Solicitações enviadas</p>
            <p className="mt-2 text-3xl font-bold">{requests.length}</p>
          </article>
          <article className="rounded-2xl border border-white/10 bg-[#10141d] p-5">
            <p className="text-sm text-white/65">Aprovadas</p>
            <p className="mt-2 text-3xl font-bold text-emerald-300">{approved}</p>
          </article>
          <article className="rounded-2xl border border-white/10 bg-[#10141d] p-5">
            <p className="text-sm text-white/65">Pendentes</p>
            <p className="mt-2 text-3xl font-bold text-amber-300">{pending}</p>
          </article>
        </div>

        <ClientRequestsPanel requests={serializedRequests} />
      </div>
    </main>
  );
}
