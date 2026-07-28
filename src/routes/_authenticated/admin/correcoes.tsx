import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/admin/correcoes")({
  head: () => ({ meta: [{ title: "Correções — Eassay" }] }),
  component: Page,
});

function Page() {
  const [entregas, setEntregas] = useState<any[]>([]);
  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("entregas")
        .select("id, status, submitted_at, nota, atividades(titulo), profiles!entregas_aluno_id_fkey(nome_completo)")
        .order("submitted_at", { ascending: false, nullsFirst: false });
      setEntregas(data ?? []);
    })();
  }, []);
  return (
    <div className="space-y-6">
      <h2 className="font-display text-3xl">Correções</h2>
      <Card>
        <CardHeader><CardTitle>Todas as entregas</CardTitle></CardHeader>
        <CardContent>
          {entregas.length === 0 ? (
            <p className="text-muted-foreground text-sm">Nenhuma entrega ainda.</p>
          ) : (
            <ul className="divide-y">
              {entregas.map((e) => (
                <li key={e.id} className="flex items-center justify-between py-2">
                  <div>
                    <p className="font-medium">{(e.profiles as any)?.nome_completo}</p>
                    <p className="text-sm text-muted-foreground">{(e.atividades as any)?.titulo} · {e.status} {e.nota != null && `· nota ${e.nota}`}</p>
                  </div>
                  <Link to="/admin/correcoes/$id" params={{ id: e.id }}><Button size="sm">Abrir</Button></Link>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
