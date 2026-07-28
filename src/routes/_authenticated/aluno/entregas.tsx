import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { StatusBadge, formatarData } from "@/lib/atividade-status";
import type { AtividadeStatus } from "@/lib/atividade-status";

export const Route = createFileRoute("/_authenticated/aluno/entregas")({
  head: () => ({
    meta: [
      { title: "Histórico de redações — Eassay" },
      { name: "description", content: "Todas as redações já enviadas, com notas e comentários da professora." },
      { property: "og:title", content: "Histórico de redações — Eassay" },
      { property: "og:description", content: "Consulte suas entregas anteriores e as correções recebidas." },
    ],
  }),
  component: Page,
});

const mapa: Record<string, AtividadeStatus> = {
  corrigida: "corrigida",
  entregue: "entregue",
  fora_prazo: "encerrada",
  rascunho: "aberta",
};

function Page() {
  const [rows, setRows] = useState<any[]>([]);
  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("entregas")
        .select("id, status, nota, comentario, submitted_at, created_at, atividade_id, atividades(titulo)")
        .order("submitted_at", { ascending: false, nullsFirst: false });
      setRows(data ?? []);
    })();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-3xl">Histórico</h2>
        <p className="mt-1 text-sm text-muted-foreground">Suas redações enviadas e as correções recebidas.</p>
      </div>
      {rows.length === 0 ? (
        <div className="card-surface p-10 text-center text-sm text-muted-foreground">
          Você ainda não enviou nenhuma redação.
        </div>
      ) : (
        <div className="grid gap-4">
          {rows.map((r) => (
            <Link
              key={r.id}
              to="/aluno/atividades/$id"
              params={{ id: r.atividade_id }}
              className="card-surface hover-lift block p-5"
            >
              <div className="flex items-start justify-between gap-3">
                <h3 className="font-display text-lg">{(r.atividades as any)?.titulo}</h3>
                <StatusBadge status={mapa[r.status] ?? "aberta"} />
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                {r.submitted_at ? `Enviada em ${formatarData(r.submitted_at)}` : "Rascunho não enviado"}
              </p>
              {r.status === "corrigida" && (
                <p className="mt-3 rounded-lg border border-success/30 bg-success-soft px-4 py-3 text-sm text-success-foreground">
                  Nota: {r.nota != null ? Number(r.nota).toLocaleString("pt-BR") : "—"}
                  {r.comentario ? ` — ${r.comentario}` : ""}
                </p>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
