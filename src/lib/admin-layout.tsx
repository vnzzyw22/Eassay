import { Link, useRouterState, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import {
  LayoutDashboard,
  School,
  Users,
  FileText,
  CheckSquare,
  Award,
  Trophy,
  Settings,
  LogOut,
  Menu,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
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
  { to: "/admin/ranking", label: "Ranking", icon: Trophy },
  { to: "/admin/configuracoes", label: "Configurações", icon: Settings },
] as const;

function NavItems({ pathname, onNavigate }: { pathname: string; onNavigate?: () => void }) {
  return (
    <>
      {items.map((it) => {
        const active = pathname.startsWith(it.to);
        const Icon = it.icon;
        return (
          <Link
            key={it.to}
            to={it.to}
            onClick={onNavigate}
            className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all duration-200 ${
              active
                ? "bg-primary-soft font-medium text-primary"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            <Icon className="h-4 w-4 shrink-0" strokeWidth={1.75} />
            {it.label}
          </Link>
        );
      })}
    </>
  );
}

export function AdminLayout({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (r) => r.location.pathname });
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

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
          <NavItems pathname={pathname} />
        </nav>
        <div className="border-t border-border p-3">
          <Button variant="ghost" className="w-full justify-start text-muted-foreground" onClick={signOut}>
            <LogOut className="mr-2 h-4 w-4" strokeWidth={1.75} /> Sair
          </Button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 grid grid-cols-[auto_minmax(0,1fr)] items-center gap-3 border-b border-border bg-card px-4 py-3 md:hidden">
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="Abrir menu">
                <Menu className="h-5 w-5" strokeWidth={1.75} />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 p-0">
              <div className="border-b border-border px-6 py-4">
                <Brand />
              </div>
              <nav className="space-y-1 p-3">
                <NavItems pathname={pathname} onNavigate={() => setOpen(false)} />
              </nav>
              <div className="border-t border-border p-3">
                <Button
                  variant="ghost"
                  className="w-full justify-start text-muted-foreground"
                  onClick={() => {
                    setOpen(false);
                    signOut();
                  }}
                >
                  <LogOut className="mr-2 h-4 w-4" strokeWidth={1.75} /> Sair
                </Button>
              </div>
            </SheetContent>
          </Sheet>
          <div className="min-w-0">
            <Brand compact />
          </div>
        </header>

        <main className="min-w-0 flex-1 overflow-x-hidden p-4 md:p-8 animate-fade-in">{children}</main>
      </div>
    </div>
  );
}
