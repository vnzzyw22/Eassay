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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
  const [filtroSala, setFiltroSala] = useState<string>("todas");
  const [aExcluir, setAExcluir] = useState<any | null>(null);
  const [excluindo, setExcluindo] = useState(false);

  const load = async () => {
    const { data } = await supabase
      .from("atividades")
      .select("*, atividades_salas(sala_id, salas(nome))")
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

  const excluir = async () => {
    if (!aExcluir) return;
    setExcluindo(true);
    const id = aExcluir.id;
    const e1 = await supabase.from("entregas").delete().eq("atividade_id", id);
    if (e1.error) { toast.error(e1.error.message); setExcluindo(false); return; }
    const e2 = await supabase.from("atividades_salas").delete().eq("atividade_id", id);
    if (e2.error) { toast.error(e2.error.message); setExcluindo(false); return; }
    const e3 = await supabase.from("atividades").delete().eq("id", id);
    if (e3.error) { toast.error(e3.error.message); setExcluindo(false); return; }
    toast.success("Atividade excluída.");
    setExcluindo(false);
    setAExcluir(null);
    load();
  };

  const visiveis =
    filtroSala === "todas"
      ? ativs
      : ativs.filter(
          (a) => a.publicada && a.atividades_salas?.some((x: any) => x.sala_id === filtroSala),
        );

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

      <div className="flex flex-wrap items-center gap-3">
        <Label className="text-sm text-muted-foreground">Filtrar por sala</Label>
        <Select value={filtroSala} onValueChange={setFiltroSala}>
          <SelectTrigger className="w-64"><SelectValue placeholder="Todas as salas" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="todas">Todas as salas</SelectItem>
            {salas.map((s) => (
              <SelectItem key={s.id} value={s.id}>{s.nome}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-4">
        {visiveis.map((a) => {
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
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" variant="outline" onClick={() => togglePublish(a)}>
                    {a.publicada ? "Despublicar" : "Publicar"}
                  </Button>
                  <Button size="sm" variant="destructive" onClick={() => setAExcluir(a)}>
                    Excluir
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
        {visiveis.length === 0 && (
          <p className="text-muted-foreground">
            {ativs.length === 0 ? "Nenhuma atividade criada." : "Nenhuma atividade para esta sala."}
          </p>
        )}
      </div>

      <AlertDialog open={!!aExcluir} onOpenChange={(o) => !o && setAExcluir(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Tem certeza?</AlertDialogTitle>
            <AlertDialogDescription>
              Excluir “{aExcluir?.titulo}” também remove os vínculos com as salas e todas as entregas
              (textos, notas e comentários) dessa atividade. Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={excluindo}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={(e) => { e.preventDefault(); excluir(); }} disabled={excluindo}>
              {excluindo ? "Excluindo..." : "Excluir"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
