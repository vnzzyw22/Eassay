CREATE OR REPLACE FUNCTION public.ranking_minha_sala()
RETURNS TABLE (aluno_id uuid, nome_completo text, sala_id uuid, sala_nome text, media numeric, total_corrigidas bigint)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.id, p.nome_completo, s.id, s.nome, ROUND(AVG(e.nota)::numeric, 2), COUNT(e.id)
  FROM public.alunos_salas als
  JOIN public.salas s ON s.id = als.sala_id
  JOIN public.profiles p ON p.id = als.aluno_id
  JOIN public.entregas e ON e.aluno_id = als.aluno_id AND e.status = 'corrigida' AND e.nota IS NOT NULL
  WHERE als.sala_id IN (SELECT sala_id FROM public.alunos_salas WHERE aluno_id = auth.uid())
  GROUP BY p.id, p.nome_completo, s.id, s.nome
  ORDER BY 5 DESC, 2 ASC
$$;

GRANT EXECUTE ON FUNCTION public.ranking_minha_sala() TO authenticated;