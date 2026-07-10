# Itapevi FM

Landing page institucional com dashboard administrativo (programação e equipe), sincronizados em tempo real via Firebase Realtime Database.

## Estrutura

- `index.html` — site público (programação, equipe, player)
- `dashboard.html` — painel administrativo (protegido por login)
- `logo.jpg` — logo da rádio
- `CONFIGURAR_FIREBASE.md` — passo a passo para configurar o banco de dados
- `CONFIGURAR_LOGIN.md` — passo a passo para configurar o login do dashboard

## ✅ Checklist de segurança antes de publicar

Isso é o que realmente protege o dashboard — sem isso, o login na tela é só visual:

1. **Firebase Authentication** → ative o método "Email/Password" e crie o usuário administrador.
2. **Realtime Database → Rules** → publique exatamente:
   ```json
   {
     "rules": {
       ".read": true,
       ".write": "auth != null"
     }
   }
   ```
   Isso vale para todo o banco, incluindo `config/streamUrl` (URL do stream, agora gerenciada só pelo dashboard).
   Sem isso, qualquer pessoa pode escrever no banco direto pela API, mesmo sem passar pela tela de login.
3. **Restringir a API Key do Firebase** (recomendado): no [Google Cloud Console](https://console.cloud.google.com/apis/credentials), selecione a chave do projeto `itapevi-fm` e adicione uma restrição de **HTTP referrer** com o domínio final do site (ex: `https://itapevifm.vercel.app/*`). Isso impede que a chave (que fica visível no código-fonte) seja reaproveitada em outro site.
4. Use uma senha forte para o usuário administrador (não a senha de exemplo dos guias).

## Deploy

Projeto estático, sem build. Pode subir direto:

- **GitHub** → conecte o repositório à [Vercel](https://vercel.com/) (import automático) ou
- **Vercel** → arraste a pasta do projeto direto no painel.

## Como funciona

- Os dados de programação e equipe ficam no Firebase Realtime Database.
- O `dashboard.html` exige login (Firebase Auth) para escrever dados, incluindo a URL do stream (`config/streamUrl`) — não é mais editável no site público.
- O `index.html` lê os dados publicamente e atualiza em tempo real.
