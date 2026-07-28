import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { fetchProfilesMap } from "@/lib/profiles";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin/salas/$id")({
  component: SalaDetail,
});

function SalaDetail() {
  const { id } = useParams({ from: "/_authenticated/admin/salas/$id" });
  const [sala, setSala] = useState<any>(null);
  const [alunos, setAlunos] = useState<any[]>([]);

  const load = async () => {
    const { data: s } = await supabase.from("salas").select("*").eq("id", id).single();
    setSala(s);
    const { data: als } = await supabase
      .from("alunos_salas")
      .select("aluno_id")
      .eq("sala_id", id);
    const profiles = await fetchProfilesMap((als ?? []).map((a) => a.aluno_id));
    setAlunos((als ?? []).map((a) => ({ aluno_id: a.aluno_id, profiles: profiles[a.aluno_id] ?? null })));

  };
  useEffect(() => { load(); }, [id]);

  const remover = async (alunoId: string) => {
    if (!confirm("Remover aluno da sala?")) return;
    const { error } = await supabase.from("alunos_salas").delete().eq("sala_id", id).eq("aluno_id", alunoId);
    if (error) toast.error(error.message); else load();
  };

  if (!sala) return <p>Carregando...</p>;
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Link to="/admin/salas" className="text-sm text-muted-foreground hover:underline">← Salas</Link>
          <h2 className="font-display mt-1 text-3xl">{sala.nome}</h2>
          <p className="text-sm text-muted-foreground">Código: <code className="bg-muted px-1.5">{sala.codigo}</code></p>
        </div>
        <Link to="/admin/atividades/nova"><Button>Criar atividade</Button></Link>
      </div>
      <Card>
        <CardHeader><CardTitle>Alunos ({alunos.length})</CardTitle></CardHeader>
        <CardContent>
          {alunos.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum aluno matriculado. Compartilhe o código com eles.</p>
          ) : (
            <ul className="divide-y">
              {alunos.map((a) => (
                <li key={a.aluno_id} className="flex items-center justify-between py-2">
                  <div>
                    <p className="font-medium">{a.profiles?.nome_completo}</p>
                    <p className="text-sm text-muted-foreground">{a.profiles?.email}</p>
                  </div>
                  <Button size="sm" variant="ghost" onClick={() => remover(a.aluno_id)}>Remover</Button>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
