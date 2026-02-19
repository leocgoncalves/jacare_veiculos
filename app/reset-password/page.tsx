"use client";

import Link from "next/link";
import { FormEvent, Suspense, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";

function ResetPasswordContent() {
  const searchParams = useSearchParams();
  const token = useMemo(() => searchParams.get("token") ?? "", [searchParams]);

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const isMissingToken = token.length === 0;

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    if (password !== confirmPassword) {
      setError("As senhas não coincidem.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          password,
        }),
      });

      const body = (await response.json()) as { message?: string };

      if (!response.ok) {
        throw new Error(body.message ?? "Não foi possível redefinir a senha.");
      }

      setSuccess(body.message ?? "Senha redefinida com sucesso.");
      setPassword("");
      setConfirmPassword("");
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Não foi possível redefinir a senha.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#090b10] px-6 py-20 text-white">
      <div className="mx-auto w-full max-w-md rounded-2xl border border-white/10 bg-[#10141d] p-7">
        <p className="text-xs uppercase tracking-[0.18em] text-[#c8a24c]">
          Redefinição segura
        </p>
        <h1 className="mt-2 text-3xl font-bold">Criar nova senha</h1>
        <p className="mt-2 text-sm text-white/70">
          Defina sua nova senha de acesso para cliente ou administrador.
        </p>

        {isMissingToken ? (
          <p className="mt-6 rounded-lg border border-red-300/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">
            Link inválido. Solicite um novo link de recuperação.
          </p>
        ) : (
          <form onSubmit={onSubmit} className="mt-6 space-y-4">
            <label className="block text-sm">
              Nova senha
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
                minLength={8}
                className="mt-1.5 w-full rounded-lg border border-white/15 bg-[#090b10] px-3 py-2 text-sm"
              />
            </label>

            <label className="block text-sm">
              Confirmar nova senha
              <input
                type="password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                required
                minLength={8}
                className="mt-1.5 w-full rounded-lg border border-white/15 bg-[#090b10] px-3 py-2 text-sm"
              />
            </label>

            {success ? (
              <p className="rounded-lg border border-emerald-400/30 bg-emerald-400/10 px-3 py-2 text-sm text-emerald-200">
                {success}
              </p>
            ) : null}
            {error ? <p className="text-sm text-red-300">{error}</p> : null}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-[#c8a24c] px-5 py-2.5 font-semibold text-[#111318] disabled:opacity-70"
            >
              {loading ? "Atualizando..." : "Redefinir senha"}
            </button>
          </form>
        )}

        <div className="mt-5 text-sm text-white/70">
          <Link href="/login" className="text-[#c8a24c] transition hover:brightness-110">
            Voltar para login
          </Link>
        </div>
      </div>
    </main>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-[#090b10] px-6 py-20 text-white">
          <div className="mx-auto w-full max-w-md rounded-2xl border border-white/10 bg-[#10141d] p-7">
            <p className="text-sm text-white/70">Carregando recuperação de senha...</p>
          </div>
        </main>
      }
    >
      <ResetPasswordContent />
    </Suspense>
  );
}
