# Configurar Usuários (papéis) e Log de Atividade

Isso resolve o problema do "multi-user" original: antes, qualquer usuário logado tinha acesso total a tudo, sem distinção nem histórico. Agora existem dois papéis:

- **admin** — faz tudo, incluindo convidar/remover pessoas e trocar papéis.
- **editor** — edita programação, equipe e URL do stream, mas não vê a seção de usuários.

E toda alteração feita no dashboard fica registrada num histórico (quem fez o quê e quando).

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
-- só o backend com a service_role (PHP) pode alterar/criar/excluir.
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

O usuário que você já criou (Fase de login inicial) virou "editor" por padrão com o trigger acima. Torne-o admin:

```sql
update profiles set role = 'admin' where email = 'seuemail@exemplo.com';
```

*(troque pelo email que você usa para logar no dashboard)*

## Passo 3: Pegar a service_role key (⚠️ cuidado)

1. No Supabase: **Project Settings → API**.
2. Copie a chave **`service_role`** (é diferente da `anon public` que já está no `index.html`/`dashboard.html`).

⚠️ **Essa chave dá acesso total ao banco, ignorando toda a segurança (RLS).** Ela **nunca** pode ir para `index.html`, `dashboard.html` ou qualquer arquivo que o navegador carregue. Ela só pode existir dentro dos arquivos PHP, que ficam no servidor (HostGator) e nunca são exibidos como texto para quem visita o site — o navegador só recebe a resposta (JSON), nunca o código PHP.

## Passo 4: Configurar e subir os arquivos PHP

Na pasta `usuarios/` deste projeto (`_helpers.php`, `convidar.php`, `remover.php`, `definir_role.php`, `.htaccess`):

1. Abra `convidar.php`, `remover.php` e `definir_role.php` e preencha em cada um:
   ```php
   $SUPABASE_URL = 'https://SEU-PROJETO.supabase.co';
   $SUPABASE_ANON_KEY = 'SUA-ANON-KEY-AQUI';
   $SUPABASE_SERVICE_ROLE_KEY = 'SUA-SERVICE-ROLE-KEY-AQUI';
   ```
2. Suba a pasta `usuarios/` inteira (os 5 arquivos) para `public_html` na HostGator, do mesmo jeito que fez com a pasta `fotos/`.

## Passo 5: Apontar o dashboard para os endpoints

No `dashboard.html`, troque:

```js
const USUARIOS_CONVIDAR_URL = 'https://SEU-DOMINIO.com/usuarios/convidar.php';
const USUARIOS_REMOVER_URL = 'https://SEU-DOMINIO.com/usuarios/remover.php';
const USUARIOS_ROLE_URL = 'https://SEU-DOMINIO.com/usuarios/definir_role.php';
```

pelo seu domínio real.

## Passo 6: Testar

1. Logue no dashboard com o usuário que você tornou admin — deve aparecer a seção **"Usuários do Dashboard"** e **"Atividade Recente"**.
2. Convide um segundo email de teste — a pessoa recebe um link do Supabase para criar a senha.
3. Edite um programa ou membro da equipe e confira se a ação aparece no histórico.

## Sobre o envio de emails de convite

O Supabase envia esses emails usando um serviço próprio, limitado no plano gratuito (poucos emails por hora — suficiente para uma rádio pequena). Se os convites não chegarem, confira a pasta de spam ou, no Supabase, vá em **Authentication → Email Templates** para confirmar que o envio está ativo.

## Problemas comuns

### "Apenas administradores podem fazer isso"
Seu usuário está com papel `editor`. Rode o SQL do Passo 2 com o email correto.

### Convite não chega
Verifique o spam; no plano gratuito o envio de emails do Supabase tem limite de volume por hora.

### Erro 401 em qualquer ação de usuários
A `service_role key` colada nos PHP está errada ou incompleta — confira se copiou a chave inteira, sem espaços.
