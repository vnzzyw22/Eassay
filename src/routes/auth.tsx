import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Brand } from "@/lib/brand";
import { toast } from "sonner";

export const Route = createFileRoute("/auth")({
  head: () => ({ meta: [{ title: "Entrar — Eassay" }] }),
  component: AuthPage,
});

function AuthPage() {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

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
    navigate({ to: isAdmin ? "/admin/dashboard" : "/aluno/dashboard" });
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="card-surface w-full max-w-md p-8">
        <div className="mb-6 flex flex-col items-start gap-3">
          <Brand />
          <h2 className="font-display text-2xl">Entrar na sua conta</h2>
        </div>
        <div>
          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="senha">Senha</Label>
              <Input id="senha" type="password" required value={senha} onChange={(e) => setSenha(e.target.value)} />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Entrando..." : "Entrar"}
            </Button>
          </form>
          <div className="mt-4 flex justify-between text-sm">
            <Link to="/recuperar-senha" className="text-muted-foreground hover:underline">
              Esqueci minha senha
            </Link>
            <Link to="/cadastro" className="text-muted-foreground hover:underline">
              Cadastro de aluno
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
