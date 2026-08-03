import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Trophy } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const Route = createFileRoute("/_authenticated/aluno/ranking")({
  head: () => ({
    meta: [
      { title: "Ranking da turma — Eassay" },
      { name: "description", content: "Veja a classificação da sua turma e o ranking geral pela média das redações corrigidas." },
      { property: "og:title", content: "Ranking da turma — Eassay" },
      { property: "og:description", content: "Classificação da turma e ranking geral pela média das redações já corrigidas." },
    ],
  }),
  component: Page,
});

type Linha = { aluno_id: string; nome_completo: string; sala_nome: string; media: number };

function Page() {
  const [rows, setRows] = useState<Linha[]>([]);
  const [geral, setGeral] = useState<Linha[]>([]);
  const [meuId, setMeuId] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setMeuId(user?.id ?? null);
      const [{ data }, { data: dataGeral }] = await Promise.all([
        supabase.rpc("ranking_minha_sala"),
        supabase.rpc("ranking_geral" as any),
      ]);
      const mapear = (arr: any[], salaKey: string) =>
        arr
          .map((r) => ({
            aluno_id: r.aluno_id,
            nome_completo: r.nome_completo,
            sala_nome: r[salaKey] ?? "",
            media: Number(r.media),
          }))
          .sort((a, b) => b.media - a.media || a.nome_completo.localeCompare(b.nome_completo, "pt-BR"));
      setRows(mapear((data ?? []) as any[], "sala_nome"));
      setGeral(mapear((dataGeral ?? []) as any[], "salas"));
      setCarregando(false);
    })();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-3xl">Ranking</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Média das notas de todas as redações já corrigidas. Redações sem correção não entram no cálculo.
        </p>
      </div>

      <Tabs defaultValue="turma">
        <TabsList>
          <TabsTrigger value="turma">Minha turma</TabsTrigger>
          <TabsTrigger value="geral">Geral</TabsTrigger>
        </TabsList>

        <TabsContent value="turma" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>{rows[0]?.sala_nome || "Sua turma"}</CardTitle>
            </CardHeader>
            <CardContent>
              <Lista rows={rows} meuId={meuId} carregando={carregando} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="geral" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Ranking geral ({geral.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <Lista rows={geral} meuId={meuId} carregando={carregando} mostrarSala />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function Lista({
  rows,
  meuId,
  carregando,
  mostrarSala,
}: {
  rows: Linha[];
  meuId: string | null;
  carregando: boolean;
  mostrarSala?: boolean;
}) {
  if (carregando) return <p className="text-sm text-muted-foreground">Carregando…</p>;
  if (rows.length === 0)
    return <p className="text-sm text-muted-foreground">Nenhuma redação corrigida ainda.</p>;
  return (
    <ul className="divide-y">
      {rows.map((r, i) => (
        <li
          key={r.aluno_id}
          className={`flex flex-wrap items-center justify-between gap-3 py-3 text-sm ${
            r.aluno_id === meuId ? "font-medium text-brand-deep" : ""
          }`}
        >
          <div className="flex items-center gap-3">
            <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold tabular-nums">
              {i + 1}
            </span>
            <div>
              <p className="flex items-center gap-1.5">
                {r.nome_completo}
                {i < 3 && <Trophy className="h-3.5 w-3.5 text-brand-deep" strokeWidth={1.75} />}
              </p>
              {mostrarSala && (
                <p className="text-xs text-muted-foreground">{r.sala_nome || "Sem sala"}</p>
              )}
            </div>
          </div>
          <span className="tabular-nums font-semibold">
            {r.media.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        </li>
      ))}
    </ul>
  );
}
