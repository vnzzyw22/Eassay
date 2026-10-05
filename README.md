# Remix Eassay - 2.0

Eassay — Prompt para o Lovable (PARTE 1 de 2)

Cole este texto primeiro. Depois que o Lovable terminar de gerar e você conferir que funcionou, cole a Parte 2 na sequência da mesma conversa.

PROMPT — PARTE 1

Crie uma aplicação web completa chamada Eassay, um sistema para a professora Fernanda gerenciar redações escolares. Não é um produto multi-empresa: existe apenas UMA professora administradora e várias turmas de alunos abaixo dela. Use Supabase para autenticação e banco de dados.

Nesta primeira etapa, foque na estrutura funcional: autenticação, banco de dados e painel da professora. O visual pode ser simples e neutro por enquanto — vamos refinar a identidade visual completa na próxima etapa.

Estrutura de dados

Tabelas: usuarios (com campo role podendo ser admin ou aluno), salas (com nome e código de acesso único), alunos_salas (vínculo aluno-sala), atividades (título, descrição, anexo, prazo, contagem mínima/máxima de palavras), atividades_salas (vínculo atividade-sala, permitindo publicar uma atividade pra várias salas ao mesmo tempo), entregas (com status: rascunho, entregue, fora do prazo, corrigida), notas, comentarios, arquivos.

Configure Row Level Security no Supabase para que:

Um aluno só veja atividades e entregas da própria sala

Um aluno nunca veja entregas de outros alunos

Um aluno só edite a própria entrega, e apenas antes do prazo

Apenas o admin tenha acesso total (criar salas, atividades, ver e corrigir todas as entregas)

Autenticação e papéis

Não existe cadastro público de administrador em nenhum lugar do site. A única tela de cadastro visível publicamente é a de aluno.

A tela de login é única. Após autenticar, o sistema verifica o role do usuário: se admin, redireciona para o painel da professora; se aluno, redireciona para a área do aluno.

A conta de administrador (Fernanda) será criada manualmente depois, direto no Supabase Authentication, e promovida a admin via SQL. Deixe isso documentado nos comentários do código/schema, algo como:

sql

update usuarios set role = 'admin' where email = 'EMAIL_DA_FERNANDA';

Inclua recuperação de senha por email (fluxo padrão do Supabase Auth: "esqueci minha senha" → email com link de redefinição), disponível tanto para admin quanto para aluno.

Cadastro do aluno

Tela de cadastro com: nome completo, email, senha, e código da sala (ex: "3A2026"). Ao informar o código correto, o aluno é vinculado automaticamente à turma correspondente. Se o código for inválido, mostrar erro claro antes de permitir o cadastro.

Painel da professora (admin)

Dashboard inicial com cards de métrica no topo (total de alunos, total de salas, atividades abertas, entregas pendentes) e lista das últimas entregas recebidas.

Menu lateral com: Dashboard, Salas, Alunos, Atividades, Correções, Notas, Configurações.

Salas:

Lista de salas em cards (nome, número de alunos, data de criação, código de acesso da sala)

Criar/editar/excluir sala (ao criar, gerar automaticamente um código único de acesso)

Dentro de uma sala: lista de alunos vinculados, opção de remover aluno, atalho para criar atividade e ver entregas daquela sala

Atividades:

Criar atividade com: título, descrição/enunciado, anexo (PDF, Word ou imagem), prazo de entrega (data e hora), contagem mínima e máxima de palavras, seleção de quais salas recebem a atividade

Botão para publicar (a atividade só fica visível aos alunos depois de publicada)

Listagem com status (aberta, encerrada) e prazo

Correção:

Ao abrir uma entrega: nome do aluno, sala, data/hora de envio, o texto ou arquivo enviado (com opção de visualizar e baixar), campo de nota e campo de comentário, botão salvar

Depois de corrigida, o status da entrega muda para "corrigida" e o aluno passa a ver a nota e o comentário

O que ficou de fora (por escolha do cliente)

Não incluir nesta versão, mesmo que pareça óbvio: login com Google, notificações automáticas por email a cada correção, correção por rubricas/critérios, ranking de entregas, exportação de notas para Excel, geração de PDF das correções, dashboard com gráficos de desempenh

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://eassay.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/c4415791-f4c0-4b84-a5bc-099ba9bc5d04).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
