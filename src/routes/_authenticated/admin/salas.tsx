import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/salas")({
  head: () => ({ meta: [{ title: "Salas — Eassay" }] }),
  component: SalasPage,
});

function gerarCodigo() {
  return Math.random().toString(36).slice(2, 8).toUpperCase();
}

function SalasPage() {
  const [salas, setSalas] = useState<any[]>([]);
  const [nome, setNome] = useState("");
  const [codigo, setCodigo] = useState(gerarCodigo());
  const [open, setOpen] = useState(false);

  const load = async () => {
    const { data } = await supabase
      .from("salas")
      .select("id, nome, codigo, created_at, alunos_salas(aluno_id)")
      .order("created_at", { ascending: false });
    setSalas(data ?? []);
  };
  useEffect(() => { load(); }, []);

  const criar = async () => {
    const { error } = await supabase.from("salas").insert({ nome, codigo: codigo.toUpperCase() });
    if (error) { toast.error(error.message); return; }
    toast.success("Sala criada.");
    setOpen(false); setNome(""); setCodigo(gerarCodigo()); load();
  };

  const excluir = async (id: string) => {
    if (!confirm("Excluir sala?")) return;
    const { error } = await supabase.from("salas").delete().eq("id", id);
    if (error) toast.error(error.message); else load();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-3xl">Salas</h2>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button>+ Nova sala</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Nova sala</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div><Label>Nome</Label><Input value={nome} onChange={(e) => setNome(e.target.value)} /></div>
              <div><Label>Código de acesso</Label><Input value={codigo} onChange={(e) => setCodigo(e.target.value.toUpperCase())} /></div>
              <Button onClick={criar} className="w-full">Criar</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {salas.map((s) => (
          <Card key={s.id}>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center justify-between">
                <span>{s.nome}</span>
                <Button size="icon" variant="ghost" onClick={() => excluir(s.id)}><Trash2 className="h-4 w-4" /></Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p><span className="text-muted-foreground">Código:</span> <code className="rounded bg-muted px-1.5">{s.codigo}</code></p>
              <p><span className="text-muted-foreground">Alunos:</span> {s.alunos_salas?.length ?? 0}</p>
              <p className="text-muted-foreground">Criada em {new Date(s.created_at).toLocaleDateString()}</p>
              <Link to="/admin/salas/$id" params={{ id: s.id }}><Button size="sm" variant="outline" className="w-full">Abrir</Button></Link>
            </CardContent>
          </Card>
        ))}
        {salas.length === 0 && <p className="text-muted-foreground">Nenhuma sala ainda.</p>}
      </div>
    </div>
  );
}
