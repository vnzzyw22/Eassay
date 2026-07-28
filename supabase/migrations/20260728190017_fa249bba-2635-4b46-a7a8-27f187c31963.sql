
-- Fix search_path on set_updated_at
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

-- Restringe execução das funções SECURITY DEFINER
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.set_updated_at() FROM PUBLIC, anon, authenticated;

-- has_role precisa ser callable por authenticated (usado nas policies)
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;

-- ================ STORAGE RLS ================
-- Bucket 'atividades': admin faz upload; qualquer autenticado da sala pode ler
CREATE POLICY "atividades_admin_upload" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'atividades' AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "atividades_admin_update" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'atividades' AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "atividades_admin_delete" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'atividades' AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "atividades_authed_read" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'atividades');

-- Bucket 'entregas': aluno gerencia próprios arquivos (pasta = auth.uid()); admin lê todos
CREATE POLICY "entregas_self_insert" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'entregas' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "entregas_self_update" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'entregas' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "entregas_self_select" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'entregas' AND ((storage.foldername(name))[1] = auth.uid()::text OR public.has_role(auth.uid(), 'admin')));
CREATE POLICY "entregas_self_delete" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'entregas' AND (storage.foldername(name))[1] = auth.uid()::text);
