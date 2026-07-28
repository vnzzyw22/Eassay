import { supabase } from "@/integrations/supabase/client";

export type ProfileLite = { nome_completo: string; email: string };

/**
 * As FKs de aluno_id/user_id apontam para auth.users, não para public.profiles,
 * então o PostgREST não consegue fazer embed de `profiles(...)` (erro 400).
 * Buscamos os perfis em uma segunda query e montamos um mapa por id.
 */
export async function fetchProfilesMap(ids: (string | null | undefined)[]) {
  const unique = Array.from(new Set(ids.filter(Boolean) as string[]));
  const map: Record<string, ProfileLite> = {};
  if (unique.length === 0) return map;
  const { data } = await supabase
    .from("profiles")
    .select("id, nome_completo, email")
    .in("id", unique);
  for (const p of data ?? []) {
    map[p.id] = { nome_completo: p.nome_completo, email: p.email };
  }
  return map;
}
