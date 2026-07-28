import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const Route = createFileRoute("/_authenticated/admin/alunos")({
  head: () => ({ meta: [{ title: "Alunos — Eassay" }] }),
  component: Page,
});

function Page() {
  const [alunos, setAlunos] = useState<any[]>([]);
  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("user_roles")
        .select("user_id, profiles(nome_completo, email), alunos_salas:alunos_salas!alunos_salas_aluno_id_fkey(salas(nome))")
        .eq("role", "aluno");
      setAlunos(data ?? []);
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
                <li key={a.user_id} className="flex items-center justify-between py-2 text-sm">
                  <div>
                    <p className="font-medium">{a.profiles?.nome_completo}</p>
                    <p className="text-muted-foreground">{a.profiles?.email}</p>
                  </div>
                  <div className="text-right text-muted-foreground">
                    {a.alunos_salas?.map((x: any) => x.salas?.nome).filter(Boolean).join(", ") || "—"}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
