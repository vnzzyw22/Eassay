import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

export const Route = createFileRoute("/api/public/valida-codigo-sala")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { codigo } = (await request.json()) as { codigo?: string };
        if (!codigo || typeof codigo !== "string") {
          return Response.json({ ok: false });
        }
        const key = process.env.SUPABASE_PUBLISHABLE_KEY!;
        const url = process.env.SUPABASE_URL!;
        const supa = createClient<Database>(url, key, {
          auth: { persistSession: false, autoRefreshToken: false, storage: undefined },
          global: {
            fetch: (input, init) => {
              const h = new Headers(init?.headers);
              if (key.startsWith("sb_") && h.get("Authorization") === `Bearer ${key}`) h.delete("Authorization");
              h.set("apikey", key);
              return fetch(input, { ...init, headers: h });
            },
          },
        });
        // Precisamos ler com service role porque anon não tem SELECT em salas.
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { data } = await supabaseAdmin
          .from("salas")
          .select("id")
          .eq("codigo", codigo.trim().toUpperCase())
          .maybeSingle();
        if (!data) return Response.json({ ok: false });
        return Response.json({ ok: true, sala_id: data.id });
      },
    },
  },
});
