"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

type ClientRequest = {
  id: string;
  vehicleLabel: string;
  preferredDateIso: string;
  scheduledDateIso: string | null;
  status: "PENDING" | "APPROVED" | "REJECTED" | "RESCHEDULED";
  adminObservation: string | null;
};

function statusLabel(status: ClientRequest["status"]) {
  switch (status) {
    case "APPROVED":
      return "Aprovado";
    case "REJECTED":
      return "Recusado";
    case "RESCHEDULED":
      return "Reagendado";
    default:
      return "Pendente";
  }
}

function statusClass(status: ClientRequest["status"]) {
  switch (status) {
    case "APPROVED":
      return "text-emerald-300";
    case "REJECTED":
      return "text-red-300";
    case "RESCHEDULED":
      return "text-amber-300";
    default:
      return "text-[#c8a24c]";
  }
}

type ClientRequestsPanelProps = {
  requests: ClientRequest[];
};

export function ClientRequestsPanel({ requests }: ClientRequestsPanelProps) {
  const router = useRouter();
  const [requestToDelete, setRequestToDelete] = useState<ClientRequest | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const hasRequests = useMemo(() => requests.length > 0, [requests]);

  async function confirmDelete() {
    if (!requestToDelete) return;
    setIsDeleting(true);
    setMessage(null);
    try {
      const response = await fetch(`/api/test-drives/${requestToDelete.id}`, {
        method: "DELETE",
      });
      const body = (await response.json().catch(() => ({}))) as { message?: string };
      if (!response.ok) {
        throw new Error(body.message || "Não foi possível excluir a solicitação.");
      }
      setMessage("Solicitação excluída com sucesso.");
      setRequestToDelete(null);
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Falha ao excluir solicitação.");
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <div className="mt-8 rounded-2xl border border-white/10 bg-[#10141d] p-6">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-xl font-semibold">Últimos agendamentos de test-drive</h2>
        <Link
          href="/#estoque"
          className="rounded-lg bg-[#c8a24c] px-4 py-2 text-sm font-semibold text-[#111318] transition hover:brightness-95"
        >
          Ver estoque
        </Link>
      </div>

      {message ? (
        <p className="mt-4 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-white/85">
          {message}
        </p>
      ) : null}

      {!hasRequests ? (
        <p className="mt-4 text-sm text-white/65">
          Você ainda não possui agendamentos. Entre em um veículo e clique em Agendar
          test-drive.
        </p>
      ) : (
        <div className="mt-4 space-y-3">
          {requests.map((item) => (
            <article
              key={item.id}
              className="rounded-xl border border-white/10 bg-white/[0.03] p-4"
            >
              <p className="font-semibold">{item.vehicleLabel}</p>
              <p className="mt-1 text-sm text-white/70">
                Data preferida: {new Date(item.preferredDateIso).toLocaleString("pt-BR")}
              </p>
              <p className="mt-1 text-sm text-white/70">
                Status:{" "}
                <span className={`font-semibold ${statusClass(item.status)}`}>
                  {statusLabel(item.status)}
                </span>
              </p>
              {item.scheduledDateIso ? (
                <p className="mt-1 text-sm text-white/75">
                  Data agendada:{" "}
                  <span className="font-medium text-white/90">
                    {new Date(item.scheduledDateIso).toLocaleString("pt-BR")}
                  </span>
                </p>
              ) : null}
              {item.adminObservation ? (
                <p className="mt-2 text-sm text-white/75">
                  Observação: {item.adminObservation}
                </p>
              ) : null}
              <button
                type="button"
                onClick={() => setRequestToDelete(item)}
                className="mt-3 rounded-md border border-red-300/35 px-3 py-1.5 text-xs font-semibold text-red-200 transition hover:bg-red-500/10"
              >
                Excluir solicitação
              </button>
            </article>
          ))}
        </div>
      )}

      {requestToDelete ? (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/65 p-4">
          <div className="w-full max-w-md rounded-2xl border border-white/15 bg-[#0f1820] p-5 text-white">
            <p className="text-xs uppercase tracking-[0.14em] text-red-300">Ação irreversível</p>
            <h3 className="mt-2 text-lg font-semibold">Confirmar exclusão da solicitação?</h3>
            <p className="mt-2 text-sm text-white/75">
              Esta solicitação de test-drive será removida permanentemente e não poderá ser
              restaurada.
            </p>
            <p className="mt-2 rounded-md border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-white/85">
              {requestToDelete.vehicleLabel}
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setRequestToDelete(null)}
                disabled={isDeleting}
                className="rounded-md border border-white/20 px-3 py-2 text-sm text-white/85 transition hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-70"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => void confirmDelete()}
                disabled={isDeleting}
                className="rounded-md border border-red-300/40 bg-red-500/15 px-3 py-2 text-sm font-semibold text-red-200 transition hover:bg-red-500/25 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isDeleting ? "Excluindo..." : "Confirmar exclusão"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
