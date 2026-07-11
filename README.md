# Itapevi FM

Landing page institucional com dashboard administrativo (programação, equipe e fotos), sincronizados em tempo real via Supabase (Postgres + Auth + Storage).

## Estrutura

- `index.html` — site público (programação, equipe, player)
- `dashboard.html` — painel administrativo (protegido por login)
- `logo.jpg` — logo da rádio
- `CONFIGURAR_SUPABASE.md` — passo a passo: banco de dados e login
- `CONFIGURAR_USUARIOS.md` — passo a passo: papéis (admin/editor) e log de atividade
- `CONFIGURAR_FOTOS_HOSTGATOR.md` — passo a passo: upload das fotos dos locutores na HostGator
- `fotos/` — scripts PHP (upload/exclusão de fotos) para subir na HostGator
- `usuarios/` — scripts PHP (convite/remoção/papel de usuários) para subir na HostGator

## ✅ Checklist de segurança antes de publicar

Isso é o que realmente protege o dashboard — sem isso, o login na tela é só visual:

1. Rodar o script SQL do `CONFIGURAR_SUPABASE.md` (cria as tabelas com Row Level Security: leitura pública, escrita só para usuários autenticados).
2. Criar o bucket `locutores` no Storage como **público**, com as políticas do mesmo guia.
3. Criar o(s) usuário(s) administrador(es) em Authentication → Users, com senha forte.
4. Colar a **Project URL** e a **anon key** do Supabase no topo do script de `index.html` e `dashboard.html`.

## Deploy

Projeto estático, sem build. Pode subir direto:

- **GitHub** → conecte o repositório à [Vercel](https://vercel.com/) (import automático) ou
- **Vercel** → arraste a pasta do projeto direto no painel.

## Como funciona

- Programação, equipe e configuração do stream ficam no Supabase (Postgres).
- As fotos dos locutores ficam guardadas na hospedagem HostGator, enviadas via `fotos/upload.php` (protegido por login do Supabase).
- O `dashboard.html` exige login (Supabase Auth) para escrever dados e enviar fotos — nada disso é editável no site público.
- O `index.html` lê os dados publicamente e atualiza em tempo real via Supabase Realtime.
