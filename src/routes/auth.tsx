import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { matricularAluno } from "@/lib/matricula.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { School, User, UserPlus, LogIn, ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/auth")({
  ssr: false,
  head: () => ({ meta: [{ title: "Entrar — Eassay" }] }),
  component: AuthPage,
});

function AuthPage() {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<"options" | "login">("options");
  const [loginLabel, setLoginLabel] = useState("Entrar na sua conta");
  const navigate = useNavigate();
  const matricular = useServerFn(matricularAluno);

  const chooseLogin = (label: string) => {
    setLoginLabel(label);
    setMode("login");
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password: senha });
    if (error) {
      toast.error(error.message);
      setLoading(false);
      return;
    }
    // detecta papel
    const { data: roles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", data.user!.id);
    const isAdmin = roles?.some((r) => r.role === "admin");

    // conclui a matrícula pendente (cadastro com confirmação de email)
    const pendente = localStorage.getItem("eassay_codigo_sala");
    if (!isAdmin && pendente) {
      try {
        await matricular({ data: { codigo: pendente } });
        localStorage.removeItem("eassay_codigo_sala");
      } catch (err: any) {
        toast.error(
          "Não foi possível vincular você à sala: " + (err?.message ?? "erro desconhecido"),
        );
      }
    }

    navigate({ to: isAdmin ? "/admin/dashboard" : "/aluno/dashboard" });
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-login-paper">
      {/* Coluna esquerda — acesso */}
      <section className="flex-1 flex items-center justify-center px-6 py-12 lg:py-0">
        <div className="w-full max-w-md bg-white rounded-[16px] shadow-[0_8px_30px_rgba(30,41,59,0.08)] border border-login-ink/5 p-8 lg:p-10">
          <div className="mb-8 text-center">
            <h1 className="font-serif text-5xl lg:text-6xl font-bold text-login-ink tracking-tight">
              Eassay
            </h1>
            <p className="mt-3 text-login-muted text-sm font-medium tracking-wide">
              Turma da Prof. Fernanda
            </p>
          </div>

          {mode === "options" ? (
            <div className="space-y-3">
              <p className="text-login-muted text-sm mb-4 text-center">
                Escolha como deseja acessar
              </p>
              <button
                type="button"
                onClick={() => chooseLogin("Entrar como professora")}
                className="w-full flex items-center gap-4 rounded-xl border border-login-ink/10 bg-white p-4 text-left transition duration-200 hover:shadow-md hover:-translate-y-0.5 hover:border-login-accent/30"
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-login-accent/10 text-login-accent">
                  <School className="h-5 w-5" strokeWidth={1.75} />
                </span>
                <div>
                  <span className="block text-login-ink font-medium">Sou professora</span>
                  <span className="block text-login-muted text-xs">Acesse o painel da turma</span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => chooseLogin("Entrar como aluno")}
                className="w-full flex items-center gap-4 rounded-xl border border-login-ink/10 bg-white p-4 text-left transition duration-200 hover:shadow-md hover:-translate-y-0.5 hover:border-login-accent/30"
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-login-accent/10 text-login-accent">
                  <User className="h-5 w-5" strokeWidth={1.75} />
                </span>
                <div>
                  <span className="block text-login-ink font-medium">Sou aluno</span>
                  <span className="block text-login-muted text-xs">Entregue redações e veja notas</span>
                </div>
              </button>

              <Link
                to="/cadastro"
                className="w-full flex items-center gap-4 rounded-xl border border-login-ink/10 bg-white p-4 text-left transition duration-200 hover:shadow-md hover:-translate-y-0.5 hover:border-login-accent/30"
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-login-accent/10 text-login-accent">
                  <UserPlus className="h-5 w-5" strokeWidth={1.75} />
                </span>
                <div>
                  <span className="block text-login-ink font-medium">Criar conta</span>
                  <span className="block text-login-muted text-xs">Cadastre-se com o código da sala</span>
                </div>
              </Link>
            </div>
          ) : (
            <div className="space-y-5">
              <button
                type="button"
                onClick={() => setMode("options")}
                className="group flex items-center gap-1 text-sm text-login-muted hover:text-login-accent transition"
              >
                <ArrowLeft className="h-4 w-4 transition group-hover:-translate-x-0.5" strokeWidth={1.75} />
                Escolher outra opção
              </button>

              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-login-accent/10 text-login-accent">
                  <LogIn className="h-5 w-5" strokeWidth={1.75} />
                </span>
                <h2 className="font-sans text-xl font-semibold text-login-ink">{loginLabel}</h2>
              </div>

              <form onSubmit={onSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="email" className="text-login-ink font-medium">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="mt-1 border-login-ink/10 focus-visible:ring-login-accent"
                  />
                </div>
                <div>
                  <Label htmlFor="senha" className="text-login-ink font-medium">Senha</Label>
                  <Input
                    id="senha"
                    type="password"
                    required
                    value={senha}
                    onChange={(e) => setSenha(e.target.value)}
                    className="mt-1 border-login-ink/10 focus-visible:ring-login-accent"
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full bg-login-accent text-login-accent-foreground hover:bg-login-accent/90 transition duration-200 hover:-translate-y-0.5 hover:shadow-md"
                  disabled={loading}
                >
                  {loading ? "Entrando..." : "Entrar"}
                </Button>
              </form>

              <div className="flex justify-between text-sm">
                <Link to="/recuperar-senha" className="text-login-muted hover:text-login-accent transition">
                  Esqueci minha senha
                </Link>
                <Link to="/cadastro" className="text-login-muted hover:text-login-accent transition">
                  Cadastro de aluno
                </Link>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Coluna direita — painel escuro com padrão de caderno */}
      <section className="relative hidden lg:flex lg:w-1/2 bg-login-ink items-center justify-center p-12 overflow-hidden">
        {/* Padrão de linhas horizontais tipo papel pautado */}
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: "linear-gradient(to bottom, rgba(255,255,255,0.08) 1px, transparent 1px)",
            backgroundSize: "100% 2.5rem",
          }}
        />
        {/* Margem vermelha sutil de caderno */}
        <div
          className="absolute left-16 top-0 bottom-0 w-px bg-red-400/10"
        />

        <div className="relative max-w-md text-center">
          <p className="font-serif text-3xl leading-relaxed text-white/90 italic">
            "A crise hídrica nas grandes cidades nos faz repensar, a cada torneira aberta, o valor de uma gota que já não volta."
          </p>
          <p className="mt-6 text-sm text-white/50 tracking-wide">
            Exemplo de redação — tema de 2026
          </p>
        </div>
      </section>
    </div>
  );
}
