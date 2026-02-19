"use client";

import Image from "next/image";
import { useState } from "react";

type CurrentUser = {
  id: string;
  name: string;
  email: string;
  role: string;
};

type HeaderProps = {
  currentUser: CurrentUser | null;
  logoUrl: string;
  logoScale: number;
  isLightBackground: boolean;
  showBottomBorder?: boolean;
  surfaceBorderClass: string;
  headerMutedTextClass: string;
  headerNavClass: string;
  headerNavHoverClass: string;
};

const navLinks = [
  { href: "/estoque", label: "Estoque" },
  { href: "/#diferenciais", label: "Diferenciais" },
  { href: "/#processo", label: "Como funciona" },
  { href: "/#contato", label: "Contato" },
];

export function Header({
  currentUser,
  logoUrl,
  logoScale,
  isLightBackground,
  showBottomBorder = true,
  surfaceBorderClass,
  headerMutedTextClass,
  headerNavClass,
  headerNavHoverClass,
}: HeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  const closeMenu = () => setMenuOpen(false);

  return (
    <>
      <header className={showBottomBorder ? `border-b ${surfaceBorderClass}` : ""}>
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-4 py-5 min-h-[72px] sm:min-h-0 sm:gap-6 sm:px-6 sm:py-5 md:gap-8">
          {/* Mobile: logo + nome apenas (sem wrap) */}
          <a
            href="#"
            className="flex min-w-0 flex-1 items-center gap-3 md:flex-initial"
            aria-label="Jacaré Veículos - início"
            onClick={closeMenu}
          >
            <div
              className={`relative h-14 w-14 shrink-0 overflow-hidden rounded-xl border bg-[#0f3d2e]/40 md:h-[var(--logo-size)] md:w-[var(--logo-size)] ${
                isLightBackground ? "border-black/15" : "border-white/15"
              }`}
              style={{ ["--logo-size" as string]: `${logoScale}px` }}
            >
              <Image
                src={logoUrl}
                alt=""
                fill
                sizes="56px"
                className="object-cover"
              />
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold uppercase tracking-[0.18em] text-[#c8a24c] md:tracking-[0.2em]">
                Jacaré Veículos
              </p>
              {/* Subtítulo só no desktop */}
              <p className={`hidden truncate text-xs md:block ${headerMutedTextClass}`}>
                Carros e motos selecionados
              </p>
            </div>
          </a>

          {/* Desktop: nav central */}
          <nav className={`hidden gap-6 text-sm md:flex md:gap-8 ${headerNavClass}`}>
            {navLinks.map(({ href, label }) => (
              <a
                key={href}
                href={href}
                className={`transition ${headerNavHoverClass}`}
              >
                {label}
              </a>
            ))}
            {currentUser ? (
              <a
                href={
                  currentUser.role === "ADMIN" || currentUser.role === "SUPER_ADMIN"
                    ? "/admin"
                    : "/cliente"
                }
                className={`transition ${headerNavHoverClass}`}
              >
                Painel
              </a>
            ) : (
              <a href="/login" className={`transition ${headerNavHoverClass}`}>
                Entrar
              </a>
            )}
          </nav>

          {/* Desktop: saudação ou Entrar à direita */}
          <div className="hidden shrink-0 md:block">
            {currentUser ? (
              <p className={`text-right text-sm font-medium ${headerNavClass}`}>
                Bem-vindo, <span className="truncate max-w-[180px] inline-block align-bottom">{currentUser.name}</span>
              </p>
            ) : (
              <a href="/login" className={`text-sm font-semibold ${headerNavClass} ${headerNavHoverClass}`}>
                Entrar
              </a>
            )}
          </div>

          {/* Mobile: botão hamburger */}
          <button
            type="button"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-white/20 bg-white/5 text-white/90 transition hover:bg-white/10 md:hidden"
            aria-label="Abrir menu"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen(true)}
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
      </header>

      {/* Mobile: overlay + drawer */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Menu de navegação"
        className={`fixed inset-0 z-[60] md:hidden ${menuOpen ? "pointer-events-auto" : "pointer-events-none"}`}
      >
        <div
          className={`absolute inset-0 bg-black/60 transition-opacity duration-200 ${menuOpen ? "opacity-100" : "opacity-0"}`}
          onClick={closeMenu}
          aria-hidden
        />
        <div
          className={`absolute top-0 right-0 bottom-0 w-full max-w-[280px] border-l border-white/10 bg-[#0d1117] shadow-xl transition-transform duration-200 ease-out ${
            menuOpen ? "translate-x-0" : "translate-x-full"
          }`}
        >
          <div className="flex flex-col gap-1 p-4 pt-6">
            <div className="mb-4 flex items-center justify-between">
              <span className="text-sm font-semibold text-white/90">
                Menu
              </span>
              <button
                type="button"
                className="flex h-9 w-9 items-center justify-center rounded-lg text-white/70 transition hover:bg-white/10 hover:text-white"
                aria-label="Fechar menu"
                onClick={closeMenu}
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            {currentUser && (
              <p className="border-b border-white/10 pb-3 text-xs text-white/70">
                Bem-vindo, <span className="font-medium text-white/90">{currentUser.name}</span>
              </p>
            )}
            {navLinks.map(({ href, label }) => (
              <a
                key={href}
                href={href}
                className="rounded-lg px-3 py-2.5 text-sm font-medium text-white/90 transition hover:bg-white/10 hover:text-white"
                onClick={closeMenu}
              >
                {label}
              </a>
            ))}
            {currentUser ? (
              <a
                href={
                  currentUser.role === "ADMIN" || currentUser.role === "SUPER_ADMIN"
                    ? "/admin"
                    : "/cliente"
                }
                className="rounded-lg px-3 py-2.5 text-sm font-medium text-[#c8a24c] transition hover:bg-white/10"
                onClick={closeMenu}
              >
                Painel
              </a>
            ) : (
              <a
                href="/login"
                className="rounded-lg px-3 py-2.5 text-sm font-medium text-white/90 transition hover:bg-white/10 hover:text-white"
                onClick={closeMenu}
              >
                Entrar
              </a>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
