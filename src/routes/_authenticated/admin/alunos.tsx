import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ChevronRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { fetchProfilesMap, ordenarPorChamada } from "@/lib/profiles";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const Route = createFileRoute("/_authenticated/admin/alunos")({
  head: () => ({ meta: [{ title: "Alunos — Eassay" }] }),
  component: Page,
});

function Page() {
  const [alunos, setAlunos] = useState<any[]>([]);
  useEffect(() => {
    (async () => {
      const { data: roles } = await supabase
        .from("user_roles")
        .select("user_id")
        .eq("role", "aluno");
      const ids = (roles ?? []).map((r) => r.user_id);
      const [profiles, vinculos] = await Promise.all([
        fetchProfilesMap(ids),
        supabase.from("alunos_salas").select("aluno_id, salas(nome)").in("aluno_id", ids.length ? ids : ["00000000-0000-0000-0000-000000000000"]),
      ]);
      const salasPorAluno: Record<string, string[]> = {};
      for (const v of vinculos.data ?? []) {
        const nome = (v.salas as any)?.nome;
        if (!nome) continue;
        (salasPorAluno[v.aluno_id] ??= []).push(nome);
      }
      setAlunos(
        ordenarPorChamada(
          (roles ?? []).map((r) => ({
            user_id: r.user_id,
            profiles: profiles[r.user_id] ?? null,
            salas: salasPorAluno[r.user_id] ?? [],
          })),
        ),
      );
    })();
  }, []);

  return (
    <div className="space-y-6">
      <h2 className="font-display text-3xl">Alunos</h2>
      <Card>
        <CardHeader><CardTitle>Todos os alunos ({alunos.length})</CardTitle></CardHeader>
        <CardContent>
          {alunos.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum aluno cadastrado ainda.</p>
          ) : (
            <ul className="divide-y">
              {alunos.map((a) => (
                <li key={a.user_id}>
                  <Link
                    to="/admin/alunos/$id"
                    params={{ id: a.user_id }}
                    className="flex items-center justify-between gap-3 py-3 text-sm hover:bg-muted/50"
                  >
                    <div className="flex items-center gap-3">
                      <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold tabular-nums">
                        {a.profiles?.numero_chamada ?? "—"}
                      </span>
                      <div>
                        <p className="font-medium">{a.profiles?.nome_completo}</p>
                        <p className="text-muted-foreground">{a.profiles?.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-right text-muted-foreground">
                      {a.salas.join(", ") || "—"}
                      <ChevronRight className="h-4 w-4" strokeWidth={1.75} />
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
