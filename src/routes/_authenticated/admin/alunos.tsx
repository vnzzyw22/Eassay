import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { ChevronRight, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { excluirAluno } from "@/lib/admin-alunos.functions";
import { fetchProfilesMap, ordenarPorChamada } from "@/lib/profiles";
import { FiltroSala, useSalas } from "@/lib/filtro-sala";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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

export const Route = createFileRoute("/_authenticated/admin/alunos")({
  head: () => ({ meta: [{ title: "Alunos — Eassay" }] }),
  component: Page,
});

function Page() {
  const [alunos, setAlunos] = useState<any[]>([]);
  const [filtroSala, setFiltroSala] = useState("todas");
  const [alvo, setAlvo] = useState<any>(null);
  const [excluindo, setExcluindo] = useState(false);
  const salas = useSalas();
  const remover = useServerFn(excluirAluno);

  const confirmarExclusao = async () => {
    if (!alvo) return;
    setExcluindo(true);
    try {
      await remover({ data: { aluno_id: alvo.user_id } });
      setAlunos((lista) => lista.filter((a) => a.user_id !== alvo.user_id));
      toast.success("Conta do aluno excluída. O e-mail está livre para novo cadastro.");
      setAlvo(null);
    } catch (e: any) {
      toast.error(e?.message ?? "Não foi possível excluir a conta.");
    } finally {
      setExcluindo(false);
    }
  };

  useEffect(() => {
    (async () => {
      const { data: roles } = await supabase
        .from("user_roles")
        .select("user_id")
        .eq("role", "aluno");
      const ids = (roles ?? []).map((r) => r.user_id);
      const [profiles, vinculos] = await Promise.all([
        fetchProfilesMap(ids),
        supabase
          .from("alunos_salas")
          .select("aluno_id, sala_id, salas(nome)")
          .in("aluno_id", ids.length ? ids : ["00000000-0000-0000-0000-000000000000"]),
      ]);
      const nomesPorAluno: Record<string, string[]> = {};
      const idsPorAluno: Record<string, string[]> = {};
      for (const v of vinculos.data ?? []) {
        (idsPorAluno[v.aluno_id] ??= []).push(v.sala_id);
        const nome = (v.salas as any)?.nome;
        if (nome) (nomesPorAluno[v.aluno_id] ??= []).push(nome);
      }
      setAlunos(
        ordenarPorChamada(
          (roles ?? []).map((r) => ({
            user_id: r.user_id,
            profiles: profiles[r.user_id] ?? null,
            salas: nomesPorAluno[r.user_id] ?? [],
            salaIds: idsPorAluno[r.user_id] ?? [],
          })),
        ),
      );
    })();
  }, []);

  const visiveis = useMemo(
    () =>
      filtroSala === "todas"
        ? alunos
        : alunos.filter((a) => a.salaIds.includes(filtroSala)),
    [alunos, filtroSala],
  );

  return (
    <div className="space-y-6">
      <h2 className="font-display text-2xl sm:text-3xl">Alunos</h2>

      <FiltroSala salas={salas} value={filtroSala} onChange={setFiltroSala} />

      <Card>
        <CardHeader>
          <CardTitle>Todos os alunos ({visiveis.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {visiveis.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              {alunos.length === 0
                ? "Nenhum aluno cadastrado ainda."
                : "Nenhum aluno nesta sala."}
            </p>
          ) : (
            <ul className="divide-y">
              {visiveis.map((a) => (
                <li key={a.user_id} className="flex items-center gap-2">
                  <Link
                    to="/admin/alunos/$id"
                    params={{ id: a.user_id }}
                    className="grid min-w-0 flex-1 grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 py-3 text-sm hover:bg-muted/50"
                  >
                    <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold tabular-nums">
                      {a.profiles?.numero_chamada ?? "—"}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate font-medium">{a.profiles?.nome_completo}</p>
                      <p className="truncate text-muted-foreground">{a.profiles?.email}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {a.salas.join(", ") || "—"}
                      </p>
                    </div>
                    <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" strokeWidth={1.75} />
                  </Link>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label={`Excluir conta de ${a.profiles?.nome_completo ?? "aluno"}`}
                    className="shrink-0 text-danger hover:bg-danger-soft hover:text-danger"
                    onClick={() => setAlvo(a)}
                  >
                    <Trash2 className="h-4 w-4" strokeWidth={1.75} />
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={!!alvo} onOpenChange={(o) => !o && setAlvo(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir conta do aluno?</AlertDialogTitle>
            <AlertDialogDescription>
              A conta de {alvo?.profiles?.nome_completo ?? "este aluno"} ({alvo?.profiles?.email}) será
              apagada junto com todas as redações, notas e vínculos de sala. Essa ação não pode ser
              desfeita, mas o e-mail poderá ser usado em um novo cadastro.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={excluindo}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                void confirmarExclusao();
              }}
              disabled={excluindo}
            >
              {excluindo ? "Excluindo..." : "Excluir conta"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
