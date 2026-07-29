import { useMemo, useRef } from "react";

export type Categoria = "ortografia" | "semantica" | "sintaxe" | "outros";

export type Marcacao = { start: number; end: number; cat: Categoria };

export const CATEGORIAS: { id: Categoria; label: string; classe: string; ponto: string }[] = [
  { id: "ortografia", label: "Ortografia", classe: "bg-danger-soft text-danger-foreground", ponto: "bg-danger" },
  { id: "semantica", label: "Semântica", classe: "bg-primary-soft text-brand-deep", ponto: "bg-primary" },
  { id: "sintaxe", label: "Sintaxe", classe: "bg-warning-soft text-warning-foreground", ponto: "bg-warning" },
  { id: "outros", label: "Outros", classe: "bg-accent text-accent-foreground", ponto: "bg-accent-foreground" },
];

const classeDe = (cat: Categoria) => CATEGORIAS.find((c) => c.id === cat)?.classe ?? "";

/** Divide o texto em segmentos, aplicando a marcação mais recente em cada trecho. */
function segmentar(texto: string, marcacoes: Marcacao[]) {
  const limites = new Set<number>([0, texto.length]);
  for (const m of marcacoes) {
    limites.add(Math.max(0, Math.min(texto.length, m.start)));
    limites.add(Math.max(0, Math.min(texto.length, m.end)));
  }
  const pontos = [...limites].sort((a, b) => a - b);
  const segs: { start: number; end: number; cat: Categoria | null }[] = [];
  for (let i = 0; i < pontos.length - 1; i++) {
    const start = pontos[i];
    const end = pontos[i + 1];
    if (end <= start) continue;
    const cobre = marcacoes.filter((m) => m.start <= start && m.end >= end);
    segs.push({ start, end, cat: cobre.length ? cobre[cobre.length - 1].cat : null });
  }
  return segs;
}

export function TextoMarcavel({
  texto,
  marcacoes,
  onSelecionar,
  editavel = true,
}: {
  texto: string;
  marcacoes: Marcacao[];
  onSelecionar?: (start: number, end: number) => void;
  editavel?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const segs = useMemo(() => segmentar(texto, marcacoes), [texto, marcacoes]);

  const capturarSelecao = () => {
    if (!editavel || !onSelecionar) return;
    const sel = window.getSelection();
    if (!sel || sel.isCollapsed || !ref.current) return;
    const range = sel.getRangeAt(0);
    if (!ref.current.contains(range.commonAncestorContainer)) return;

    const offsetGlobal = (node: Node, offset: number) => {
      const el = (node.nodeType === Node.TEXT_NODE ? node.parentElement : (node as HTMLElement)) as HTMLElement | null;
      const span = el?.closest<HTMLElement>("[data-start]");
      if (!span) return null;
      return Number(span.dataset.start) + offset;
    };

    const a = offsetGlobal(range.startContainer, range.startOffset);
    const b = offsetGlobal(range.endContainer, range.endOffset);
    if (a == null || b == null) return;
    const start = Math.min(a, b);
    const end = Math.max(a, b);
    if (end > start) onSelecionar(start, end);
  };

  return (
    <div
      ref={ref}
      onMouseUp={capturarSelecao}
      className="whitespace-pre-wrap rounded-xl border bg-card p-5 text-base leading-relaxed"
    >
      {segs.map((s) => (
        <span
          key={s.start}
          data-start={s.start}
          className={s.cat ? `rounded px-0.5 ${classeDe(s.cat)}` : undefined}
        >
          {texto.slice(s.start, s.end)}
        </span>
      ))}
    </div>
  );
}

export function LegendaCores() {
  return (
    <div className="flex flex-wrap gap-4 rounded-xl border bg-muted/30 p-4 text-sm">
      {CATEGORIAS.map((c) => (
        <span key={c.id} className="inline-flex items-center gap-2">
          <span className={`h-3 w-3 rounded-full ${c.ponto}`} />
          {c.label}
        </span>
      ))}
    </div>
  );
}
