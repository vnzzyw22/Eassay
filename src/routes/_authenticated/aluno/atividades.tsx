import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { CalendarClock, ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { StatusBadge, resolveStatus, formatarData } from "@/lib/atividade-status";

export const Route = createFileRoute("/_authenticated/aluno/atividades")({
  head: () => ({
    meta: [
      { title: "Minhas atividades — Eassay" },
      { name: "description", content: "Redações propostas pela Prof. Fernanda, com prazo e situação de cada entrega." },
      { property: "og:title", content: "Minhas atividades — Eassay" },
      { property: "og:description", content: "Acompanhe suas redações, prazos e correções." },
    ],
  }),
  component: Page,
});

function Page() {
  const [ativs, setAtivs] = useState<any[]>([]);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("atividades")
        .select("id, titulo, prazo, entregas(id, status, nota), atividades_salas(salas(nome))")
        .eq("publicada", true)
        .order("prazo", { ascending: true });
      setAtivs(data ?? []);
      setCarregando(false);
    })();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-3xl">Minhas atividades</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Redações propostas para as suas turmas.
        </p>
      </div>

      {carregando ? (
        <p className="text-sm text-muted-foreground">Carregando atividades...</p>
      ) : ativs.length === 0 ? (
        <div className="card-surface p-10 text-center">
          <p className="text-sm text-muted-foreground">
            Nenhuma atividade publicada para as suas turmas por enquanto.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {ativs.map((a) => {
            const entrega = a.entregas?.[0];
            const status = resolveStatus(a.prazo, entrega);
            const salas =
              a.atividades_salas?.map((s: any) => s.salas?.nome).filter(Boolean).join(", ") || "—";
            return (
              <Link
                key={a.id}
                to="/aluno/atividades/$id"
                params={{ id: a.id }}
                className="card-surface hover-lift group flex flex-col gap-4 p-5"
              >
                <div className="flex items-start justify-between gap-3">
                  <h3 className="font-display text-lg leading-snug">{a.titulo}</h3>
                  <StatusBadge status={status} />
                </div>
                <div className="space-y-1.5 text-sm text-muted-foreground">
                  <p>Sala: {salas}</p>
                  <p className="flex items-center gap-1.5">
                    <CalendarClock className="h-4 w-4" strokeWidth={1.75} />
                    {formatarData(a.prazo)}
                  </p>
                  {status === "corrigida" && entrega?.nota != null && (
                    <p className="text-success-foreground">
                      Nota: {Number(entrega.nota).toLocaleString("pt-BR")}
                    </p>
                  )}
                </div>
                <span className="mt-auto inline-flex items-center gap-1.5 text-sm font-medium text-primary">
                  Abrir atividade
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" strokeWidth={1.75} />
                </span>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
