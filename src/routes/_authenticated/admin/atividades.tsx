import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin/atividades")({
  head: () => ({ meta: [{ title: "Atividades — Eassay" }] }),
  component: Page,
});

function Page() {
  const [ativs, setAtivs] = useState<any[]>([]);
  const load = async () => {
    const { data } = await supabase
      .from("atividades")
      .select("*, atividades_salas(salas(nome))")
      .order("created_at", { ascending: false });
    setAtivs(data ?? []);
  };
  useEffect(() => { load(); }, []);

  const togglePublish = async (a: any) => {
    const { error } = await supabase.from("atividades").update({ publicada: !a.publicada }).eq("id", a.id);
    if (error) toast.error(error.message); else load();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-3xl">Atividades</h2>
        <Link to="/admin/atividades/nova"><Button>+ Nova atividade</Button></Link>
      </div>
      <div className="grid gap-4">
        {ativs.map((a) => {
          const encerrada = new Date(a.prazo) < new Date();
          return (
            <Card key={a.id}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>{a.titulo}</span>
                  <span className={`text-xs rounded px-2 py-0.5 ${encerrada ? "bg-muted" : "bg-primary text-primary-foreground"}`}>
                    {encerrada ? "encerrada" : "aberta"}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <p className="text-muted-foreground">Prazo: {new Date(a.prazo).toLocaleString()}</p>
                <p className="text-muted-foreground">
                  Salas: {a.atividades_salas?.map((x: any) => x.salas?.nome).filter(Boolean).join(", ") || "nenhuma"}
                </p>
                <p className="text-muted-foreground">Status: {a.publicada ? "publicada" : "rascunho"}</p>
                <Button size="sm" variant="outline" onClick={() => togglePublish(a)}>
                  {a.publicada ? "Despublicar" : "Publicar"}
                </Button>
              </CardContent>
            </Card>
          );
        })}
        {ativs.length === 0 && <p className="text-muted-foreground">Nenhuma atividade criada.</p>}
      </div>
    </div>
  );
}
