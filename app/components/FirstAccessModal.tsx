"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "jacare:first-access-accepted";

export function FirstAccessModal() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    try {
      const hasAccepted = window.localStorage.getItem(STORAGE_KEY);
      setIsOpen(!hasAccepted);
    } catch {
      // Se o storage estiver indisponível, mantém o modal fechado para evitar quebra da renderização.
      setIsOpen(false);
    }
  }, []);

  const handleContinue = () => {
    window.localStorage.setItem(STORAGE_KEY, "true");
    setIsOpen(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[70] grid place-items-center bg-[#05070ccc] p-6 backdrop-blur-sm">
      <div className="w-full max-w-2xl rounded-2xl border border-white/20 bg-[#0d1118] p-6 md:p-8">
        <p className="mb-3 text-xs uppercase tracking-[0.2em] text-[#c8a24c]">
          Aviso importante
        </p>
        <h2 className="text-2xl font-bold md:text-3xl">
          Protecao contra golpes e uso indevido da marca
        </h2>
        <p className="mt-4 text-sm leading-7 text-white/80 md:text-base">
          A <strong>Jacaré Veículos</strong> não se responsabiliza por danos
          causados por terceiros que utilizem indevidamente nossa marca.
          Reforçamos que a empresa <strong>não solicita documentos</strong> por
          nenhum portal digital, chat ou link externo.
        </p>

        <button
          type="button"
          onClick={handleContinue}
          className="mt-6 w-full rounded-xl bg-[#c8a24c] px-6 py-3 font-semibold text-[#111318] transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-60"
        >
          Concordo com os termos
        </button>
      </div>
    </div>
  );
}
