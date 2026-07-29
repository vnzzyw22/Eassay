import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/**
 * Garante que o aluno autenticado tenha:
 *  - perfil em profiles
 *  - papel 'aluno' em user_roles
 *  - vínculo em alunos_salas com a sala do código informado
 * Usa service role porque anon/aluno não pode ler `salas` antes de estar vinculado.
 */
export const matricularAluno = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) => z.object({ codigo: z.string().min(1) }).parse(data))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const userId = context.userId;
    const claims = context.claims as Record<string, any>;
    const email = (claims.email as string) ?? "";
    const nome =
      (claims.user_metadata?.nome_completo as string) ||
      (claims.user_metadata?.full_name as string) ||
      email;

    const { data: sala, error: salaErr } = await supabaseAdmin
      .from("salas")
      .select("id, nome")
      .eq("codigo", data.codigo.trim().toUpperCase())
      .maybeSingle();
    if (salaErr) throw new Error("Falha ao buscar a sala: " + salaErr.message);
    if (!sala) throw new Error("Código da sala inválido.");

    const { error: profErr } = await supabaseAdmin
      .from("profiles")
      .upsert({ id: userId, nome_completo: nome, email }, { onConflict: "id" });
    if (profErr) throw new Error("Falha ao criar o perfil: " + profErr.message);

    const { data: papeis } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", userId);
    if (!papeis?.length) {
      const { error: roleErr } = await supabaseAdmin
        .from("user_roles")
        .insert({ user_id: userId, role: "aluno" });
      if (roleErr) throw new Error("Falha ao definir o papel do aluno: " + roleErr.message);
    }

    const { error: linkErr } = await supabaseAdmin
      .from("alunos_salas")
      .upsert({ aluno_id: userId, sala_id: sala.id }, { onConflict: "aluno_id,sala_id" });
    if (linkErr) throw new Error("Falha ao vincular à sala: " + linkErr.message);

    return { ok: true as const, sala_id: sala.id, sala_nome: sala.nome };
  });
