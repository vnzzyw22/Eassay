export function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <div className="leading-tight">
      <span className="font-display block text-xl text-brand-deep">Eassay</span>
      {!compact && (
        <span className="block text-[11px] tracking-wide text-muted-foreground">
          Turma da Prof. Fernanda
        </span>
      )}
    </div>
  );
}
