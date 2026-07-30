import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const Route = createFileRoute("/_authenticated/aluno/ranking")({
  head: () => ({
    meta: [
      { title: "Ranking da turma — Eassay" },
      { name: "description", content: "Veja a classificação da sua turma pela média das redações corrigidas." },
      { property: "og:title", content: "Ranking da turma — Eassay" },
      { property: "og:description", content: "Classificação da turma pela média das redações já corrigidas." },
    ],
  }),
  component: Page,
});

type Linha = { aluno_id: string; nome_completo: string; sala_nome: string; media: number };

function Page() {
  const [rows, setRows] = useState<Linha[]>([]);
  const [meuId, setMeuId] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setMeuId(user?.id ?? null);
      const { data } = await supabase.rpc("ranking_minha_sala");
      const lista = ((data ?? []) as any[]).map((r) => ({
        aluno_id: r.aluno_id,
        nome_completo: r.nome_completo,
        sala_nome: r.sala_nome,
        media: Number(r.media),
      }));
      lista.sort((a, b) => b.media - a.media || a.nome_completo.localeCompare(b.nome_completo, "pt-BR"));
      setRows(lista);
      setCarregando(false);
    })();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-3xl">Ranking da turma</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Média das notas de todas as redações já corrigidas. Redações sem correção não entram no cálculo.
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>{rows[0]?.sala_nome ?? "Sua turma"}</CardTitle>
        </CardHeader>
        <CardContent>
          {carregando ? (
            <p className="text-sm text-muted-foreground">Carregando…</p>
          ) : rows.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhuma redação corrigida ainda na sua turma.</p>
          ) : (
            <ul className="divide-y">
              {rows.map((r, i) => (
                <li
                  key={r.aluno_id}
                  className={`flex items-center justify-between gap-3 py-3 text-sm ${
                    r.aluno_id === meuId ? "font-medium text-brand-deep" : ""
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold tabular-nums">
                      {i + 1}
                    </span>
                    <span>{r.nome_completo}</span>
                  </div>
                  <span className="tabular-nums font-semibold">{r.media.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
