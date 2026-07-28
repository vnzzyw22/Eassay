import { createFileRoute, useParams, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin/correcoes/$id")({
  component: Page,
});

function Page() {
  const { id } = useParams({ from: "/_authenticated/admin/correcoes/$id" });
  const [entrega, setEntrega] = useState<any>(null);
  const [nota, setNota] = useState<string>("");
  const [comentario, setComentario] = useState("");
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("entregas")
        .select("*, atividades(titulo, descricao), profiles!entregas_aluno_id_fkey(nome_completo, email)")
        .eq("id", id)
        .single();
      setEntrega(data);
      setNota(data?.nota != null ? String(data.nota) : "");
      setComentario(data?.comentario ?? "");
      if (data?.arquivo_url) {
        const { data: signed } = await supabase.storage.from("entregas").createSignedUrl(data.arquivo_url, 3600);
        setDownloadUrl(signed?.signedUrl ?? null);
      }
    })();
  }, [id]);

  const salvar = async () => {
    const { error } = await supabase
      .from("entregas")
      .update({
        nota: nota === "" ? null : Number(nota),
        comentario,
        status: "corrigida",
        corrected_at: new Date().toISOString(),
      })
      .eq("id", id);
    if (error) toast.error(error.message);
    else toast.success("Correção salva.");
  };

  if (!entrega) return <p>Carregando...</p>;
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Link to="/admin/correcoes" className="text-sm text-muted-foreground hover:underline">← Correções</Link>
      <div>
        <h2 className="font-display text-3xl">{(entrega.atividades as any)?.titulo}</h2>
        <p className="text-muted-foreground">
          {(entrega.profiles as any)?.nome_completo} · enviado em{" "}
          {entrega.submitted_at ? new Date(entrega.submitted_at).toLocaleString() : "—"}
        </p>
      </div>
      <Card>
        <CardHeader><CardTitle>Entrega</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {entrega.texto && <div className="whitespace-pre-wrap rounded border bg-muted/30 p-4 text-sm">{entrega.texto}</div>}
          {downloadUrl && <a href={downloadUrl} target="_blank" rel="noopener noreferrer" className="text-primary underline text-sm">Baixar arquivo enviado</a>}
          {!entrega.texto && !downloadUrl && <p className="text-muted-foreground text-sm">Sem conteúdo enviado.</p>}
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>Correção</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div><Label>Nota</Label><Input type="number" step="0.1" value={nota} onChange={(e) => setNota(e.target.value)} /></div>
          <div><Label>Comentário</Label><Textarea rows={5} value={comentario} onChange={(e) => setComentario(e.target.value)} /></div>
          <Button onClick={salvar}>Salvar correção</Button>
        </CardContent>
      </Card>
    </div>
  );
}
