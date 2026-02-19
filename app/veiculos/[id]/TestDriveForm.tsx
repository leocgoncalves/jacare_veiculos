"use client";

import { FormEvent, useState } from "react";

export function TestDriveForm({ vehicleId }: { vehicleId: string }) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage(null);

    const formData = new FormData(event.currentTarget);
    const preferredDate = String(formData.get("preferredDate"));
    const preferredHour = String(formData.get("preferredHour"));
    const combinedIso = new Date(`${preferredDate}T${preferredHour}:00`).toISOString();

    try {
      const response = await fetch("/api/test-drives", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vehicleId,
          customerName: formData.get("customerName"),
          customerPhone: formData.get("customerPhone"),
          preferredDate: combinedIso,
          note: formData.get("note") || undefined,
        }),
      });

      const body = (await response.json()) as { message?: string };
      if (!response.ok) {
        throw new Error(body.message || "Falha ao solicitar test-drive.");
      }

      setMessage("Solicitação enviada! Em breve nossa equipe fará contato.");
      event.currentTarget.reset();
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Falha ao enviar solicitação de test-drive.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="mt-4 grid gap-3 md:grid-cols-2">
      <label className="text-sm">
        Nome
        <input
          name="customerName"
          required
          className="mt-1.5 w-full rounded-lg border border-white/15 bg-[#090b10] px-3 py-2"
        />
      </label>
      <label className="text-sm">
        Hora preferencial
        <input
          type="time"
          name="preferredHour"
          required
          className="mt-1.5 w-full rounded-lg border border-white/15 bg-[#090b10] px-3 py-2"
        />
      </label>
      <label className="text-sm">
        Telefone
        <input
          name="customerPhone"
          required
          className="mt-1.5 w-full rounded-lg border border-white/15 bg-[#090b10] px-3 py-2"
        />
      </label>
      <label className="text-sm">
        Data preferencial
        <input
          type="date"
          name="preferredDate"
          required
          className="mt-1.5 w-full rounded-lg border border-white/15 bg-[#090b10] px-3 py-2"
        />
      </label>
      <label className="text-sm md:col-span-2">
        Observacao (opcional)
        <textarea
          rows={3}
          name="note"
          className="mt-1.5 w-full rounded-lg border border-white/15 bg-[#090b10] px-3 py-2"
        />
      </label>
      {message ? (
        <p className="text-sm text-[#c8a24c] md:col-span-2">{message}</p>
      ) : null}
      <button
        type="submit"
        disabled={loading}
        className="rounded-lg bg-[#c8a24c] px-5 py-2.5 font-semibold text-[#111318] disabled:opacity-70 md:col-span-2"
      >
        {loading ? "Enviando..." : "Agendar test-drive"}
      </button>
    </form>
  );
}
