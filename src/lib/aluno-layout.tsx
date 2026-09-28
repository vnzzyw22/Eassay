import { Link, useRouterState, useNavigate } from "@tanstack/react-router";
import { BookOpen, History, Trophy, User, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { Brand } from "@/lib/brand";
import type { ReactNode } from "react";

const items = [
  { to: "/aluno/atividades", label: "Minhas atividades", icon: BookOpen },
  { to: "/aluno/entregas", label: "Histórico", icon: History },
  { to: "/aluno/ranking", label: "Ranking", icon: Trophy },
  { to: "/aluno/perfil", label: "Perfil", icon: User },
] as const;


export function AlunoLayout({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (r) => r.location.pathname });
  const navigate = useNavigate();
  const signOut = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  };
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-2 px-3 py-3 sm:gap-6 sm:px-6">
          <div className="shrink-0">
            <Brand />
          </div>
          <nav className="flex min-w-0 items-center gap-0.5 overflow-x-auto sm:gap-1">
            {items.map((it) => {
              const active = pathname.startsWith(it.to);
              const Icon = it.icon;
              return (
                <Link
                  key={it.to}
                  to={it.to}
                  aria-label={it.label}
                  className={`flex min-h-11 min-w-10 shrink-0 items-center justify-center gap-2 rounded-lg px-2 py-2 text-sm transition sm:px-3 ${
                    active
                      ? "bg-primary-soft text-brand-deep font-medium"
                      : "text-muted-foreground hover:bg-muted"
                  }`}
                >
                  <Icon className="h-4 w-4" strokeWidth={1.75} />
                  <span className="hidden sm:inline">{it.label}</span>
                </Link>
              );
            })}
            <Button variant="ghost" size="sm" onClick={signOut} className="text-muted-foreground">
              <LogOut className="h-4 w-4" strokeWidth={1.75} />
              <span className="hidden sm:inline">Sair</span>
            </Button>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-8 animate-fade-in">{children}</main>
    </div>
  );
}
