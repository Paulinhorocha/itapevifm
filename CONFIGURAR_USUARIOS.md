# Configurar Usuários (papéis) e Log de Atividade

Isso resolve o problema do "multi-user" original: antes, qualquer usuário logado tinha acesso total a tudo, sem distinção nem histórico. Agora existem dois papéis:

- **admin** — faz tudo, incluindo convidar/remover pessoas e trocar papéis.
- **editor** — edita programação, equipe e URL do stream, mas não vê a seção de usuários.

E toda alteração feita no dashboard fica registrada num histórico (quem fez o quê e quando).

As ações de admin (convidar, remover, trocar papel) rodam em **Vercel Functions** (pasta `api/usuarios/`) — pequenos scripts que ficam no mesmo domínio do site, sem precisar de outra hospedagem, sem CORS pra configurar. Eles usam a `service_role key` do Supabase, guardada como variável de ambiente na Vercel — nunca aparece no código que o navegador carrega.

## Passo 1: Criar as tabelas no Supabase

No **SQL Editor** do Supabase, execute:

```sql
-- Perfil de cada usuário (criado automaticamente quando alguém se cadastra)
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  role text not null default 'editor' check (role in ('admin','editor')),
  created_at timestamptz default now()
);

alter table profiles enable row level security;

-- Qualquer usuário logado pode VER a lista (para aparecer no painel);
-- só a Vercel Function (com a service_role) pode alterar/criar/excluir.
create policy "leitura autenticada profiles" on profiles
  for select using (auth.role() = 'authenticated');

-- Cria o perfil automaticamente (papel padrão: editor) quando um usuário é criado
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, role)
  values (new.id, new.email, 'editor');
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Histórico de atividade
create table if not exists activity_log (
  id bigint generated always as identity primary key,
  user_email text,
  acao text not null,
  created_at timestamptz default now()
);

alter table activity_log enable row level security;
create policy "leitura autenticada log" on activity_log for select using (auth.role() = 'authenticated');
create policy "insercao autenticada log" on activity_log for insert with check (auth.role() = 'authenticated');

alter publication supabase_realtime add table profiles;
```

## Passo 2: Tornar seu usuário admin

O usuário que você já criou virou "editor" por padrão com o trigger acima. Torne-o admin:

```sql
update profiles set role = 'admin' where email = 'seuemail@exemplo.com';
```

*(troque pelo email que você usa para logar no dashboard)*

## Passo 3: Colocar o projeto no GitHub

Se o projeto ainda não está num repositório:

1. Crie um repositório novo em [github.com/new](https://github.com/new) (pode ser privado).
2. Na pasta do projeto, no terminal:
   ```bash
   git init
   git add .
   git commit -m "Site Itapevi FM"
   git branch -M main
   git remote add origin https://github.com/SEU-USUARIO/itapevi-fm.git
   git push -u origin main
   ```

Se já existe um repositório, só suba estes arquivos novos (`git add . && git commit -m "Gestão de usuários via Vercel" && git push`).

## Passo 4: Conectar o repositório na Vercel

1. Em [vercel.com](https://vercel.com) → **"Add New" → "Project"**.
2. Selecione o repositório do GitHub (`itapevi-fm`) → **Import**.
3. Framework Preset: deixe **"Other"** (é um site estático com Vercel Functions, sem build). Clique em **Deploy**.

A partir daqui, **todo `git push` na branch `main` publica automaticamente** — não precisa mais subir arquivo manualmente em lugar nenhum.

## Passo 5: Configurar as variáveis de ambiente na Vercel

1. No projeto, vá em **Settings → Environment Variables**.
2. Adicione:
   | Nome | Valor |
   |---|---|
   | `SUPABASE_URL` | `https://hfswzuptkerizyrrrlgn.supabase.co` |
   | `SUPABASE_SERVICE_ROLE_KEY` | (pegue em Supabase → Project Settings → API → **service_role**) |
3. Clique em **Save**. Depois, vá na aba **Deployments**, abra os "..." do último deploy e clique **Redeploy** (as variáveis só entram em vigor depois de um novo deploy).

⚠️ A `service_role key` dá acesso total ao banco, ignorando toda a segurança (RLS). Por isso ela só existe como variável de ambiente na Vercel (lida pelo código que roda no servidor, em `api/usuarios/*.js`) — nunca aparece em `index.html`, `dashboard.html` ou qualquer arquivo enviado ao navegador.

## Passo 6: Testar

1. Acesse seu site publicado (ex: `https://itapevifm.vercel.app` ou seu domínio próprio).
2. Logue no dashboard com o usuário que você tornou admin — deve aparecer a seção **"Usuários do Dashboard"** e **"Atividade Recente"**.
3. Convide um segundo email de teste — a pessoa recebe um link do Supabase para criar a senha.
4. Edite um programa ou membro da equipe e confira se a ação aparece no histórico.

## Testando localmente (opcional)

Um `python -m http.server` simples não executa as Vercel Functions (`api/`) — elas precisam do runtime da própria Vercel. Para testar tudo, incluindo a gestão de usuários, localmente:

```bash
npm install -g vercel
vercel dev
```

Na primeira vez ele pede pra linkar com o projeto da Vercel (login) e vai pedir as mesmas variáveis de ambiente do Passo 5 (ou você `vercel env pull` para baixá-las automaticamente para um arquivo `.env.local`).

## Sobre o envio de emails de convite

O Supabase envia esses emails usando um serviço próprio, limitado no plano gratuito (poucos emails por hora — suficiente para uma rádio pequena). Se os convites não chegarem, confira a pasta de spam ou, no Supabase, vá em **Authentication → Email Templates** para confirmar que o envio está ativo.

## Problemas comuns

### "Apenas administradores podem fazer isso"
Seu usuário está com papel `editor`. Rode o SQL do Passo 2 com o email correto.

### Erro 500 ao convidar/remover/trocar papel
As variáveis de ambiente não foram configuradas na Vercel, ou o deploy não foi refeito depois de configurá-las (Passo 5).

### Convite não chega
Verifique o spam; no plano gratuito o envio de emails do Supabase tem limite de volume por hora.

### Funciona no site publicado mas não localmente
Esperado, se você abriu os arquivos direto ou com um servidor simples — veja "Testando localmente" acima.
