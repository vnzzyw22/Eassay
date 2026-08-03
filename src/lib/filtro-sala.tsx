import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export type Sala = { id: string; nome: string };

/** Carrega a lista de salas para uso em filtros. */
export function useSalas() {
  const [salas, setSalas] = useState<Sala[]>([]);
  useEffect(() => {
    supabase
      .from("salas")
      .select("id, nome")
      .order("nome")
      .then(({ data }) => setSalas((data ?? []) as Sala[]));
  }, []);
  return salas;
}

/** Mapa aluno_id -> lista de sala_id. */
export async function fetchSalasPorAluno(ids: string[]) {
  const mapa: Record<string, string[]> = {};
  if (ids.length === 0) return mapa;
  const { data } = await supabase
    .from("alunos_salas")
    .select("aluno_id, sala_id, salas(nome)")
    .in("aluno_id", ids);
  for (const v of data ?? []) (mapa[v.aluno_id] ??= []).push(v.sala_id);
  return mapa;
}

export function FiltroSala({
  salas,
  value,
  onChange,
}: {
  salas: Sala[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
      <Label className="text-sm text-muted-foreground">Filtrar por sala</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="w-full sm:w-64">
          <SelectValue placeholder="Todas as salas" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="todas">Todas as salas</SelectItem>
          {salas.map((s) => (
            <SelectItem key={s.id} value={s.id}>
              {s.nome}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
