import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { TestDriveForm } from "./TestDriveForm";
import { featuredVehicles } from "@/app/data/vehicles";

type VehiclePageProps = {
  params: Promise<{ id: string }>;
};

export default async function VehiclePage({ params }: VehiclePageProps) {
  const { id } = await params;

  const vehicle = await prisma.vehicle.findFirst({
    where: { id, isPublished: true, deletedAt: null },
    include: { images: { orderBy: { sortOrder: "asc" } } },
  });

  if (!vehicle) {
    const fallback = featuredVehicles.find((item) => item.id === id);
    if (!fallback) notFound();

    return (
      <main className="min-h-screen bg-[#090b10] px-6 py-10 text-white">
        <div className="mx-auto w-full max-w-6xl">
          <div className="mb-6 flex items-center justify-between">
            <Link
              href="/"
              className="rounded-lg border border-white/20 px-4 py-2 text-sm font-medium transition hover:bg-white/5"
            >
              Voltar para Home
            </Link>
          </div>
          <h1 className="text-3xl font-bold md:text-4xl">{fallback.name}</h1>
          <p className="mt-2 text-sm text-white/70">
            {fallback.brand} {fallback.model} | {fallback.year}
          </p>

          <div className="mt-6 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
            <section>
              <div className="relative aspect-[16/10] overflow-hidden rounded-2xl border border-white/10">
                <Image
                  src={fallback.imageUrl}
                  alt={`Foto de ${fallback.name}`}
                  fill
                  sizes="(max-width: 1024px) 100vw, 800px"
                  className="object-cover"
                />
              </div>
            </section>

            <aside className="rounded-2xl border border-white/10 bg-[#10141d] p-6">
              <p className="text-3xl font-bold text-[#c8a24c]">{fallback.price}</p>
              <div className="mt-5 grid grid-cols-2 gap-2 text-sm">
                <div className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
                  <p className="text-white/60">KM rodado</p>
                  <p className="font-semibold">{fallback.km}</p>
                </div>
                <div className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
                  <p className="text-white/60">Ano</p>
                  <p className="font-semibold">{fallback.year}</p>
                </div>
                <div className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
                  <p className="text-white/60">Câmbio</p>
                  <p className="font-semibold">{fallback.transmission}</p>
                </div>
                <div className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
                  <p className="text-white/60">Combustível</p>
                  <p className="font-semibold">{fallback.fuel}</p>
                </div>
                <div className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
                  <p className="text-white/60">Modelo</p>
                  <p className="font-semibold">{fallback.model}</p>
                </div>
                <div className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
                  <p className="text-white/60">Marca</p>
                  <p className="font-semibold">{fallback.brand}</p>
                </div>
              </div>
            </aside>
          </div>

          <section className="mt-8 rounded-2xl border border-white/10 bg-[#10141d] p-6">
            <h2 className="text-xl font-semibold">Descrição do veículo</h2>
            <p className="mt-2 text-white/80">
              {fallback.description || "Sem descrição detalhada no momento."}
            </p>
          </section>

          <section
            id="agendar-teste"
            className="mt-8 rounded-2xl border border-white/10 bg-[#10141d] p-6"
          >
            <h2 className="text-xl font-semibold">Agende seu test-drive</h2>
            <p className="mt-2 text-sm text-white/70">
              Este veículo está em modo demonstração. O agendamento fica ativo
              quando o cadastro vier do painel admin.
            </p>
          </section>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#090b10] px-6 py-10 text-white">
      <div className="mx-auto w-full max-w-6xl">
        <div className="mb-6 flex items-center justify-between">
          <Link
            href="/"
            className="rounded-lg border border-white/20 px-4 py-2 text-sm font-medium transition hover:bg-white/5"
          >
            Voltar para Home
          </Link>
          <Link
            href={`/#estoque`}
            className="rounded-lg border border-[#c8a24c]/40 px-4 py-2 text-sm font-medium text-[#c8a24c] transition hover:bg-[#c8a24c]/10"
          >
            Ver mais anúncios
          </Link>
        </div>
        <h1 className="text-3xl font-bold md:text-4xl">{vehicle.name}</h1>
        <p className="mt-2 text-sm text-white/70">
          {vehicle.brand} {vehicle.model} | {vehicle.year}
        </p>

        <div className="mt-6 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <section>
            <div className="relative aspect-[16/10] overflow-hidden rounded-2xl border border-white/10">
              <Image
                src={vehicle.images[0]?.url ?? "/logo-jacare.png"}
                alt={`Foto de ${vehicle.name}`}
                fill
                sizes="(max-width: 1024px) 100vw, 800px"
                className="object-cover"
              />
            </div>
            {vehicle.images.length > 1 ? (
              <div className="mt-3 grid grid-cols-4 gap-2">
                {vehicle.images.slice(1, 5).map((image) => (
                  <div
                    key={image.id}
                    className="relative aspect-[4/3] overflow-hidden rounded-lg border border-white/10"
                  >
                    <Image
                      src={image.url}
                      alt={image.alt ?? `Imagem de ${vehicle.name}`}
                      fill
                      sizes="200px"
                      className="object-cover"
                    />
                  </div>
                ))}
              </div>
            ) : null}
          </section>

          <aside className="rounded-2xl border border-white/10 bg-[#10141d] p-6 lg:sticky lg:top-6 lg:h-fit">
            <p className="text-3xl font-bold text-[#c8a24c]">
              R$ {(vehicle.priceInCents / 100).toLocaleString("pt-BR")}
            </p>
            <div className="mt-5 grid grid-cols-2 gap-2 text-sm">
              <div className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
                <p className="text-white/60">KM rodado</p>
                <p className="font-semibold">
                  {vehicle.km.toLocaleString("pt-BR")} km
                </p>
              </div>
              <div className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
                <p className="text-white/60">Ano</p>
                <p className="font-semibold">{vehicle.year}</p>
              </div>
              <div className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
                <p className="text-white/60">Câmbio</p>
                <p className="font-semibold">{vehicle.transmission}</p>
              </div>
              <div className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
                <p className="text-white/60">Combustível</p>
                <p className="font-semibold">{vehicle.fuel}</p>
              </div>
              <div className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
                  <p className="text-white/60">Cor</p>
                  <p className="font-semibold">{vehicle.color}</p>
              </div>
              <div className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
                <p className="text-white/60">Modelo</p>
                <p className="font-semibold">{vehicle.model}</p>
              </div>
            </div>
            <Link
              href="#agendar-teste"
              className="mt-5 inline-flex w-full items-center justify-center rounded-lg bg-[#c8a24c] px-4 py-2.5 text-sm font-semibold text-[#111318] transition hover:brightness-95"
            >
              Agendar test-drive
            </Link>
          </aside>
        </div>

        <section className="mt-8 rounded-2xl border border-white/10 bg-[#10141d] p-6">
          <h2 className="text-xl font-semibold">Descrição do veículo</h2>
          <p className="mt-2 text-white/80">
            {vehicle.description || "Sem descrição detalhada no momento."}
          </p>
        </section>

        <section id="agendar-teste" className="mt-8 rounded-2xl border border-white/10 bg-[#10141d] p-6">
          <h2 className="text-xl font-semibold">Agende seu test-drive</h2>
          <p className="mt-2 text-sm text-white/70">
            Preencha os dados e nossa equipe vai confirmar sua agenda.
          </p>
          <TestDriveForm vehicleId={vehicle.id} />
        </section>
      </div>
    </main>
  );
}
