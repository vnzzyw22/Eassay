import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { AlunoLayout } from "@/lib/aluno-layout";

export const Route = createFileRoute("/_authenticated/aluno")({
  beforeLoad: async () => {
    const { data } = await supabase.auth.getUser();
    if (!data.user) throw redirect({ to: "/auth" });
    const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", data.user.id);
    if (roles?.some((r) => r.role === "admin")) throw redirect({ to: "/admin/dashboard" });
  },
  component: () => (
    <AlunoLayout>
      <Outlet />
    </AlunoLayout>
  ),
});
