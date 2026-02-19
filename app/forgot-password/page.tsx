"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setMessage(null);
    setError(null);

    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const body = (await response.json()) as { message?: string };

      if (!response.ok) {
        throw new Error(body.message ?? "Não foi possível enviar o link.");
      }

      setMessage(
        body.message ??
          "Se o e-mail estiver cadastrado, você receberá um link de recuperação.",
      );
      setEmail("");
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Não foi possível enviar o link.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#090b10] px-6 py-20 text-white">
      <div className="mx-auto w-full max-w-md rounded-2xl border border-white/10 bg-[#10141d] p-7">
        <p className="text-xs uppercase tracking-[0.18em] text-[#c8a24c]">
          Recuperação de acesso
        </p>
        <h1 className="mt-2 text-3xl font-bold">Esqueci minha senha</h1>
        <p className="mt-2 text-sm text-white/70">
          Informe seu e-mail para receber um link seguro de redefinição.
        </p>

        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <label className="block text-sm">
            E-mail cadastrado
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
              className="mt-1.5 w-full rounded-lg border border-white/15 bg-[#090b10] px-3 py-2 text-sm"
            />
          </label>

          {message ? (
            <p className="rounded-lg border border-emerald-400/30 bg-emerald-400/10 px-3 py-2 text-sm text-emerald-200">
              {message}
            </p>
          ) : null}

          {error ? <p className="text-sm text-red-300">{error}</p> : null}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-[#c8a24c] px-5 py-2.5 font-semibold text-[#111318] disabled:opacity-70"
          >
            {loading ? "Enviando..." : "Enviar link de recuperação"}
          </button>
        </form>

        <div className="mt-5 text-sm text-white/70">
          <Link href="/login" className="text-[#c8a24c] transition hover:brightness-110">
            Voltar para login
          </Link>
        </div>
      </div>
    </main>
  );
}
