ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS numero_chamada integer;
ALTER TABLE public.entregas ADD COLUMN IF NOT EXISTS marcacoes jsonb NOT NULL DEFAULT '[]'::jsonb;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (id, nome_completo, email, numero_chamada)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'nome_completo', NEW.email),
    NEW.email,
    NULLIF(NEW.raw_user_meta_data->>'numero_chamada','')::int
  )
  ON CONFLICT (id) DO NOTHING;
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'aluno')
  ON CONFLICT DO NOTHING;
  RETURN NEW;
END;
$function$;