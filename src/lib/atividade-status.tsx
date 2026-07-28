import { useEffect, useState } from "react";

export type AtividadeStatus = "corrigida" | "entregue" | "encerrada" | "urgente" | "aberta";

export function resolveStatus(prazo: string, entrega?: { status?: string | null } | null): AtividadeStatus {
  if (entrega?.status === "corrigida") return "corrigida";
  const restante = new Date(prazo).getTime() - Date.now();
  if (restante <= 0) return entrega?.status === "entregue" ? "entregue" : "encerrada";
  if (entrega?.status === "entregue") return "entregue";
  if (restante <= 24 * 60 * 60 * 1000) return "urgente";
  return "aberta";
}

export const statusLabel: Record<AtividadeStatus, string> = {
  corrigida: "Corrigida",
  entregue: "Entregue",
  encerrada: "Fora do prazo",
  urgente: "Prazo acabando",
  aberta: "Dentro do prazo",
};

export const statusClass: Record<AtividadeStatus, string> = {
  corrigida: "bg-success-soft text-success-foreground border-success/30",
  entregue: "bg-primary-soft text-brand-deep border-primary/30",
  encerrada: "bg-danger-soft text-danger-foreground border-danger/30",
  urgente: "bg-warning-soft text-warning-foreground border-warning/40",
  aberta: "bg-muted text-muted-foreground border-border",
};

export function StatusBadge({ status }: { status: AtividadeStatus }) {
  return (
    <span
      className={`inline-flex shrink-0 items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${statusClass[status]}`}
    >
      {statusLabel[status]}
    </span>
  );
}

export function formatRestante(ms: number) {
  if (ms <= 0) return "Prazo encerrado";
  const s = Math.floor(ms / 1000);
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (d > 0) return `${d} ${d === 1 ? "dia" : "dias"} ${h}h restantes`;
  if (h > 0) return `${h}h ${m}min restantes`;
  if (m > 0) return `${m}min ${sec}s restantes`;
  return `${sec}s restantes`;
}

export function useContagemRegressiva(prazo?: string | null) {
  const [restante, setRestante] = useState(() =>
    prazo ? new Date(prazo).getTime() - Date.now() : 0,
  );
  useEffect(() => {
    if (!prazo) return;
    const tick = () => setRestante(new Date(prazo).getTime() - Date.now());
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, [prazo]);
  return { restante, texto: formatRestante(restante) };
}

export function formatarData(iso: string) {
  return new Date(iso).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function contarPalavras(t: string) {
  return t.trim().split(/\s+/).filter(Boolean).length;
}
