import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/**
 * Exclui definitivamente a conta de um aluno (auth + dados relacionados).
 * Somente admin pode executar. O e-mail fica livre para novo cadastro.
 */
export const excluirAluno = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) => z.object({ aluno_id: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    const { data: ehAdmin, error: roleErr } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (roleErr) throw new Error("Falha ao verificar permissão: " + roleErr.message);
    if (!ehAdmin) throw new Error("Apenas a professora pode excluir contas de alunos.");
    if (data.aluno_id === context.userId) throw new Error("Você não pode excluir a própria conta.");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // remove arquivos enviados pelo aluno
    const { data: entregas } = await supabaseAdmin
      .from("entregas")
      .select("arquivo_url")
      .eq("aluno_id", data.aluno_id);
    const arquivos = (entregas ?? []).map((e) => e.arquivo_url).filter(Boolean) as string[];
    if (arquivos.length) await supabaseAdmin.storage.from("entregas").remove(arquivos);

    const etapas = [
      { nome: "entregas", run: () => supabaseAdmin.from("entregas").delete().eq("aluno_id", data.aluno_id) },
      { nome: "salas", run: () => supabaseAdmin.from("alunos_salas").delete().eq("aluno_id", data.aluno_id) },
      { nome: "papéis", run: () => supabaseAdmin.from("user_roles").delete().eq("user_id", data.aluno_id) },
      { nome: "perfil", run: () => supabaseAdmin.from("profiles").delete().eq("id", data.aluno_id) },
    ];
    for (const etapa of etapas) {
      const { error } = await etapa.run();
      if (error) throw new Error(`Falha ao remover dados (${etapa.nome}): ${error.message}`);
    }

    const { error: authErr } = await supabaseAdmin.auth.admin.deleteUser(data.aluno_id);
    if (authErr) throw new Error("Falha ao excluir a conta: " + authErr.message);

    return { ok: true as const };
  });
