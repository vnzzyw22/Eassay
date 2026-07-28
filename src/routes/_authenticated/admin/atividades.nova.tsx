import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin/atividades/nova")({
  head: () => ({ meta: [{ title: "Nova atividade — Eassay" }] }),
  component: Page,
});

function Page() {
  const nav = useNavigate();
  const [salas, setSalas] = useState<any[]>([]);
  const [selSalas, setSelSalas] = useState<Set<string>>(new Set());
  const [titulo, setTitulo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [prazo, setPrazo] = useState("");
  const [minP, setMinP] = useState<number | "">("");
  const [maxP, setMaxP] = useState<number | "">("");
  const [file, setFile] = useState<File | null>(null);
  const [publicar, setPublicar] = useState(true);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.from("salas").select("id, nome").then(({ data }) => setSalas(data ?? []));
  }, []);

  const toggle = (id: string) => {
    const n = new Set(selSalas);
    n.has(id) ? n.delete(id) : n.add(id);
    setSelSalas(n);
  };

  const salvar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selSalas.size === 0) { toast.error("Selecione ao menos uma sala."); return; }
    setLoading(true);

    let anexoUrl: string | null = null;
    if (file) {
      const path = `${Date.now()}-${file.name}`;
      const { error: upErr } = await supabase.storage.from("atividades").upload(path, file);
      if (upErr) { toast.error(upErr.message); setLoading(false); return; }
      anexoUrl = path;
    }

    const { data: at, error } = await supabase
      .from("atividades")
      .insert({
        titulo,
        descricao,
        prazo: new Date(prazo).toISOString(),
        min_palavras: minP === "" ? null : Number(minP),
        max_palavras: maxP === "" ? null : Number(maxP),
        anexo_url: anexoUrl,
        publicada: publicar,
      })
      .select()
      .single();

    if (error || !at) { toast.error(error?.message ?? "Erro"); setLoading(false); return; }

    const links = [...selSalas].map((sala_id) => ({ atividade_id: at.id, sala_id }));
    const { error: linkErr } = await supabase.from("atividades_salas").insert(links);
    if (linkErr) { toast.error(linkErr.message); setLoading(false); return; }

    toast.success("Atividade criada.");
    nav({ to: "/admin/atividades" });
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h2 className="font-display text-3xl">Nova atividade</h2>
      <Card>
        <CardHeader><CardTitle>Dados</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={salvar} className="space-y-4">
            <div><Label>Título</Label><Input required value={titulo} onChange={(e) => setTitulo(e.target.value)} /></div>
            <div><Label>Descrição / enunciado</Label><Textarea rows={5} value={descricao} onChange={(e) => setDescricao(e.target.value)} /></div>
            <div><Label>Anexo (PDF, Word, imagem)</Label><Input type="file" accept=".pdf,.doc,.docx,image/*" onChange={(e) => setFile(e.target.files?.[0] ?? null)} /></div>
            <div><Label>Prazo</Label><Input type="datetime-local" required value={prazo} onChange={(e) => setPrazo(e.target.value)} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Mín. palavras</Label><Input type="number" value={minP} onChange={(e) => setMinP(e.target.value === "" ? "" : Number(e.target.value))} /></div>
              <div><Label>Máx. palavras</Label><Input type="number" value={maxP} onChange={(e) => setMaxP(e.target.value === "" ? "" : Number(e.target.value))} /></div>
            </div>
            <div>
              <Label>Salas que receberão</Label>
              <div className="mt-2 space-y-2 rounded-md border p-3">
                {salas.length === 0 && <p className="text-sm text-muted-foreground">Nenhuma sala. Crie uma sala antes.</p>}
                {salas.map((s) => (
                  <label key={s.id} className="flex items-center gap-2 text-sm">
                    <Checkbox checked={selSalas.has(s.id)} onCheckedChange={() => toggle(s.id)} />
                    {s.nome}
                  </label>
                ))}
              </div>
            </div>
            <label className="flex items-center gap-2 text-sm">
              <Checkbox checked={publicar} onCheckedChange={(v) => setPublicar(!!v)} />
              Publicar imediatamente
            </label>
            <Button type="submit" disabled={loading} className="w-full">
              {loading ? "Salvando..." : "Criar atividade"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
