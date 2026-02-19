"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { VehicleCard } from "@/app/components/VehicleCard";

const LIMIT = 12;

type VehicleApi = {
  id: string;
  brand: string;
  model: string;
  name: string;
  year: number;
  km: number;
  transmission: string;
  fuel: string;
  priceInCents: number;
  type: string;
  imageUrl: string | null;
};

type ApiResponse = {
  vehicles: VehicleApi[];
  total: number;
  totalPages: number;
  page: number;
  limit: number;
};

function formatPriceFromCents(priceInCents: number) {
  return `R$ ${(priceInCents / 100).toLocaleString("pt-BR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })}`;
}

type EstoqueClientProps = {
  backgroundColor: string;
  isLightTheme: boolean;
};

export function EstoqueClient({ backgroundColor, isLightTheme }: EstoqueClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pageFromUrl = Math.max(1, Number(searchParams.get("page")) || 1);

  const [data, setData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPage = useCallback(async (page: number) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/vehicles?page=${page}&limit=${LIMIT}`);
      if (!res.ok) throw new Error("Falha ao carregar veículos.");
      const json: ApiResponse = await res.json();
      setData(json);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao carregar estoque.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPage(pageFromUrl);
  }, [pageFromUrl, fetchPage]);

  const goToPage = (newPage: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(newPage));
    router.push(`/estoque?${params.toString()}`);
  };

  if (error) {
    return (
      <main
        className="min-h-screen px-4 py-12 sm:px-6 sm:py-14"
        style={{ backgroundColor }}
      >
        <div className="mx-auto max-w-7xl">
          <p className="text-center text-red-400">{error}</p>
          <button
            type="button"
            onClick={() => fetchPage(pageFromUrl)}
            className="mx-auto mt-4 block rounded-xl border border-white/20 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/10"
          >
            Tentar novamente
          </button>
        </div>
      </main>
    );
  }

  const textClass = isLightTheme ? "text-[#111318]" : "text-white";
  const mutedClass = isLightTheme ? "text-[#374151]" : "text-white/70";
  const borderClass = isLightTheme ? "border-black/10" : "border-white/15";
  const buttonDisabledClass = isLightTheme
    ? "cursor-not-allowed border-black/10 bg-black/5 text-black/40"
    : "cursor-not-allowed border-white/10 bg-white/5 text-white/40";
  const buttonActiveClass = isLightTheme
    ? "border-black/20 bg-black/10 text-[#111318] hover:bg-black/15"
    : "border-white/20 bg-white/10 text-white hover:bg-white/15";

  return (
    <main
      className="min-h-screen px-4 py-10 sm:px-6 sm:py-14"
      style={{ backgroundColor }}
    >
      <div className="mx-auto w-full max-w-7xl">
        <div className="mb-8">
          <p className="text-sm uppercase tracking-[0.18em] text-[#c8a24c]">
            Estoque completo
          </p>
          <h1 className={`mt-2 text-3xl font-bold md:text-4xl ${textClass}`}>
            Carros e motos disponíveis
          </h1>
        </div>

        {loading ? (
          <div className={`flex min-h-[320px] items-center justify-center ${mutedClass}`}>
            <p>Carregando veículos...</p>
          </div>
        ) : data && data.vehicles.length === 0 ? (
          <div className={`rounded-2xl border py-16 text-center ${borderClass} ${mutedClass}`}>
            <p>Nenhum veículo disponível no momento.</p>
          </div>
        ) : data ? (
          <>
            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {data.vehicles.map((v) => (
                <VehicleCard
                  key={v.id}
                  id={v.id}
                  name={v.name}
                  brand={v.brand}
                  model={v.model}
                  yearLabel={String(v.year)}
                  kmLabel={`${v.km.toLocaleString("pt-BR")} km`}
                  priceLabel={formatPriceFromCents(v.priceInCents)}
                  imageUrl={v.imageUrl}
                  typeLabel={v.type === "CAR" ? "Carro" : "Moto"}
                  transmission={v.transmission}
                  isLightTheme={isLightTheme}
                />
              ))}
            </div>

            {/* Paginação: só exibe quando há mais de uma página */}
            {data.totalPages > 1 && (
              <nav
                className="mt-10 flex flex-wrap items-center justify-center gap-3 border-t pt-8 sm:mt-14"
                aria-label="Navegação entre páginas do estoque"
              >
                <button
                  type="button"
                  onClick={() => goToPage(data.page - 1)}
                  disabled={data.page <= 1}
                  className={`rounded-xl border px-4 py-2 text-sm font-medium transition disabled:pointer-events-none ${data.page <= 1 ? buttonDisabledClass : buttonActiveClass}`}
                  aria-label="Página anterior"
                >
                  Anterior
                </button>
                <span className={`px-2 text-sm font-medium ${mutedClass}`}>
                  Página {data.page} de {data.totalPages}
                </span>
                <button
                  type="button"
                  onClick={() => goToPage(data.page + 1)}
                  disabled={data.page >= data.totalPages}
                  className={`rounded-xl border px-4 py-2 text-sm font-medium transition disabled:pointer-events-none ${data.page >= data.totalPages ? buttonDisabledClass : buttonActiveClass}`}
                  aria-label="Próxima página"
                >
                  Próxima
                </button>
              </nav>
            )}
          </>
        ) : null}
      </div>
    </main>
  );
}
