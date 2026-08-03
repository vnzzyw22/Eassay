import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { fetchProfilesMap } from "@/lib/profiles";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const Route = createFileRoute("/_authenticated/admin/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — Eassay" }] }),
  component: Dashboard,
});

function Dashboard() {
  const [stats, setStats] = useState({ alunos: 0, salas: 0, atividadesAbertas: 0, pendentes: 0 });
  const [ultimas, setUltimas] = useState<any[]>([]);

  useEffect(() => {
    (async () => {
      const [alunos, salas, atividades, entregas, ultimasEntregas] = await Promise.all([
        supabase.from("user_roles").select("user_id", { count: "exact", head: true }).eq("role", "aluno"),
        supabase.from("salas").select("id", { count: "exact", head: true }),
        supabase.from("atividades").select("id", { count: "exact", head: true }).eq("publicada", true).gt("prazo", new Date().toISOString()),
        supabase.from("entregas").select("id", { count: "exact", head: true }).eq("status", "entregue"),
        supabase.from("entregas").select("id, status, submitted_at, aluno_id, atividade_id, atividades(titulo)").order("submitted_at", { ascending: false, nullsFirst: false }).limit(10),
      ]);
      setStats({
        alunos: alunos.count ?? 0,
        salas: salas.count ?? 0,
        atividadesAbertas: atividades.count ?? 0,
        pendentes: entregas.count ?? 0,
      });
      const lista = ultimasEntregas.data ?? [];
      const profiles = await fetchProfilesMap(lista.map((e) => e.aluno_id));
      setUltimas(lista.map((e) => ({ ...e, profiles: profiles[e.aluno_id] ?? null })));

    })();
  }, []);

  return (
    <div className="space-y-6">
      <h2 className="font-display text-3xl">Dashboard</h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Alunos" value={stats.alunos} />
        <StatCard label="Salas" value={stats.salas} />
        <StatCard label="Atividades abertas" value={stats.atividadesAbertas} />
        <StatCard label="Entregas pendentes" value={stats.pendentes} />
      </div>
      <Card>
        <CardHeader><CardTitle>Últimas entregas</CardTitle></CardHeader>
        <CardContent>
          {ultimas.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhuma entrega ainda.</p>
          ) : (
            <ul className="divide-y">
              {ultimas.map((e) => (
                <li key={e.id} className="flex items-center justify-between py-2 text-sm">
                  <span>
                    <strong>{(e.profiles as any)?.nome_completo ?? "Aluno"}</strong> — {(e.atividades as any)?.titulo}
                  </span>
                  <span className="text-muted-foreground">{e.status}</span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <Card>
      <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle></CardHeader>
      <CardContent><div className="text-3xl font-semibold">{value}</div></CardContent>
    </Card>
  );
}
