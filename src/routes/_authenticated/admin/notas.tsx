import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { fetchProfilesMap, ordenarPorChamada } from "@/lib/profiles";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const Route = createFileRoute("/_authenticated/admin/notas")({
  head: () => ({ meta: [{ title: "Notas — Eassay" }] }),
  component: Page,
});

function Page() {
  const [rows, setRows] = useState<any[]>([]);
  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("entregas")
        .select("id, nota, corrected_at, aluno_id, atividades(titulo)")
        .eq("status", "corrigida")
        .order("corrected_at", { ascending: false });
      const profiles = await fetchProfilesMap((data ?? []).map((e) => e.aluno_id));
      setRows(
        ordenarPorChamada(
          (data ?? []).map((r) => ({ ...r, profiles: profiles[r.aluno_id] ?? null })),
        ),
      );
    })();
  }, []);

  return (
    <div className="space-y-6">
      <h2 className="font-display text-3xl">Notas</h2>
      <Card>
        <CardHeader><CardTitle>Entregas corrigidas</CardTitle></CardHeader>
        <CardContent>
          {rows.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhuma nota lançada ainda.</p>
          ) : (
            <table className="w-full text-sm">
              <thead className="text-left text-muted-foreground">
                <tr><th className="py-2">Nº</th><th>Aluno</th><th>Atividade</th><th>Nota</th><th>Data</th></tr>
              </thead>
              <tbody className="divide-y">
                {rows.map((r) => (
                  <tr key={r.id}>
                    <td className="py-2 tabular-nums text-muted-foreground">{r.profiles?.numero_chamada ?? "—"}</td>
                    <td>{r.profiles?.nome_completo}</td>
                    <td>{(r.atividades as any)?.titulo}</td>
                    <td className="font-semibold">{r.nota ?? "—"}</td>
                    <td className="text-muted-foreground">{r.corrected_at ? new Date(r.corrected_at).toLocaleDateString() : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
