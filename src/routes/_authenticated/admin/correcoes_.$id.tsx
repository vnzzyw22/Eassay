import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { fetchProfilesMap } from "@/lib/profiles";
import { CATEGORIAS, LegendaCores, TextoMarcavel, type Categoria, type Marcacao } from "@/lib/marcacoes";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin/correcoes_/$id")({
  component: Page,
});

function Page() {
  const { id } = Route.useParams();
  const [entrega, setEntrega] = useState<any>(null);
  const [nota, setNota] = useState<string>("");
  const [comentario, setComentario] = useState("");
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [marcacoes, setMarcacoes] = useState<Marcacao[]>([]);
  const [categoria, setCategoria] = useState<Categoria>("ortografia");

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("entregas")
        .select("*, atividades(titulo, descricao)")
        .eq("id", id)
        .single();
      const profiles = await fetchProfilesMap([data?.aluno_id]);
      setEntrega(data ? { ...data, profiles: profiles[data.aluno_id] ?? null } : null);

      setNota(data?.nota != null ? String(data.nota) : "");
      setComentario(data?.comentario ?? "");
      setMarcacoes(Array.isArray((data as any)?.marcacoes) ? ((data as any).marcacoes as Marcacao[]) : []);
      if (data?.arquivo_url) {
        const { data: signed } = await supabase.storage.from("entregas").createSignedUrl(data.arquivo_url, 3600);
        setDownloadUrl(signed?.signedUrl ?? null);
      }
    })();
  }, [id]);

  const marcar = (start: number, end: number) => {
    setMarcacoes((m) => [...m, { start, end, cat: categoria }]);
    window.getSelection()?.removeAllRanges();
  };

  const salvarMarcacoes = async (lista: Marcacao[]) => {
    const { error } = await supabase
      .from("entregas")
      .update({ marcacoes: lista } as any)
      .eq("id", id);
    if (error) toast.error(error.message);
    else toast.success("Marcações salvas.");
  };

  const salvar = async () => {
    const { error } = await supabase
      .from("entregas")
      .update({
        nota: nota === "" ? null : Number(nota),
        comentario,
        marcacoes,
        status: "corrigida",
        corrected_at: new Date().toISOString(),
      } as any)
      .eq("id", id);
    if (error) toast.error(error.message);
    else toast.success("Correção salva.");
  };

  if (!entrega) return <p>Carregando...</p>;
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Link to="/admin/correcoes" className="text-sm text-muted-foreground hover:underline">← Correções</Link>
      <div>
        <h2 className="font-serif text-3xl font-semibold">{(entrega.atividades as any)?.titulo}</h2>
        <p className="text-muted-foreground">
          {entrega.profiles?.numero_chamada != null && `Nº ${entrega.profiles.numero_chamada} · `}
          {entrega.profiles?.nome_completo} · enviado em{" "}
          {entrega.submitted_at ? new Date(entrega.submitted_at).toLocaleString() : "—"}
        </p>
      </div>
      <Card>
        <CardHeader><CardTitle>Entrega</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {entrega.texto && (
            <>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm text-muted-foreground">Marcar seleção como:</span>
                {CATEGORIAS.map((c) => (
                  <Button
                    key={c.id}
                    type="button"
                    size="sm"
                    variant={categoria === c.id ? "default" : "outline"}
                    onClick={() => setCategoria(c.id)}
                  >
                    <span className={`mr-2 h-2.5 w-2.5 rounded-full ${c.ponto}`} />
                    {c.label}
                  </Button>
                ))}
              </div>
              <TextoMarcavel texto={entrega.texto} marcacoes={marcacoes} onSelecionar={marcar} />
              <LegendaCores />
              <div className="flex flex-wrap gap-2">
                <Button size="sm" variant="outline" onClick={() => salvarMarcacoes(marcacoes)}>
                  Salvar marcações
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setMarcacoes((m) => m.slice(0, -1))}
                  disabled={marcacoes.length === 0}
                >
                  Desfazer última
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setMarcacoes([])}
                  disabled={marcacoes.length === 0}
                >
                  Limpar todas
                </Button>
              </div>
            </>
          )}
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
