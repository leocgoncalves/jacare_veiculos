"use client";

import Image from "next/image";
import Link from "next/link";

type VehicleCardProps = {
  id: string;
  name: string;
  brand: string;
  model: string;
  yearLabel: string;
  kmLabel: string;
  priceLabel: string;
  imageUrl: string | null;
  typeLabel: string;
  transmission: string;
  isLightTheme?: boolean;
};

export function VehicleCard({
  id,
  name,
  brand,
  model,
  yearLabel,
  kmLabel,
  priceLabel,
  imageUrl,
  typeLabel,
  transmission,
  isLightTheme = false,
}: VehicleCardProps) {
  const borderClass = isLightTheme
    ? "border-slate-200 bg-[#f7f8fb] text-[#111827]"
    : "border-white/10 bg-white/[0.03] text-white";
  const mutedClass = isLightTheme ? "text-slate-500" : "text-white/60";
  const accentClass = "text-[#c8a24c]";
  const priceBgClass = isLightTheme
    ? "border-[#c8a24c]/25 bg-[#c8a24c]/5"
    : "border-[#c8a24c]/25 bg-[#c8a24c]/5";

  return (
    <Link
      href={`/veiculos/${id}`}
      className={`group block overflow-hidden rounded-2xl border shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${borderClass}`}
    >
      <div className="relative h-[220px] sm:h-[238px] overflow-hidden">
        <Image
          src={imageUrl ?? "/logo-jacare.png"}
          alt={`Foto de ${name}`}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          className="object-cover transition duration-500 group-hover:scale-[1.03]"
        />
        <span
          className={`absolute left-4 top-4 rounded-full px-4 py-1 text-[11px] font-semibold uppercase tracking-[0.25em] ${
            isLightTheme ? "bg-white text-slate-700" : "bg-white/90 text-slate-700"
          }`}
        >
          {typeLabel}
        </span>
        <span className="absolute bottom-4 right-4 rounded-full bg-[#c8a24c] px-5 py-2 text-xs font-bold uppercase tracking-[0.1em] text-[#111318]">
          Ver detalhes
        </span>
      </div>

      <div className="space-y-4 px-5 pb-5 pt-5">
        <div>
          <p className={`text-[11px] font-semibold uppercase tracking-[0.4em] ${accentClass}`}>
            {brand}
          </p>
          <h3 className={`mt-2 text-xl font-bold leading-tight ${isLightTheme ? "text-[#111827]" : "text-white"}`}>
            {model}
          </h3>
          <p className={`mt-1 text-sm ${mutedClass}`}>
            {yearLabel} · {kmLabel}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2 border-t border-white/10 pt-4 text-sm">
          <div>
            <p className={`text-[11px] uppercase tracking-wider ${mutedClass}`}>Ano</p>
            <p className="font-semibold">{yearLabel}</p>
          </div>
          <div>
            <p className={`text-[11px] uppercase tracking-wider ${mutedClass}`}>Câmbio</p>
            <p className="font-semibold">{transmission}</p>
          </div>
        </div>

        <div className={`flex items-center justify-between gap-3 rounded-xl border-2 px-4 py-3 ${priceBgClass}`}>
          <div>
            <p className={`text-[11px] font-semibold uppercase tracking-wider ${accentClass}`}>
              Preço
            </p>
            <p className="mt-0.5 text-2xl font-black tracking-tight text-[#0f3d2e]">
              {priceLabel}
            </p>
          </div>
          <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#0f3d2e] text-lg font-bold text-[#f6d784]">
            →
          </span>
        </div>
      </div>
    </Link>
  );
}
