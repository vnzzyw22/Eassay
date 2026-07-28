import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Brand } from "@/lib/brand";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Eassay — Gestão de redações escolares" },
      {
        name: "description",
        content:
          "Plataforma para professores gerenciarem redações escolares e alunos entregarem suas produções textuais.",
      },
      { property: "og:title", content: "Eassay — Gestão de redações escolares" },
      {
        property: "og:description",
        content: "Plataforma para professores gerenciarem redações escolares e alunos entregarem suas produções textuais.",
      },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Brand />
          <nav className="flex gap-2">
            <Link to="/auth">
              <Button variant="ghost">Entrar</Button>
            </Link>
            <Link to="/cadastro">
              <Button>Sou aluno</Button>
            </Link>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-6 py-24 text-center">
        <h2 className="font-display text-5xl leading-tight">Redações da turma, organizadas em um só lugar.</h2>
        <p className="mt-6 text-lg text-muted-foreground">
          A Prof. Fernanda publica as propostas — como "A crise hídrica nas grandes cidades" para o 3º A — e os alunos escrevem, entregam e recebem a correção pela plataforma.
        </p>
        <div className="mt-8 flex justify-center gap-3">
          <Link to="/auth">
            <Button size="lg">Entrar na minha conta</Button>
          </Link>
          <Link to="/cadastro">
            <Button size="lg" variant="outline">
              Sou aluno e quero me cadastrar
            </Button>
          </Link>
        </div>
      </main>
    </div>
  );
}
