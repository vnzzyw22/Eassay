ALTER TABLE public.entregas ADD COLUMN IF NOT EXISTS devolvida_em timestamptz;

CREATE OR REPLACE FUNCTION public.proteger_devolucao()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF public.has_role(auth.uid(), 'admin') OR auth.uid() IS NULL THEN
    RETURN NEW;
  END IF;
  IF TG_OP = 'INSERT' THEN
    NEW.devolvida_em := NULL;
  ELSIF NEW.devolvida_em IS NOT NULL AND NEW.devolvida_em IS DISTINCT FROM OLD.devolvida_em THEN
    RAISE EXCEPTION 'Somente a professora pode devolver redações';
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_proteger_devolucao ON public.entregas;
CREATE TRIGGER trg_proteger_devolucao BEFORE INSERT OR UPDATE ON public.entregas
FOR EACH ROW EXECUTE FUNCTION public.proteger_devolucao();

DROP POLICY IF EXISTS entregas_aluno_update ON public.entregas;
CREATE POLICY entregas_aluno_update ON public.entregas FOR UPDATE TO authenticated
USING (aluno_id = auth.uid() AND status <> 'corrigida'::entrega_status AND (
  devolvida_em IS NOT NULL OR EXISTS (SELECT 1 FROM public.atividades a WHERE a.id = entregas.atividade_id AND a.prazo > now())
))
WITH CHECK (aluno_id = auth.uid() AND status <> 'corrigida'::entrega_status);