import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Download } from "lucide-react";
import * as XLSX from "xlsx";
import { supabase } from "@/integrations/supabase/client";
import { fetchProfilesMap, ordenarPorChamada } from "@/lib/profiles";
import { Button } from "@/components/ui/button";
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

  const atividades = useMemo(() => {
    const set = new Set<string>();
    for (const r of rows) set.add((r.atividades as any)?.titulo ?? "Sem título");
    return Array.from(set);
  }, [rows]);

  const exportar = () => {
    const porAluno = new Map<string, any>();
    for (const r of rows) {
      const linha = porAluno.get(r.aluno_id) ?? {
        "Número de chamada": r.profiles?.numero_chamada ?? "",
        "Nome do aluno": r.profiles?.nome_completo ?? "—",
      };
      linha[(r.atividades as any)?.titulo ?? "Sem título"] =
        r.nota != null ? Number(r.nota) : "";
      porAluno.set(r.aluno_id, linha);
    }
    const dados = Array.from(porAluno.values()).sort(
      (a, b) =>
        (Number(a["Número de chamada"]) || Number.MAX_SAFE_INTEGER) -
        (Number(b["Número de chamada"]) || Number.MAX_SAFE_INTEGER),
    );
    const header = ["Número de chamada", "Nome do aluno", ...atividades];
    const ws = XLSX.utils.json_to_sheet(dados, { header });
    ws["!cols"] = header.map((h) => ({ wch: Math.max(14, h.length + 2) }));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Notas");
    XLSX.writeFile(wb, `notas-${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-display min-w-0 text-2xl sm:text-3xl">Notas</h2>
      </div>
      <div className="hidden">

        <h2 className="font-display text-3xl">Notas</h2>
        <Button onClick={exportar} disabled={rows.length === 0}>
          <Download className="mr-2 h-4 w-4" strokeWidth={1.75} /> Exportar para Excel
        </Button>
      </div>
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
