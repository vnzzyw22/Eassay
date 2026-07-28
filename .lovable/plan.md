# Eassay — Parte 1: Estrutura funcional

Sistema de gestão de redações com uma admin (professora Fernanda) e alunos organizados em salas. Visual neutro nesta etapa; identidade visual vem na Parte 2.

## 1. Ativar Lovable Cloud

Habilitar backend (Supabase) para autenticação, banco e storage de anexos.

## 2. Schema do banco

Migração SQL criando:

- **enum `app_role`**: `admin`, `aluno`
- **enum `entrega_status`**: `rascunho`, `entregue`, `fora_prazo`, `corrigida`
- **`profiles`**: `id` (FK auth.users), `nome_completo`, `email`, `created_at`
- **`user_roles`**: `id`, `user_id`, `role` (tabela separada por segurança)
- **`salas`**: `id`, `nome`, `codigo` (único), `created_at`
- **`alunos_salas`**: `aluno_id`, `sala_id` (PK composta)
- **`atividades`**: `id`, `titulo`, `descricao`, `anexo_url`, `prazo`, `min_palavras`, `max_palavras`, `publicada`, `created_at`
- **`atividades_salas`**: `atividade_id`, `sala_id` (PK composta)
- **`entregas`**: `id`, `atividade_id`, `aluno_id`, `texto`, `arquivo_url`, `status`, `nota`, `comentario`, `submitted_at`, `corrected_at`
- **função security definer `has_role(uuid, app_role)`** para evitar recursão em RLS
- **trigger** para auto-criar `profiles` no signup
- **bucket storage** `atividades` (anexos) e `entregas` (arquivos de aluno)

**Promoção manual do admin** documentada em comentário SQL:
```sql
-- update user_roles set role='admin' where user_id=(select id from auth.users where email='EMAIL_DA_FERNANDA');
```

## 3. RLS

- Aluno vê apenas atividades publicadas vinculadas à sua sala
- Aluno vê apenas a própria entrega; edita apenas antes do prazo e se status ≠ corrigida
- Admin (via `has_role`) tem acesso total a tudo
- Grants explícitos ao role `authenticated` em cada tabela do schema public

## 4. Rotas (TanStack Router)

- `/` — landing simples com CTAs "Entrar" e "Sou aluno, quero me cadastrar"
- `/auth` — login único (detecta role e redireciona)
- `/cadastro` — cadastro exclusivo de aluno (nome, email, senha, código da sala)
- `/recuperar-senha` — envia email de reset
- `/reset-password` — define nova senha (público, lê hash `type=recovery`)
- `/_authenticated/redirect` — decide destino conforme role
- **Admin** (`/_authenticated/admin/*`): `dashboard`, `salas`, `salas/$id`, `alunos`, `atividades`, `atividades/nova`, `correcoes`, `correcoes/$entregaId`, `notas`, `configuracoes`
- **Aluno** (`/_authenticated/aluno/*`): `dashboard`, `atividades`, `atividades/$id` (visualizar + entregar), `entregas`

## 5. Painel da professora

- **Dashboard**: cards (total alunos, total salas, atividades abertas, entregas pendentes) + lista últimas entregas
- **Sidebar** shadcn com os 7 itens do menu
- **Salas**: grid de cards, CRUD, código gerado automaticamente; página de sala mostra alunos vinculados + atalhos
- **Atividades**: form (título, descrição, upload anexo, prazo datetime, min/max palavras, multi-select de salas), botão publicar, listagem com status derivado do prazo
- **Correção**: abrir entrega → dados do aluno + conteúdo + campos nota/comentário → salvar muda status para `corrigida`

## 6. Fora do escopo (explícito)

Não implementar: Google OAuth, emails automáticos de correção, rubricas, ranking, export Excel, PDF de correção, gráficos.

## Detalhes técnicos

- Cadastro de aluno: valida código da sala via server function pública que apenas confirma existência (não expõe lista); após signup, insere em `alunos_salas` e cria role `aluno` em `user_roles` (via trigger ou server fn com service role)
- Email/password auth (sem Google conforme pedido)
- Recuperação de senha: `resetPasswordForEmail` com redirect para `/reset-password`
- Uploads via Supabase Storage; RLS de storage por bucket
- Server fns protegidas com `requireSupabaseAuth`; verificação de admin via `has_role` RPC
- Visual: shadcn defaults, sem custom design tokens agressivos (fica pra Parte 2)
