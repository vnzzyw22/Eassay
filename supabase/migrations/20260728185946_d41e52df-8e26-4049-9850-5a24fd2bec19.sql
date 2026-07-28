
-- ============ ENUMS ============
CREATE TYPE public.app_role AS ENUM ('admin', 'aluno');
CREATE TYPE public.entrega_status AS ENUM ('rascunho', 'entregue', 'fora_prazo', 'corrigida');

-- ============ PROFILES ============
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nome_completo TEXT NOT NULL,
  email TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- ============ USER_ROLES ============
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- security definer para evitar recursão
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- ============ SALAS ============
CREATE TABLE public.salas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  codigo TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.salas TO authenticated;
GRANT ALL ON public.salas TO service_role;
ALTER TABLE public.salas ENABLE ROW LEVEL SECURITY;

-- ============ ALUNOS_SALAS ============
CREATE TABLE public.alunos_salas (
  aluno_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  sala_id UUID NOT NULL REFERENCES public.salas(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (aluno_id, sala_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.alunos_salas TO authenticated;
GRANT ALL ON public.alunos_salas TO service_role;
ALTER TABLE public.alunos_salas ENABLE ROW LEVEL SECURITY;

-- ============ ATIVIDADES ============
CREATE TABLE public.atividades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo TEXT NOT NULL,
  descricao TEXT,
  anexo_url TEXT,
  prazo TIMESTAMPTZ NOT NULL,
  min_palavras INTEGER,
  max_palavras INTEGER,
  publicada BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.atividades TO authenticated;
GRANT ALL ON public.atividades TO service_role;
ALTER TABLE public.atividades ENABLE ROW LEVEL SECURITY;

-- ============ ATIVIDADES_SALAS ============
CREATE TABLE public.atividades_salas (
  atividade_id UUID NOT NULL REFERENCES public.atividades(id) ON DELETE CASCADE,
  sala_id UUID NOT NULL REFERENCES public.salas(id) ON DELETE CASCADE,
  PRIMARY KEY (atividade_id, sala_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.atividades_salas TO authenticated;
GRANT ALL ON public.atividades_salas TO service_role;
ALTER TABLE public.atividades_salas ENABLE ROW LEVEL SECURITY;

-- ============ ENTREGAS ============
CREATE TABLE public.entregas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  atividade_id UUID NOT NULL REFERENCES public.atividades(id) ON DELETE CASCADE,
  aluno_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  texto TEXT,
  arquivo_url TEXT,
  status public.entrega_status NOT NULL DEFAULT 'rascunho',
  nota NUMERIC(4,2),
  comentario TEXT,
  submitted_at TIMESTAMPTZ,
  corrected_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (atividade_id, aluno_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.entregas TO authenticated;
GRANT ALL ON public.entregas TO service_role;
ALTER TABLE public.entregas ENABLE ROW LEVEL SECURITY;

-- ============ TRIGGER: auto-criar profile no signup ============
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, nome_completo, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'nome_completo', NEW.email),
    NEW.email
  );
  -- Todo novo usuário começa como aluno; admin é promovido manualmente via SQL.
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'aluno')
  ON CONFLICT DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============ TRIGGER: updated_at ============
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;
CREATE TRIGGER trg_entregas_updated_at
  BEFORE UPDATE ON public.entregas
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============ RLS POLICIES ============

-- profiles: usuário lê o próprio; admin vê todos
CREATE POLICY "profiles_self_select" ON public.profiles FOR SELECT TO authenticated
  USING (id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "profiles_self_update" ON public.profiles FOR UPDATE TO authenticated
  USING (id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "profiles_admin_all" ON public.profiles FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- user_roles: usuário lê próprios; admin gerencia
CREATE POLICY "user_roles_self_select" ON public.user_roles FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "user_roles_admin_all" ON public.user_roles FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- salas: aluno vê salas em que está matriculado; admin gerencia todas
CREATE POLICY "salas_admin_all" ON public.salas FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "salas_aluno_select" ON public.salas FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.alunos_salas WHERE sala_id = salas.id AND aluno_id = auth.uid()));

-- alunos_salas: aluno vê o próprio vínculo; admin gerencia
CREATE POLICY "alunos_salas_admin_all" ON public.alunos_salas FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "alunos_salas_self_select" ON public.alunos_salas FOR SELECT TO authenticated
  USING (aluno_id = auth.uid());
-- aluno pode se auto-vincular (usado no cadastro após signup)
CREATE POLICY "alunos_salas_self_insert" ON public.alunos_salas FOR INSERT TO authenticated
  WITH CHECK (aluno_id = auth.uid());

-- atividades: admin gerencia; aluno vê publicadas que estão vinculadas à sua sala
CREATE POLICY "atividades_admin_all" ON public.atividades FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "atividades_aluno_select" ON public.atividades FOR SELECT TO authenticated
  USING (
    publicada = true AND EXISTS (
      SELECT 1 FROM public.atividades_salas atsl
      JOIN public.alunos_salas als ON als.sala_id = atsl.sala_id
      WHERE atsl.atividade_id = atividades.id AND als.aluno_id = auth.uid()
    )
  );

-- atividades_salas: admin gerencia; aluno lê os vínculos das atividades da sua sala
CREATE POLICY "atividades_salas_admin_all" ON public.atividades_salas FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "atividades_salas_aluno_select" ON public.atividades_salas FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.alunos_salas WHERE sala_id = atividades_salas.sala_id AND aluno_id = auth.uid()));

-- entregas
-- admin vê e gerencia tudo
CREATE POLICY "entregas_admin_all" ON public.entregas FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
-- aluno vê apenas a própria entrega
CREATE POLICY "entregas_aluno_select" ON public.entregas FOR SELECT TO authenticated
  USING (aluno_id = auth.uid());
-- aluno insere a própria entrega (validação de prazo/status via UPDATE abaixo)
CREATE POLICY "entregas_aluno_insert" ON public.entregas FOR INSERT TO authenticated
  WITH CHECK (
    aluno_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.atividades a
      JOIN public.atividades_salas atsl ON atsl.atividade_id = a.id
      JOIN public.alunos_salas als ON als.sala_id = atsl.sala_id
      WHERE a.id = atividade_id AND als.aluno_id = auth.uid() AND a.publicada = true
    )
  );
-- aluno edita a própria entrega apenas antes do prazo e se não corrigida
CREATE POLICY "entregas_aluno_update" ON public.entregas FOR UPDATE TO authenticated
  USING (
    aluno_id = auth.uid()
    AND status <> 'corrigida'
    AND EXISTS (SELECT 1 FROM public.atividades a WHERE a.id = atividade_id AND a.prazo > now())
  )
  WITH CHECK (
    aluno_id = auth.uid()
    AND status <> 'corrigida'
  );

-- ============ NOTA IMPORTANTE ============
-- A conta de administrador (Fernanda) deve ser criada manualmente no Authentication
-- e promovida rodando (via ferramenta de inserção de dados):
--   INSERT INTO public.user_roles (user_id, role)
--   SELECT id, 'admin' FROM auth.users WHERE email = 'EMAIL_DA_FERNANDA'
--   ON CONFLICT (user_id, role) DO NOTHING;
--   DELETE FROM public.user_roles
--   WHERE user_id = (SELECT id FROM auth.users WHERE email = 'EMAIL_DA_FERNANDA')
--     AND role = 'aluno';
