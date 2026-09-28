import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Trophy } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { fetchProfilesMap } from "@/lib/profiles";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const Route = createFileRoute("/_authenticated/admin/ranking")({
  head: () => ({ meta: [{ title: "Ranking — Eassay" }] }),
  component: Page,
});

type Linha = {
  aluno_id: string;
  nome: string;
  numero_chamada: number | null;
  salas: string[];
  media: number;
};

function ordenar(rows: Linha[]) {
  return [...rows].sort((a, b) => b.media - a.media || a.nome.localeCompare(b.nome, "pt-BR"));
}

function Page() {
  const [salas, setSalas] = useState<{ id: string; nome: string }[]>([]);
  const [salaId, setSalaId] = useState<string>("");
  const [porAluno, setPorAluno] = useState<Linha[]>([]);
  const [salasPorAluno, setSalasPorAluno] = useState<Record<string, string[]>>({});
  const [alunosPorSala, setAlunosPorSala] = useState<Record<string, string[]>>({});

  useEffect(() => {
    (async () => {
      const [{ data: salasData }, { data: entregas }, { data: vinculos }] = await Promise.all([
        supabase.from("salas").select("id, nome").order("nome"),
        supabase.from("entregas").select("aluno_id, nota").eq("status", "corrigida").not("nota", "is", null),
        supabase.from("alunos_salas").select("aluno_id, sala_id, salas(nome)"),
      ]);
      setSalas(salasData ?? []);
      if (salasData?.length) setSalaId((s) => s || salasData[0].id);

      const vinc: Record<string, string[]> = {};
      const porSala: Record<string, string[]> = {};
      for (const v of vinculos ?? []) {
        const nome = (v.salas as any)?.nome;
        if (nome) (vinc[v.aluno_id] ??= []).push(nome);
        (porSala[v.sala_id] ??= []).push(v.aluno_id);
      }
      setSalasPorAluno(vinc);
      setAlunosPorSala(porSala);

      const somas: Record<string, { total: number; n: number }> = {};
      for (const e of entregas ?? []) {
        const s = (somas[e.aluno_id] ??= { total: 0, n: 0 });
        s.total += Number(e.nota);
        s.n += 1;
      }
      const ids = Object.keys(somas);
      const profiles = await fetchProfilesMap(ids);
      setPorAluno(
        ids.map((id) => ({
          aluno_id: id,
          nome: profiles[id]?.nome_completo ?? "—",
          numero_chamada: profiles[id]?.numero_chamada ?? null,
          salas: vinc[id] ?? [],
          media: somas[id].total / somas[id].n,
        })),
      );
    })();
  }, []);

  const geral = useMemo(() => ordenar(porAluno), [porAluno]);
  const daSala = useMemo(() => {
    const ids = new Set(alunosPorSala[salaId] ?? []);
    return ordenar(porAluno.filter((a) => ids.has(a.aluno_id)));
  }, [porAluno, alunosPorSala, salaId]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-3xl">Ranking</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Média das redações corrigidas de cada aluno. Empates são desempatados por ordem alfabética.
        </p>
      </div>

      <Tabs defaultValue="sala">
        <TabsList>
          <TabsTrigger value="sala">Por sala</TabsTrigger>
          <TabsTrigger value="geral">Geral</TabsTrigger>
        </TabsList>

        <TabsContent value="sala" className="mt-4">
          <Card>
            <CardHeader className="flex-row items-center justify-between gap-4 space-y-0">
              <CardTitle>Ranking da turma</CardTitle>
              <Select value={salaId} onValueChange={setSalaId}>
                <SelectTrigger className="w-56"><SelectValue placeholder="Selecione a sala" /></SelectTrigger>
                <SelectContent>
                  {salas.map((s) => (
                    <SelectItem key={s.id} value={s.id}>{s.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardHeader>
            <CardContent>
              <Tabela rows={daSala} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="geral" className="mt-4">
          <Card>
            <CardHeader><CardTitle>Ranking geral ({geral.length})</CardTitle></CardHeader>
            <CardContent>
              <Tabela rows={geral} mostrarSala />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function Tabela({ rows, mostrarSala }: { rows: Linha[]; mostrarSala?: boolean }) {
  if (rows.length === 0) {
    return <p className="text-sm text-muted-foreground">Nenhuma redação corrigida ainda.</p>;
  }
  return (
    <ul className="space-y-2">
      {rows.map((r, i) => {
        const top3 = i < 3;
        return (
          <li
            key={r.aluno_id}
            className={`grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-lg border px-3 py-3 text-sm sm:px-4 ${
              top3 ? "border-primary/40 bg-primary-soft/40" : "border-border"
            }`}
          >
            <div className="flex items-center gap-3">
              <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold tabular-nums">
                {i + 1}
              </span>
              <div>
                <p className="flex items-center gap-1.5 font-medium">
                  {r.nome}
                  {top3 && <Trophy className="h-3.5 w-3.5 text-brand-deep" strokeWidth={1.75} />}
                </p>
                {mostrarSala && (
                  <p className="text-xs text-muted-foreground">{r.salas.join(", ") || "Sem sala"}</p>
                )}
              </div>
            </div>
            <span className="font-semibold tabular-nums">
              {r.media.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </li>
        );
      })}
    </ul>
  );
}
