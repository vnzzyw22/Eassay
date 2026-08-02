import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AlertCircle, CheckCircle2, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { fetchProfilesMap, ordenarPorChamada } from "@/lib/profiles";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export const Route = createFileRoute("/_authenticated/admin/correcoes")({
  head: () => ({ meta: [{ title: "Correções — Eassay" }] }),
  component: Page,
});

function Page() {
  const [pendentes, setPendentes] = useState<any[]>([]);
  const [corrigidas, setCorrigidas] = useState<any[]>([]);
  const [aExcluir, setAExcluir] = useState<any | null>(null);
  const [excluindo, setExcluindo] = useState(false);

  const load = async () => {
    const { data } = await supabase
      .from("entregas")
      .select("id, status, submitted_at, nota, aluno_id, atividades(titulo)")
      .order("submitted_at", { ascending: false, nullsFirst: false });
    const profiles = await fetchProfilesMap((data ?? []).map((e) => e.aluno_id));
    const rows = (data ?? []).map((e) => ({ ...e, profiles: profiles[e.aluno_id] ?? null }));
    setPendentes(ordenarPorChamada(rows.filter((r) => r.status !== "corrigida")));
    setCorrigidas(ordenarPorChamada(rows.filter((r) => r.status === "corrigida")));
  };

  useEffect(() => {
    load();
  }, []);

  const excluir = async () => {
    if (!aExcluir) return;
    setExcluindo(true);
    const { error } = await supabase.from("entregas").delete().eq("id", aExcluir.id);
    setExcluindo(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Entrega excluída.");
    setAExcluir(null);
    load();
  };

  const total = pendentes.length + corrigidas.length;

  return (
    <div className="space-y-6">
      <h2 className="font-display text-3xl">Correções</h2>
      <Card>
        <CardHeader>
          <CardTitle>
            Todas as entregas {total > 0 && <span className="text-muted-foreground">({pendentes.length} pendentes)</span>}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {total === 0 ? (
            <p className="text-muted-foreground text-sm">Nenhuma entrega ainda.</p>
          ) : (
            <ul className="divide-y">
              {[...pendentes, ...corrigidas].map((e) => {
                const corrigida = e.status === "corrigida";
                return (
                  <li key={e.id} className="flex items-center justify-between gap-3 py-3">
                    <div className="flex items-center gap-3">
                      {corrigida ? (
                        <CheckCircle2 className="h-5 w-5 shrink-0 text-success" strokeWidth={2} aria-label="Corrigida" />
                      ) : (
                        <AlertCircle className="h-5 w-5 shrink-0 text-danger" strokeWidth={2} aria-label="Pendente" />
                      )}
                      <div>
                        <p className="font-medium">
                          <span className="mr-2 text-muted-foreground tabular-nums">
                            {e.profiles?.numero_chamada ?? "—"}
                          </span>
                          {e.profiles?.nome_completo}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {(e.atividades as any)?.titulo} · {corrigida ? "corrigida" : "pendente"}
                          {e.nota != null && ` · nota ${e.nota}`}
                        </p>
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <Link to="/admin/correcoes/$id" params={{ id: e.id }}>
                        <Button size="sm" variant={corrigida ? "outline" : "default"}>
                          {corrigida ? "Rever" : "Corrigir"}
                        </Button>
                      </Link>
                      <Button
                        size="icon"
                        variant="ghost"
                        aria-label="Excluir entrega"
                        className="text-danger"
                        onClick={() => setAExcluir(e)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={!!aExcluir} onOpenChange={(o) => !o && setAExcluir(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Tem certeza?</AlertDialogTitle>
            <AlertDialogDescription>
              A entrega de {aExcluir?.profiles?.nome_completo ?? "este aluno"} será excluída, junto com a nota e
              o comentário já salvos. Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={excluindo}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={(ev) => { ev.preventDefault(); excluir(); }} disabled={excluindo}>
              {excluindo ? "Excluindo..." : "Excluir"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
