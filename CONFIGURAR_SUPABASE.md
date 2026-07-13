# Configurar Supabase (banco, login e fotos)

Este projeto migrou do Firebase para o [Supabase](https://supabase.com) — plano gratuito, **sem necessidade de cartão de crédito**, com banco Postgres, autenticação e storage de arquivos inclusos.

## Passo 1: Criar o projeto

1. Acesse [supabase.com](https://supabase.com) e crie uma conta (pode usar GitHub).
2. Clique em **"New project"**, escolha um nome (ex: `itapevi-fm`) e uma senha para o banco (guarde-a, mas ela não é usada no código).
3. Aguarde ~2 minutos até o projeto ficar pronto.

## Passo 2: Criar as tabelas (banco de dados)

1. No menu lateral, clique em **"SQL Editor"** → **"New query"**.
2. Cole e execute o script abaixo (cria as tabelas, ativa segurança por linha e permite tempo real):

```sql
-- Tabelas
create table if not exists equipe (
  id text primary key,
  nome text not null,
  funcao text,
  iniciais text,
  foto text,
  cor text,
  created_at timestamptz default now()
);

create table if not exists programas (
  id text primary key,
  prog text not null,
  apres text,
  das text,
  ate text,
  dias text[] not null default '{}',
  created_at timestamptz default now()
);

create table if not exists config (
  key text primary key,
  value text
);

insert into config (key, value) values
  ('streamUrl', 'https://casthttps1.suaradionanet.net/10076/stream')
  on conflict (key) do nothing;

-- Segurança (RLS): leitura pública, escrita só para quem estiver logado
alter table equipe enable row level security;
alter table programas enable row level security;
alter table config enable row level security;

create policy "leitura publica equipe" on equipe for select using (true);
create policy "escrita autenticada equipe" on equipe for all
  using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

create policy "leitura publica programas" on programas for select using (true);
create policy "escrita autenticada programas" on programas for all
  using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

create policy "leitura publica config" on config for select using (true);
create policy "escrita autenticada config" on config for all
  using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

-- Tempo real (o site público atualiza sozinho quando o dashboard salva algo)
alter publication supabase_realtime add table equipe;
alter publication supabase_realtime add table programas;
alter publication supabase_realtime add table config;
```

3. Clique em **"Run"**. Deve aparecer "Success".

## Passo 3: Ativar login (Authentication)

1. Menu lateral → **"Authentication"** → **"Providers"** → confirme que **Email** está habilitado (vem ativado por padrão).
2. Em **"Authentication" → "Users"**, clique **"Add user"** → **"Create new user"**, preencha email e senha do administrador, marque **"Auto Confirm User"** e salve.
3. Para adicionar outros administradores depois, repita esse passo — cada um usa seu próprio email/senha para logar no `dashboard.html`.
4. Em **"Authentication" → "URL Configuration"**, adicione a URL do seu site (ex: `https://itapevifm.vercel.app`) em **Site URL** — necessário para o link de "esqueci minha senha" funcionar.

## Passo 4: Criar o bucket de fotos (Storage)

1. Menu lateral → **"Storage"** → **"New bucket"**.
2. Nome: `locutores`. Marque **"Public bucket"** (a foto precisa ser visível no site público). Criar.
3. Vá em **"SQL Editor"** e execute:

```sql
create policy "leitura publica fotos locutores"
on storage.objects for select
using (bucket_id = 'locutores');

create policy "upload autenticado fotos locutores"
on storage.objects for insert
with check (bucket_id = 'locutores' and auth.role() = 'authenticated');

create policy "update autenticado fotos locutores"
on storage.objects for update
using (bucket_id = 'locutores' and auth.role() = 'authenticated');

create policy "delete autenticado fotos locutores"
on storage.objects for delete
using (bucket_id = 'locutores' and auth.role() = 'authenticated');
```

## Passo 5: Pegar a URL e a chave do projeto

1. Menu lateral → **"Project Settings"** (ícone de engrenagem) → **"API"**.
2. Copie **"Project URL"** e a chave **"anon public"**.
3. Cole os dois valores em **`index.html`** e em **`dashboard.html`**, no topo do script, substituindo:

```js
const SUPABASE_URL = 'https://SEU-PROJETO.supabase.co';
const SUPABASE_ANON_KEY = 'SUA-ANON-KEY-AQUI';
```

⚠️ A `anon key` é pública por design (fica visível no navegador) — a segurança real está nas políticas (RLS) criadas no Passo 2 e 4, assim como acontecia com as regras do Firebase.

## Passo 6: Testar

1. Suba os arquivos atualizados no Vercel.
2. Acesse `/dashboard.html`, faça login com o usuário criado no Passo 3.
3. Cadastre um programa e um locutor (com foto) e confira se aparecem no `index.html` em tempo real.

## Atenção: pausa por inatividade

Projetos gratuitos do Supabase pausam automaticamente após **7 dias sem nenhum acesso ao banco**. Como o site público consulta o banco a cada visita, isso raramente deve acontecer — mas se o site ficar muito tempo sem visitas, pode ser necessário reativar o projeto manualmente no painel do Supabase.

## Problemas comuns

### "new row violates row-level security policy"
As políticas (RLS) não foram criadas ou o usuário não está logado. Refaça o Passo 2/4 e confirme o login no dashboard.

### Fotos não aparecem
Confirme que o bucket `locutores` foi criado como **público** (Passo 4) e que a política de leitura pública foi criada.

### "Invalid API key"
Confira se copiou a chave **anon public** (não a `service_role`, que nunca deve ir para o front-end) e se não sobrou espaço em branco ao colar.

---

Quer diferenciar administradores de editores, ver quem alterou o quê, ou gerenciar quem tem acesso ao dashboard? Veja `CONFIGURAR_USUARIOS.md`.
