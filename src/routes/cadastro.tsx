import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { matricularAluno } from "@/lib/matricula.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

export const Route = createFileRoute("/cadastro")({
  head: () => ({ meta: [{ title: "Cadastro de aluno — Eassay" }] }),
  component: CadastroPage,
});

function CadastroPage() {
  const [nome, setNome] = useState("");
  const [numeroChamada, setNumeroChamada] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [codigo, setCodigo] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const matricular = useServerFn(matricularAluno);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      // 1. valida código da sala (via rota pública)
      const res = await fetch("/api/public/valida-codigo-sala", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ codigo }),
      });
      const info = await res.json();
      if (!info.ok) {
        toast.error("Código da sala inválido.");
        setLoading(false);
        return;
      }

      // 2. cria conta
      const { data, error } = await supabase.auth.signUp({
        email,
        password: senha,
        options: {
          emailRedirectTo: `${window.location.origin}/auth`,
          data: { nome_completo: nome },
        },
      });
      if (error) {
        toast.error(error.message);
        setLoading(false);
        return;
      }

      // guarda o código para concluir a matrícula no primeiro login,
      // caso a conta precise de confirmação de email
      localStorage.setItem("eassay_codigo_sala", codigo.trim().toUpperCase());

      if (!data.session) {
        toast.success("Cadastro realizado! Confirme seu email e depois faça login.");
        setLoading(false);
        navigate({ to: "/auth" });
        return;
      }

      // 3. vincula aluno à sala (perfil + papel + vínculo), no servidor
      try {
        await matricular({ data: { codigo: codigo.trim().toUpperCase() } });
        localStorage.removeItem("eassay_codigo_sala");
      } catch (err: any) {
        toast.error(
          "Conta criada, mas não foi possível vincular você à sala: " +
            (err?.message ?? "erro desconhecido") +
            ". Entre em contato com a professora.",
        );
        setLoading(false);
        return;
      }

      toast.success("Cadastro concluído!");
      navigate({ to: "/aluno/dashboard" });
    } catch (err) {
      toast.error("Erro inesperado no cadastro.");
      setLoading(false);
    }
  };


  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-8">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Cadastro de aluno</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <Label htmlFor="nome">Nome completo</Label>
              <Input id="nome" required value={nome} onChange={(e) => setNome(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="senha">Senha</Label>
              <Input id="senha" type="password" required minLength={6} value={senha} onChange={(e) => setSenha(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="codigo">Código da sala</Label>
              <Input id="codigo" required placeholder="Ex: 3A2026" value={codigo} onChange={(e) => setCodigo(e.target.value.toUpperCase())} />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Criando conta..." : "Cadastrar"}
            </Button>
          </form>
          <div className="mt-4 text-center text-sm">
            <Link to="/auth" className="text-muted-foreground hover:underline">
              Já tenho conta
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
