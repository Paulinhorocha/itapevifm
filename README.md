# Itapevi FM

Landing page institucional com dashboard administrativo (programação, equipe e fotos), sincronizados em tempo real via Supabase (Postgres + Auth + Storage), com gestão de usuários via Vercel Functions.

## Estrutura

- `index.html` — site público (programação, equipe, player)
- `dashboard.html` — painel administrativo (protegido por login)
- `logo.jpg` — logo da rádio
- `api/usuarios/` — Vercel Functions (convidar/remover/definir papel de usuários) — precisam de variáveis de ambiente, veja `CONFIGURAR_USUARIOS.md`
- `CONFIGURAR_SUPABASE.md` — passo a passo: banco de dados, login e fotos (Storage)
- `CONFIGURAR_USUARIOS.md` — passo a passo: papéis (admin/editor), log de atividade e deploy via GitHub + Vercel

## ✅ Checklist de segurança antes de publicar

Isso é o que realmente protege o dashboard — sem isso, o login na tela é só visual:

1. Rodar o script SQL do `CONFIGURAR_SUPABASE.md` (cria as tabelas com Row Level Security: leitura pública, escrita só para usuários autenticados).
2. Criar o bucket `locutores` no Storage como **público**, com as políticas do mesmo guia.
3. Criar o(s) usuário(s) administrador(es) em Authentication → Users, com senha forte.
4. Colar a **Project URL** e a **anon key** do Supabase no topo do script de `index.html` e `dashboard.html` (já preenchidas neste pacote).
5. Configurar `SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY` como variáveis de ambiente na Vercel (`CONFIGURAR_USUARIOS.md`, Passo 5) — sem isso, convidar/remover/promover usuários não funciona.

## Deploy (GitHub → Vercel, automático)

1. Suba o projeto para um repositório no GitHub.
2. Importe o repositório na Vercel (Framework Preset: **Other**).
3. Configure as variáveis de ambiente (Passo 5 do `CONFIGURAR_USUARIOS.md`).
4. A partir daí, todo `git push` na branch `main` publica automaticamente.

## Como funciona

- Programação, equipe, fotos dos locutores e configuração do stream ficam no Supabase (Postgres + Storage).
- O `dashboard.html` exige login (Supabase Auth) para escrever dados e enviar fotos — nada disso é editável no site público.
- O `index.html` lê os dados publicamente e atualiza em tempo real via Supabase Realtime.
- A gestão de usuários (convidar/remover/promover) roda em `api/usuarios/*.js`, como Vercel Functions no mesmo domínio do site — usam a `service_role key` do Supabase, que só existe como variável de ambiente na Vercel e nunca é exposta ao navegador.
