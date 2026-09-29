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
        <div className="mx-auto grid max-w-6xl grid-cols-[minmax(0,1fr)_auto] items-center gap-2 px-4 py-3 sm:flex sm:justify-between sm:px-6 sm:py-4">
          <div className="min-w-0">
            <Brand />
          </div>
          <nav className="flex shrink-0 gap-1 sm:gap-2" aria-label="Acessos principais">
            <Link to="/auth" className="shrink-0">
              <Button variant="ghost" className="px-3 sm:px-4">Entrar</Button>
            </Link>
            <Link to="/cadastro" className="shrink-0">
              <Button className="px-3 sm:px-4">Sou aluno</Button>
            </Link>
          </nav>
        </div>
      </header>
      <main className="mx-auto flex max-w-3xl flex-col items-center px-4 py-14 text-center sm:px-6 sm:py-24">
        <h1 className="font-display max-w-2xl text-4xl leading-tight sm:text-5xl">
          Redações da turma, organizadas em um só lugar.
        </h1>
        <p className="mt-5 max-w-2xl text-base leading-relaxed text-muted-foreground sm:mt-6 sm:text-lg">
          A professora publica as propostas, e os alunos escrevem, entregam e recebem as correções pela plataforma.
        </p>
        <div className="mt-8 flex w-full max-w-sm flex-col gap-3 sm:max-w-none sm:flex-row sm:justify-center">
          <Link to="/auth" className="w-full sm:w-auto">
            <Button size="lg" className="w-full sm:w-auto">Entrar na minha conta</Button>
          </Link>
          <Link to="/cadastro" className="w-full sm:w-auto">
            <Button size="lg" variant="outline" className="h-auto min-h-12 w-full whitespace-normal px-5 py-3 text-center leading-snug sm:w-auto sm:whitespace-nowrap">
              Sou aluno e quero me cadastrar
            </Button>
          </Link>
        </div>
      </main>
    </div>
  );
}
