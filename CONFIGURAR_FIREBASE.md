# Configuração do Firebase para Itapevi FM

## O que é Firebase?

Firebase é uma plataforma do Google que oferece banco de dados em tempo real gratuito. Com ele, os dados adicionados no dashboard aparecem automaticamente no site para todos os dispositivos.

## Passo 1: Criar Projeto no Firebase

1. Acesse: https://console.firebase.google.com/
2. Faça login com sua conta Google
3. Clique em **"Adicionar projeto"** ou **"Add project"**
4. Nome do projeto: `itapevi-fm` (ou outro de sua preferência)
5. Aceite os termos e clique em **"Criar projeto"**
6. Aguarde a criação (cerca de 30 segundos)
7. Clique em **"Continuar"**

## Passo 2: Configurar Realtime Database

1. No menu lateral esquerdo, clique em **"Realtime Database"**
2. Clique em **"Criar banco de dados"** ou **"Create Database"**
3. Selecione a localização mais próxima (ex: `southamerica-east1` para Brasil)
4. Escolha **"Iniciar no modo de teste"** (podemos ajustar as regras depois)
5. Clique em **"Ativar"**

## Passo 3: Obter Credenciais

1. No menu lateral, clique em **"Configurações do projeto"** (ícone de engrenagem)
2. Role para baixo até encontrar **"Seus apps"**
3. Clique no ícone **</>** (Web) para adicionar um app web
4. Nome do app: `itapevi-fm-web`
5. **NÃO** marque a opção "Firebase Hosting"
6. Clique em **"Registrar app"**
7. Copie as credenciais que aparecerão. Elas terão este formato:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSy...",
  authDomain: "itapevi-fm.firebaseapp.com",
  databaseURL: "https://itapevi-fm-default-rtdb.firebaseio.com",
  projectId: "itapevi-fm",
  storageBucket: "itapevi-fm.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc123..."
};
```

## Passo 4: Atualizar o Código

1. Abra o arquivo `index.html` no editor de texto
2. Localize a seção `firebaseConfig` (por volta da linha 750)
3. Substitua os valores com suas credenciais reais:

```javascript
const firebaseConfig = {
  apiKey: "SUA_API_KEY_AQUI",
  authDomain: "itapevi-fm.firebaseapp.com",
  databaseURL: "https://itapevi-fm-default-rtdb.firebaseio.com",
  projectId: "itapevi-fm",
  storageBucket: "itapevi-fm.appspot.com",
  messagingSenderId: "SEU_MESSAGING_SENDER_ID",
  appId: "SEU_APP_ID"
};
```

4. Salve o arquivo

## Passo 5: Atualizar o Dashboard

Faça o mesmo processo no arquivo `dashboard.html`:

1. Abra `dashboard.html`
2. Localize a seção `firebaseConfig`
3. Substitua com as **mesmas credenciais** do index.html
4. Salve o arquivo

## Passo 6: Fazer Upload para o Vercel

1. Crie uma pasta com os 3 arquivos:
   - `index.html`
   - `dashboard.html`
   - `logo.jpg`

2. Acesse https://vercel.com/
3. Arraste a pasta para o Vercel
4. Aguarde o deploy

## Como Funciona Agora

### Adicionar Dados (Dashboard)

1. Acesse: `https://itapevifm.vercel.app/dashboard.html`
2. Clique em **"+ Adicionar Programa"** ou **"+ Adicionar Membro"**
3. Preencha os dados e clique em **"Salvar"**
4. Os dados são salvos no Firebase automaticamente

### Visualizar Dados (Site Principal)

1. Acesse: `https://itapevifm.vercel.app/`
2. Os dados aparecem automaticamente, sincronizados em tempo real
3. Funciona em qualquer dispositivo (celular, tablet, desktop)
4. Atualiza automaticamente quando você adiciona algo no dashboard

### Exemplo de Uso

**No dashboard (desktop):**
- Adiciona programa "Prosa de Galpão" de Seg a Sex, 06:00-08:30
- Adiciona locutor "João Silva"

**No site (mobile):**
- Abre a aba "Programação"
- Clica em "Seg"
- Vê "Prosa de Galpão" automaticamente
- Aba "Equipe" mostra "João Silva"

## Estrutura dos Dados no Firebase

O Firebase armazena os dados nesta estrutura:

```
itapevi-fm/
├── equipe/
│   ├── membro1/
│   │   ├── id: "membro1"
│   │   ├── nome: "João Silva"
│   │   ├── funcao: "Apresentador"
│   │   ├── iniciais: "JS"
│   │   ├── cor: "linear-gradient(...)"
│   │   └── foto: ""
│   └── membro2/
│       └── ...
└── programas/
    ├── prog1/
    │   ├── prog: "Prosa de Galpão"
    │   ├── apres: "João Silva"
    │   ├── das: "06:00"
    │   ├── ate: "08:30"
    │   └── dias: ["Seg","Ter","Qua","Qui","Sex"]
    └── prog2/
        └── ...
```

## Limites do Firebase Gratuito

O plano gratuito do Firebase (Spark) inclui:
- 1 GB de armazenamento
- 10 GB de transferência por mês
- 100 conexões simultâneas
- Suficiente para uma rádio com uso normal

## Solução de Problemas

### Dados não aparecem no site

1. Verifique se as credenciais estão corretas em ambos os arquivos
2. Abra o console do navegador (F12) e veja se há erros
3. Verifique se o Realtime Database está ativado
4. Confirme que as regras do banco permitem leitura/escrita

### Erro de permissão

Se aparecer erro de permissão, vá em:
1. Firebase Console → Realtime Database → Regras
2. Substitua por:

```json
{
  "rules": {
    ".read": true,
    ".write": true
  }
}
```

3. Clique em **"Publicar"**

**Nota:** Isso permite que qualquer pessoa leia e escreva. Para produção, você pode adicionar autenticação depois.

## Próximos Passos

Após configurar o Firebase:
1. Teste adicionando dados no dashboard
2. Verifique se aparecem no site principal
3. Teste em outro dispositivo (celular)
4. Se tudo funcionar, faça upload para o Vercel

## Suporte

Se tiver problemas:
- Verifique o console do navegador (F12) para erros
- Confirme que as credenciais estão corretas
- Teste em modo anônimo para evitar cache
