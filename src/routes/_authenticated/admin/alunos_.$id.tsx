import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/admin/alunos_/$id")({
  head: () => ({ meta: [{ title: "Perfil do aluno — Eassay" }] }),
  component: Page,
});

function Page() {
  const { id } = Route.useParams();
  const [perfil, setPerfil] = useState<any>(null);
  const [salas, setSalas] = useState<string[]>([]);
  const [entregas, setEntregas] = useState<any[]>([]);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    (async () => {
      const [{ data: p }, { data: s }, { data: e }] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", id).maybeSingle(),
        supabase.from("alunos_salas").select("salas(nome)").eq("aluno_id", id),
        supabase
          .from("entregas")
          .select("id, status, nota, submitted_at, corrected_at, atividades(titulo)")
          .eq("aluno_id", id)
          .order("submitted_at", { ascending: false, nullsFirst: false }),
      ]);
      setPerfil(p);
      setSalas((s ?? []).map((r: any) => r.salas?.nome).filter(Boolean));
      setEntregas(e ?? []);
      setCarregando(false);
    })();
  }, [id]);

  if (carregando) return <p className="text-sm text-muted-foreground">Carregando aluno...</p>;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Link to="/admin/alunos" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" strokeWidth={1.75} /> Alunos
      </Link>

      <div>
        <h2 className="font-serif text-3xl font-semibold">{perfil?.nome_completo ?? "Aluno"}</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Número de chamada: <span className="font-medium text-foreground">{perfil?.numero_chamada ?? "—"}</span>
          {" · "}
          {perfil?.email}
          {salas.length ? ` · ${salas.join(", ")}` : ""}
        </p>
      </div>

      <Card>
        <CardHeader><CardTitle>Redações entregues ({entregas.length})</CardTitle></CardHeader>
        <CardContent>
          {entregas.length === 0 ? (
            <p className="text-sm text-muted-foreground">Este aluno ainda não entregou nenhuma redação.</p>
          ) : (
            <ul className="divide-y">
              {entregas.map((e) => (
                <li key={e.id} className="flex items-center justify-between gap-3 py-3">
                  <div>
                    <p className="font-medium">{(e.atividades as any)?.titulo ?? "Atividade"}</p>
                    <p className="text-sm text-muted-foreground">
                      {e.status === "corrigida"
                        ? `Corrigida · nota ${e.nota ?? "—"}`
                        : e.submitted_at
                          ? `Entregue em ${new Date(e.submitted_at).toLocaleDateString("pt-BR")} · aguardando correção`
                          : "Rascunho"}
                    </p>
                  </div>
                  <Link to="/admin/correcoes/$id" params={{ id: e.id }}>
                    <Button size="sm" variant="outline">Ver entrega</Button>
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
