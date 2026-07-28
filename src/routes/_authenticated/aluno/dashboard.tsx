import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/aluno/dashboard")({
  beforeLoad: () => {
    throw redirect({ to: "/aluno/atividades" });
  },
});
