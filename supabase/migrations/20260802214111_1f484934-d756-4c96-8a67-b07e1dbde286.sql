CREATE OR REPLACE FUNCTION public.ranking_geral()
RETURNS TABLE(aluno_id uuid, nome_completo text, salas text, media numeric, total_corrigidas bigint)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.id,
         p.nome_completo,
         COALESCE((
           SELECT string_agg(s.nome, ', ' ORDER BY s.nome)
           FROM public.alunos_salas als
           JOIN public.salas s ON s.id = als.sala_id
           WHERE als.aluno_id = p.id
         ), ''),
         ROUND(AVG(e.nota)::numeric, 2),
         COUNT(e.id)
  FROM public.profiles p
  JOIN public.entregas e ON e.aluno_id = p.id AND e.status = 'corrigida' AND e.nota IS NOT NULL
  GROUP BY p.id, p.nome_completo
  ORDER BY 4 DESC, 2 ASC
$$;

REVOKE ALL ON FUNCTION public.ranking_geral() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.ranking_geral() TO authenticated;