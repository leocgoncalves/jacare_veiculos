"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type AuthMode = "login" | "register";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<AuthMode>("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const endpoint = mode === "login" ? "/api/auth/login" : "/api/auth/register";
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          password,
          role: "CLIENT",
        }),
      });

      if (!response.ok) {
        const body = (await response.json()) as { message?: string };
        throw new Error(body.message || "Falha ao autenticar.");
      }

      if (mode === "register") {
        const loginResponse = await fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password, role: "CLIENT" }),
        });
        if (loginResponse.ok) {
          router.push("/cliente");
          router.refresh();
        }
      } else {
        router.push("/cliente");
        router.refresh();
      }
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Falha ao autenticar.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#090b10] px-6 py-20 text-white">
      <div className="mx-auto w-full max-w-md rounded-2xl border border-white/10 bg-[#10141d] p-7">
        <Link
          href="/"
          className="group mb-4 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.03] px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-white/80 transition-all duration-200 hover:-translate-y-0.5 hover:border-[#c8a24c]/70 hover:bg-[#c8a24c]/10 hover:text-[#f3d79d] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c8a24c] focus-visible:ring-offset-2 focus-visible:ring-offset-[#10141d]"
        >
          <span
            aria-hidden="true"
            className="text-sm leading-none transition-transform duration-200 group-hover:-translate-x-0.5"
          >
            ←
          </span>
          <span>Voltar para Home</span>
        </Link>
        <p className="text-xs uppercase tracking-[0.18em] text-[#c8a24c]">
          Acesso seguro
        </p>
        <h1 className="mt-2 text-3xl font-bold">Entrar no sistema</h1>
        <p className="mt-2 text-sm text-white/70">
          Faça login ou crie sua conta de cliente.
        </p>

        <div className="mt-6 grid grid-cols-2 gap-2 rounded-lg border border-white/10 bg-[#090b10] p-1 text-sm">
          <button
            type="button"
            onClick={() => {
              setMode("login");
              setError(null);
            }}
            className={`rounded-md px-3 py-2 transition ${
              mode === "login"
                ? "bg-[#c8a24c] font-semibold text-[#111318]"
                : "text-white/75 hover:bg-white/5"
            }`}
          >
            Entrar
          </button>
          <button
            type="button"
            onClick={() => {
              setMode("register");
              setError(null);
            }}
            className={`rounded-md px-3 py-2 transition ${
              mode === "register"
                ? "bg-[#c8a24c] font-semibold text-[#111318]"
                : "text-white/75 hover:bg-white/5"
            }`}
          >
            Cadastrar
          </button>
        </div>

        <form onSubmit={onSubmit} className="mt-4 space-y-4">
          {mode === "register" ? (
            <label className="block text-sm">
              Nome completo
              <input
                type="text"
                value={name}
                onChange={(event) => setName(event.target.value)}
                required
                minLength={2}
                className="mt-1.5 w-full rounded-lg border border-white/15 bg-[#090b10] px-3 py-2 text-sm"
              />
            </label>
          ) : null}

          <label className="block text-sm">
            E-mail
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
              className="mt-1.5 w-full rounded-lg border border-white/15 bg-[#090b10] px-3 py-2 text-sm"
            />
          </label>

          <label className="block text-sm">
            Senha
            <div className="relative mt-1.5">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
                minLength={mode === "register" ? 8 : 6}
                className="w-full rounded-lg border border-white/15 bg-[#090b10] px-3 py-2 pr-14 text-sm"
              />
              <button
                type="button"
                onClick={() => setShowPassword((current) => !current)}
                aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                className={`absolute right-3 top-1/2 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center transition ${
                  showPassword
                    ? "text-[#f4cd74]"
                    : "text-white/75 hover:text-white"
                }`}
              >
                {showPassword ? (
                  <svg
                    aria-hidden="true"
                    viewBox="0 0 24 24"
                    className="h-5 w-5"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6-10-6-10-6Z" />
                    <circle cx="12" cy="12" r="2.8" />
                  </svg>
                ) : (
                  <svg
                    aria-hidden="true"
                    viewBox="0 0 24 24"
                    className="h-5 w-5"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M3 3l18 18" />
                    <path d="M10.6 10.6A2.8 2.8 0 0 0 12 14.8a2.8 2.8 0 0 0 2.2-4.6" />
                    <path d="M9.9 5.4A11.6 11.6 0 0 1 12 5.2c6.5 0 10 6 10 6a17.7 17.7 0 0 1-4 4.6" />
                    <path d="M6.3 6.3A17.6 17.6 0 0 0 2 12s3.5 6 10 6c1 0 2-.1 2.9-.4" />
                  </svg>
                )}
              </button>
            </div>
          </label>

          {mode === "login" ? (
            <div className="text-right">
              <Link
                href="/forgot-password"
                className="text-xs text-[#c8a24c] transition hover:brightness-110"
              >
                Esqueci minha senha
              </Link>
            </div>
          ) : null}

          {error ? <p className="text-sm text-red-300">{error}</p> : null}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-[#c8a24c] px-5 py-2.5 font-semibold text-[#111318] disabled:opacity-70"
          >
            {loading
              ? mode === "login"
                ? "Entrando..."
                : "Cadastrando..."
              : mode === "login"
                ? "Entrar"
                : "Criar conta"}
          </button>
        </form>

        <div className="mt-6 rounded-lg border border-white/10 bg-white/[0.03] p-3 text-xs text-white/65">
          <p className="font-semibold text-white/80">Acesso inicial de teste:</p>
          <p>Cliente: cliente@jacareveiculos.com / Cliente@123</p>
          <p className="mt-3">
            Administrador?{" "}
            <Link href="/admin/login" className="text-[#c8a24c] hover:brightness-110">
              Acessar área administrativa
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
