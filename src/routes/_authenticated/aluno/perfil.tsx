import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/aluno/perfil")({
  head: () => ({
    meta: [
      { title: "Perfil — Eassay" },
      { name: "description", content: "Seus dados de aluno e as turmas em que você está matriculado." },
      { property: "og:title", content: "Perfil — Eassay" },
      { property: "og:description", content: "Dados cadastrais e turmas do aluno no Eassay." },
    ],
  }),
  component: Page,
});

function Page() {
  const [perfil, setPerfil] = useState<any>(null);
  const [salas, setSalas] = useState<string[]>([]);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: p } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
      setPerfil(p ?? { nome_completo: "—", email: user.email });
      const { data: s } = await supabase.from("alunos_salas").select("salas(nome)").eq("aluno_id", user.id);
      setSalas((s ?? []).map((r: any) => r.salas?.nome).filter(Boolean));
    })();
  }, []);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h2 className="font-display text-3xl">Perfil</h2>
        <p className="mt-1 text-sm text-muted-foreground">Seus dados de aluno no Eassay.</p>
      </div>
      <div className="card-surface divide-y divide-border">
        <Linha rotulo="Nome completo" valor={perfil?.nome_completo ?? "Carregando..."} />
        <Linha rotulo="E-mail" valor={perfil?.email ?? "—"} />
        <Linha rotulo="Turmas" valor={salas.length ? salas.join(", ") : "Nenhuma turma vinculada"} />
        <Linha rotulo="Professora" valor="Fernanda" />
      </div>
    </div>
  );
}

function Linha({ rotulo, valor }: { rotulo: string; valor: string }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 px-5 py-4">
      <span className="text-sm text-muted-foreground">{rotulo}</span>
      <span className="text-sm font-medium text-foreground">{valor}</span>
    </div>
  );
}
