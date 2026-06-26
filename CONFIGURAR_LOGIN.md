# Configurar Login no Dashboard

## Passo 1: Ativar Firebase Authentication

1. Acesse o [Firebase Console](https://console.firebase.google.com/)
2. Selecione seu projeto `itapevi-fm`
3. No menu lateral, clique em **"Authentication"**
4. Clique em **"Get started"** ou **"Começar"**
5. Na aba **"Sign-in method"**, clique em **"Email/Password"**
6. Ative a opção **"Email/Password"**
7. Clique em **"Save"**

## Passo 2: Criar Usuário Administrador

1. Ainda na tela de Authentication, clique na aba **"Users"**
2. Clique em **"Add user"** ou **"Adicionar usuário"**
3. Preencha:
   - **Email**: `admin@itapevifm.com` (ou o email que preferir)
   - **Password**: `senha123` (ou uma senha forte)
4. Clique em **"Add user"**

## Passo 3: Atualizar Regras do Banco de Dados

1. No menu lateral, clique em **"Realtime Database"**
2. Clique na aba **"Rules"**
3. Substitua as regras por:

```json
{
  "rules": {
    ".read": true,
    ".write": "auth != null"
  }
}
```

Isso permite que qualquer pessoa leia os dados (site público), mas apenas usuários logados possam escrever (dashboard).

4. Clique em **"Publish"**

## Passo 4: Testar o Login

1. Acesse `https://itapevifm.vercel.app/dashboard.html`
2. Você verá a tela de login
3. Digite o email e senha que você criou
4. Após login, você terá acesso ao dashboard

## Passo 5: Fazer Upload para o Vercel

1. Atualize os arquivos `index.html` e `dashboard.html` no seu projeto
2. Faça upload para o Vercel

## Como Funciona

- **Site público** (`index.html`): Qualquer pessoa pode ver, sem login
- **Dashboard** (`dashboard.html`): Requer login para acessar
- Os dados são sincronizados em tempo real via Firebase

## Segurança

- As credenciais do Firebase estão no código JavaScript (visíveis no navegador)
- A segurança real está nas **regras do banco de dados**
- Apenas usuários autenticados podem escrever dados
- Para produção, considere adicionar regras mais restritivas

## Esqueci a Senha

Se você esquecer a senha do administrador:

1. Acesse o Firebase Console
2. Vá em Authentication → Users
3. Clique nos três pontinhos ao lado do usuário
4. Clique em **"Change password"**
5. Defina uma nova senha

## Adicionar Mais Administradores

Para adicionar mais pessoas com acesso ao dashboard:

1. Acesse Authentication → Users
2. Clique em **"Add user"**
3. Preencha email e senha
4. A pessoa poderá usar essas credenciais para fazer login

## Problemas Comuns

### "Email ou senha incorretos"
- Verifique se o usuário foi criado corretamente
- Confirme que o email está digitado corretamente
- Tente redefinir a senha

### "Permission denied" ao salvar dados
- Verifique as regras do Realtime Database
- Confirme que você está logado
- Verifique se o Firebase Authentication está ativado

### Tela de login não aparece
- Verifique se o código do dashboard está atualizado
- Confirme que as credenciais do Firebase estão corretas
- Abra o console do navegador (F12) para ver erros
