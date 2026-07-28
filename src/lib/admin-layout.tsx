import { Link, useRouterState, useNavigate } from "@tanstack/react-router";
import { LayoutDashboard, School, Users, FileText, CheckSquare, Award, Settings, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Brand } from "@/lib/brand";
import { supabase } from "@/integrations/supabase/client";
import type { ReactNode } from "react";

const items = [
  { to: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/admin/salas", label: "Salas", icon: School },
  { to: "/admin/alunos", label: "Alunos", icon: Users },
  { to: "/admin/atividades", label: "Atividades", icon: FileText },
  { to: "/admin/correcoes", label: "Correções", icon: CheckSquare },
  { to: "/admin/notas", label: "Notas", icon: Award },
  { to: "/admin/configuracoes", label: "Configurações", icon: Settings },
] as const;

export function AdminLayout({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (r) => r.location.pathname });
  const navigate = useNavigate();

  const signOut = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  };

  return (
    <div className="flex min-h-screen bg-background">
      <aside className="hidden w-64 shrink-0 flex-col border-r border-border bg-card md:flex">
        <div className="border-b border-border px-6 py-4">
          <Brand />
        </div>
        <nav className="flex-1 space-y-1 p-3">
          {items.map((it) => {
            const active = pathname.startsWith(it.to);
            const Icon = it.icon;
            return (
              <Link
                key={it.to}
                to={it.to}
                className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition ${
                  active
                    ? "bg-primary-soft font-medium text-brand-deep"
                    : "text-muted-foreground hover:bg-muted"
                }`}
              >
                <Icon className="h-4 w-4" strokeWidth={1.75} />
                {it.label}
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-border p-3">
          <Button variant="ghost" className="w-full justify-start text-muted-foreground" onClick={signOut}>
            <LogOut className="mr-2 h-4 w-4" strokeWidth={1.75} /> Sair
          </Button>
        </div>
      </aside>
      <main className="flex-1 overflow-x-hidden p-6 md:p-8 animate-fade-in">{children}</main>
    </div>
  );
}
