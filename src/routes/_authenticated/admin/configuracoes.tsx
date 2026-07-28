import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const Route = createFileRoute("/_authenticated/admin/configuracoes")({
  head: () => ({ meta: [{ title: "Configurações — Eassay" }] }),
  component: Page,
});

function Page() {
  const [perfil, setPerfil] = useState<any>(null);
  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase.from("profiles").select("*").eq("id", user.id).single();
      setPerfil(data);
    })();
  }, []);
  return (
    <div className="space-y-6">
      <h2 className="font-display text-3xl">Configurações</h2>
      <Card>
        <CardHeader><CardTitle>Minha conta</CardTitle></CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p><strong>Nome:</strong> {perfil?.nome_completo}</p>
          <p><strong>Email:</strong> {perfil?.email}</p>
        </CardContent>
      </Card>
    </div>
  );
}
