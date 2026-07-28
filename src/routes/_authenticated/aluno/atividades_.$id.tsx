import { createFileRoute, useParams, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { ArrowLeft, Check, Loader2, Lock, Paperclip, Send, Save } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  StatusBadge,
  resolveStatus,
  useContagemRegressiva,
  formatarData,
  contarPalavras,
} from "@/lib/atividade-status";

export const Route = createFileRoute("/_authenticated/aluno/atividades_/$id")({
  head: () => ({
    meta: [
      { title: "Escrever redação — Eassay" },
      { name: "description", content: "Escreva, salve o rascunho e entregue sua redação antes do prazo." },
      { property: "og:title", content: "Escrever redação — Eassay" },
      { property: "og:description", content: "Editor de redação com contador de palavras e prazo ao vivo." },
    ],
  }),
  component: Page,
});

function Page() {
  const { id } = useParams({ from: "/_authenticated/aluno/atividades/$id" });
  const [ativ, setAtiv] = useState<any>(null);
  const [entrega, setEntrega] = useState<any>(null);
  const [texto, setTexto] = useState("");
  const [arquivo, setArquivo] = useState<File | null>(null);
  const [anexoUrl, setAnexoUrl] = useState<string | null>(null);
  const [userId, setUserId] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [salvoEm, setSalvoEm] = useState<Date | null>(null);
  const carregado = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setUserId(user.id);
      const { data: a } = await supabase.from("atividades").select("*").eq("id", id).single();
      setAtiv(a);
      if (a?.anexo_url) {
        const { data: signed } = await supabase.storage.from("atividades").createSignedUrl(a.anexo_url, 3600);
        setAnexoUrl(signed?.signedUrl ?? null);
      }
      const { data: e } = await supabase
        .from("entregas").select("*").eq("atividade_id", id).eq("aluno_id", user.id).maybeSingle();
      setEntrega(e);
      setTexto(e?.texto ?? "");
      carregado.current = true;
    })();
  }, [id]);

  const prazoOk = ativ ? new Date(ativ.prazo) > new Date() : false;
  const corrigida = entrega?.status === "corrigida";
  const entregue = entrega?.status === "entregue";
  const podeEditar = prazoOk && !corrigida && !entregue;
  const { restante, texto: contagem } = useContagemRegressiva(ativ?.prazo);
  const palavras = contarPalavras(texto);
  const alvo = ativ?.max_palavras ?? ativ?.min_palavras ?? 0;
  const progresso = alvo ? Math.min(100, (palavras / alvo) * 100) : 0;
  const status = ativ ? resolveStatus(ativ.prazo, entrega) : "aberta";

  // salvamento automático do rascunho
  useEffect(() => {
    if (!carregado.current || !podeEditar || !userId) return;
    if ((entrega?.texto ?? "") === texto) return;
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => void persistir("rascunho", true), 1200);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [texto, podeEditar, userId]);

  const persistir = async (status: "rascunho" | "entregue", automatico = false) => {
    if (!ativ || !userId) return false;
    setSalvando(true);
    let arquivoUrl = entrega?.arquivo_url ?? null;
    if (arquivo) {
      const path = `${userId}/${Date.now()}-${arquivo.name}`;
      const { error } = await supabase.storage.from("entregas").upload(path, arquivo);
      if (error) {
        setSalvando(false);
        toast.error(error.message);
        return false;
      }
      arquivoUrl = path;
    }
    const payload = {
      atividade_id: id,
      aluno_id: userId,
      texto,
      arquivo_url: arquivoUrl,
      status,
      submitted_at: status === "entregue" ? new Date().toISOString() : entrega?.submitted_at ?? null,
    };
    const { data, error } = entrega
      ? await supabase.from("entregas").update(payload).eq("id", entrega.id).select().maybeSingle()
      : await supabase.from("entregas").insert(payload).select().maybeSingle();
    setSalvando(false);
    if (error) {
      if (!automatico) toast.error(error.message);
      return false;
    }
    if (data) setEntrega(data);
    setArquivo(null);
    setSalvoEm(new Date());
    return true;
  };

  const entregar = async () => {
    if (ativ.min_palavras && palavras < ativ.min_palavras && !arquivo && !entrega?.arquivo_url) {
      toast.error(`Escreva pelo menos ${ativ.min_palavras} palavras.`);
      return;
    }
    if (ativ.max_palavras && palavras > ativ.max_palavras) {
      toast.error(`O limite é de ${ativ.max_palavras} palavras.`);
      return;
    }
    if (await persistir("entregue")) toast.success("Redação entregue.");
  };

  if (!ativ) return <p className="text-sm text-muted-foreground">Carregando atividade...</p>;

  return (
    <div className="mx-auto max-w-3xl space-y-8 animate-fade-in">
      <Link
        to="/aluno/atividades"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" strokeWidth={1.75} /> Minhas atividades
      </Link>

      {/* 1. Título */}
      <div className="flex items-start justify-between gap-4">
        <h2 className="font-display text-4xl leading-tight">{ativ.titulo}</h2>
        <StatusBadge status={status} />
      </div>

      {/* 2. Informações */}
      <div className="card-surface grid gap-4 p-5 sm:grid-cols-3">
        <Info rotulo="Tema" valor={ativ.descricao || "—"} span />
        <Info rotulo="Prazo" valor={`${formatarData(ativ.prazo)} · ${contagem}`} />
        <Info
          rotulo="Extensão"
          valor={
            ativ.min_palavras || ativ.max_palavras
              ? `${ativ.min_palavras ?? 0} a ${ativ.max_palavras ?? "—"} palavras`
              : "Livre"
          }
        />
        {anexoUrl && (
          <a
            href={anexoUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:text-brand-deep"
          >
            <Paperclip className="h-4 w-4" strokeWidth={1.75} /> Material de apoio
          </a>
        )}
      </div>

      {corrigida ? (
        <div className="rounded-xl border border-success/30 bg-success-soft p-6">
          <p className="font-display text-2xl text-success-foreground">
            Nota: {entrega.nota != null ? Number(entrega.nota).toLocaleString("pt-BR") : "—"}
            {entrega.comentario ? ` — ${entrega.comentario}` : ""}
          </p>
          <p className="mt-3 whitespace-pre-wrap text-sm text-foreground/80">{entrega.texto}</p>
        </div>
      ) : !prazoOk && !entregue ? (
        <div className="card-surface flex items-center gap-3 p-8 text-muted-foreground">
          <Lock className="h-5 w-5" strokeWidth={1.75} />
          <div>
            <p className="font-medium text-foreground">Prazo encerrado</p>
            <p className="text-sm">Esta atividade não aceita mais envios.</p>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* 3. Campo de escrita */}
          <div>
            <Label htmlFor="redacao" className="text-sm font-medium">Sua redação</Label>
            <Textarea
              id="redacao"
              rows={18}
              value={texto}
              disabled={!podeEditar}
              onChange={(e) => setTexto(e.target.value)}
              placeholder="Comece a escrever aqui. O rascunho é salvo automaticamente."
              className="mt-2 resize-y rounded-xl border-border bg-card p-5 text-base leading-relaxed"
            />
            <div className="mt-3 space-y-2">
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary transition-[width] duration-300 ease-out"
                  style={{ width: `${progresso}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>
                  {palavras}
                  {alvo ? ` / ${alvo}` : ""} palavras
                </span>
                <span className="inline-flex items-center gap-1.5">
                  {salvando ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" strokeWidth={1.75} /> Salvando...
                    </>
                  ) : salvoEm ? (
                    <>
                      <Check className="h-3.5 w-3.5 text-success" strokeWidth={1.75} /> Salvo automaticamente às{" "}
                      {salvoEm.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                    </>
                  ) : null}
                </span>
              </div>
            </div>
          </div>

          {/* 4. Anexo alternativo */}
          <div className="card-surface p-5">
            <Label htmlFor="anexo" className="text-sm font-medium">
              Ou envie um arquivo (PDF, Word ou imagem)
            </Label>
            <p className="mt-1 text-xs text-muted-foreground">
              Use esta opção se preferir anexar a redação em vez de digitá-la.
            </p>
            <Input
              id="anexo"
              type="file"
              accept=".pdf,.doc,.docx,image/*"
              disabled={!podeEditar}
              className="mt-3"
              onChange={(e) => setArquivo(e.target.files?.[0] ?? null)}
            />
            {entrega?.arquivo_url && (
              <p className="mt-2 text-xs text-muted-foreground">
                Arquivo enviado: {entrega.arquivo_url.split("/").pop()}
              </p>
            )}
          </div>

          {/* 5. Botões */}
          {podeEditar ? (
            <div className="flex flex-wrap gap-3">
              <Button variant="outline" onClick={() => persistir("rascunho")} disabled={salvando}>
                <Save className="mr-2 h-4 w-4" strokeWidth={1.75} /> Salvar rascunho
              </Button>
              <Button onClick={entregar} disabled={salvando}>
                <Send className="mr-2 h-4 w-4" strokeWidth={1.75} /> Entregar atividade
              </Button>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Redação entregue{entrega?.submitted_at ? ` em ${formatarData(entrega.submitted_at)}` : ""}. Aguarde a correção
              da Prof. Fernanda.
            </p>
          )}
          {restante > 0 && restante <= 24 * 60 * 60 * 1000 && (
            <p className="text-sm text-warning-foreground">O prazo termina em menos de 24 horas.</p>
          )}
        </div>
      )}
    </div>
  );
}

function Info({ rotulo, valor, span }: { rotulo: string; valor: string; span?: boolean }) {
  return (
    <div className={span ? "sm:col-span-3" : undefined}>
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{rotulo}</p>
      <p className="mt-1 whitespace-pre-wrap text-sm text-foreground">{valor}</p>
    </div>
  );
}
