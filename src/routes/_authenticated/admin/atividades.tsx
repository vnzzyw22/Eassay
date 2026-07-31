import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin/atividades")({
  head: () => ({ meta: [{ title: "Atividades — Eassay" }] }),
  component: Page,
});

function Page() {
  const [ativs, setAtivs] = useState<any[]>([]);
  const [salas, setSalas] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [selSalas, setSelSalas] = useState<Set<string>>(new Set());
  const [titulo, setTitulo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [prazo, setPrazo] = useState("");
  const [minP, setMinP] = useState<number | "">("");
  const [maxP, setMaxP] = useState<number | "">("");
  const [file, setFile] = useState<File | null>(null);
  const [publicar, setPublicar] = useState(true);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    const { data } = await supabase
      .from("atividades")
      .select("*, atividades_salas(salas(nome))")
      .order("created_at", { ascending: false });
    setAtivs(data ?? []);
  };
  useEffect(() => {
    load();
    supabase.from("salas").select("id, nome").then(({ data }) => setSalas(data ?? []));
  }, []);

  const toggleSala = (id: string) => {
    const n = new Set(selSalas);
    n.has(id) ? n.delete(id) : n.add(id);
    setSelSalas(n);
  };

  const resetForm = () => {
    setTitulo(""); setDescricao(""); setPrazo(""); setMinP(""); setMaxP("");
    setFile(null); setPublicar(true); setSelSalas(new Set());
  };

  const criar = async (e: React.FormEvent) => {
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

    if (error || !at) { toast.error(error?.message ?? "Erro ao criar atividade."); setLoading(false); return; }

    const links = [...selSalas].map((sala_id) => ({ atividade_id: at.id, sala_id }));
    const { error: linkErr } = await supabase.from("atividades_salas").insert(links);
    if (linkErr) { toast.error(linkErr.message); setLoading(false); return; }

    toast.success("Atividade criada.");
    setLoading(false);
    setOpen(false);
    resetForm();
    load();
  };

  const togglePublish = async (a: any) => {
    const { error } = await supabase.from("atividades").update({ publicada: !a.publicada }).eq("id", a.id);
    if (error) toast.error(error.message); else load();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-display min-w-0 text-2xl sm:text-3xl">Atividades</h2>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button>+ Nova atividade</Button></DialogTrigger>
          <DialogContent className="max-h-[85vh] overflow-y-auto">
            <DialogHeader><DialogTitle>Nova atividade</DialogTitle></DialogHeader>
            <form onSubmit={criar} className="space-y-4">
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
                      <Checkbox checked={selSalas.has(s.id)} onCheckedChange={() => toggleSala(s.id)} />
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
          </DialogContent>
        </Dialog>
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
