import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Download } from "lucide-react";
import ExcelJS from "exceljs";
import { supabase } from "@/integrations/supabase/client";
import { fetchProfilesMap, ordenarPorChamada } from "@/lib/profiles";
import { FiltroSala, fetchSalasPorAluno, useSalas } from "@/lib/filtro-sala";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const Route = createFileRoute("/_authenticated/admin/notas")({
  head: () => ({ meta: [{ title: "Notas — Eassay" }] }),
  component: Page,
});

function Page() {
  const [todas, setTodas] = useState<any[]>([]);
  const [filtroSala, setFiltroSala] = useState("todas");
  const salas = useSalas();
  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("entregas")
        .select("id, nota, corrected_at, aluno_id, atividades(titulo)")
        .eq("status", "corrigida")
        .order("corrected_at", { ascending: false });
      const ids = (data ?? []).map((e) => e.aluno_id);
      const [profiles, salasPorAluno] = await Promise.all([
        fetchProfilesMap(ids),
        fetchSalasPorAluno(ids),
      ]);
      setTodas(
        ordenarPorChamada(
          (data ?? []).map((r) => ({
            ...r,
            profiles: profiles[r.aluno_id] ?? null,
            salaIds: salasPorAluno[r.aluno_id] ?? [],
          })),
        ),
      );
    })();
  }, []);

  const rows = useMemo(
    () =>
      filtroSala === "todas"
        ? todas
        : todas.filter((r) => r.salaIds?.includes(filtroSala)),
    [todas, filtroSala],
  );

  const atividades = useMemo(() => {
    const set = new Set<string>();
    for (const r of rows) set.add((r.atividades as any)?.titulo ?? "Sem título");
    return Array.from(set);
  }, [rows]);

  const exportar = async () => {
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

    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet("Notas", {
      views: [{ state: "frozen", ySplit: 1 }],
    });
    ws.columns = header.map((h) => ({ header: h, key: h }));
    for (const d of dados) ws.addRow(d);

    const thin = { style: "thin" as const, color: { argb: "FFD4D0C6" } };
    ws.eachRow((row, rowNumber) => {
      row.eachCell({ includeEmpty: true }, (cell) => {
        cell.border = { top: thin, left: thin, bottom: thin, right: thin };
        cell.font = { name: "Arial", size: 11, ...(rowNumber === 1 ? { bold: true, color: { argb: "FFFFFFFF" } } : {}) };
        if (rowNumber === 1) {
          cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF2563EB" } };
          cell.alignment = { vertical: "middle", horizontal: "center", wrapText: true };
        }
      });
      if (rowNumber === 1) row.height = 24;
    });

    ws.columns.forEach((col) => {
      let max = 10;
      col.eachCell?.({ includeEmpty: true }, (cell) => {
        const len = String(cell.value ?? "").length;
        if (len > max) max = len;
      });
      col.width = Math.min(max + 4, 50);
    });

    const buffer = await wb.xlsx.writeBuffer();
    const url = URL.createObjectURL(
      new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      }),
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = `notas-${new Date().toISOString().slice(0, 10)}.xlsx`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-display min-w-0 text-2xl sm:text-3xl">Notas</h2>
        <Button onClick={exportar} disabled={rows.length === 0} className="w-full sm:w-auto">
          <Download className="mr-2 h-4 w-4" strokeWidth={1.75} /> Exportar para Excel
        </Button>
      </div>
      <FiltroSala salas={salas} value={filtroSala} onChange={setFiltroSala} />

      <Card>
        <CardHeader><CardTitle>Entregas corrigidas</CardTitle></CardHeader>
        <CardContent>
          {rows.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhuma nota lançada ainda.</p>
          ) : (
            <>
            <ul className="divide-y sm:hidden">
              {rows.map((r) => (
                <li key={r.id} className="space-y-1 py-3 text-sm">
                  <div className="flex items-start justify-between gap-3">
                    <p className="min-w-0 font-medium">
                      <span className="mr-2 tabular-nums text-muted-foreground">
                        {r.profiles?.numero_chamada ?? "—"}
                      </span>
                      {r.profiles?.nome_completo}
                    </p>
                    <span className="shrink-0 font-semibold">{r.nota ?? "—"}</span>
                  </div>
                  <p className="text-muted-foreground">{(r.atividades as any)?.titulo}</p>
                  <p className="text-xs text-muted-foreground">
                    {r.corrected_at ? new Date(r.corrected_at).toLocaleDateString() : "—"}
                  </p>
                </li>
              ))}
            </ul>
            <div className="-mx-2 hidden overflow-x-auto px-2 sm:block">
            <table className="w-full min-w-[520px] text-sm">

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
            </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
