# Configurar Fotos dos Locutores (HostGator)

As fotos dos locutores ficam guardadas na sua hospedagem HostGator (não no Supabase). O upload é feito pelo dashboard, através de dois pequenos scripts PHP que ficam junto com o site.

## Como funciona

- `fotos/upload.php` — recebe a foto enviada pelo dashboard, confirma que quem enviou está logado (valida o token do Supabase) e salva o arquivo em `fotos/`.
- `fotos/delete.php` — mesma checagem de login; apaga uma foto antiga quando ela é substituída ou o locutor é excluído.
- `fotos/.htaccess` — impede que a pasta liste arquivos ou execute outros scripts além desses dois.

O `dashboard.html` chama esses dois endereços; o `index.html` não precisa de nenhuma mudança — ele só exibe a URL da foto que já está salva no banco.

## Passo 1: Subir os arquivos

1. No cPanel da HostGator, abra o **Gerenciador de Arquivos** e entre em `public_html` (ou na subpasta do seu domínio).
2. Crie/envie a pasta `fotos` com os três arquivos: `upload.php`, `delete.php` e `.htaccess`.
3. Confirme que a pasta e os arquivos ficaram com permissão **755** (pastas) / **644** (arquivos) — o próprio Gerenciador de Arquivos já costuma aplicar isso.

## Passo 2: Preencher as credenciais nos dois PHP

Abra `fotos/upload.php` e `fotos/delete.php` e troque, em cada um:

```php
$SUPABASE_URL = 'https://SEU-PROJETO.supabase.co';
$SUPABASE_ANON_KEY = 'SUA-ANON-KEY-AQUI';
```

Use os mesmos valores já configurados no `index.html`/`dashboard.html` (Supabase → Project Settings → API).

## Passo 3: Apontar o dashboard para o seu domínio

No `dashboard.html`, troque:

```js
const FOTOS_UPLOAD_URL = 'https://SEU-DOMINIO.com/fotos/upload.php';
const FOTOS_DELETE_URL = 'https://SEU-DOMINIO.com/fotos/delete.php';
```

pelo domínio real onde a pasta `fotos/` ficou hospedada.

## Passo 4 (recomendado): restringir o CORS

Por padrão os dois PHP aceitam chamadas de qualquer origem (`Access-Control-Allow-Origin: *`), para facilitar o primeiro teste. Depois que tudo estiver funcionando, edite essa linha nos dois arquivos para liberar só o domínio do seu site:

```php
header('Access-Control-Allow-Origin: https://itapevifm.vercel.app');
```

## Passo 5: Testar

1. Acesse o dashboard, edite um locutor e envie uma foto.
2. Se aparecer "Foto enviada!", está funcionando — confira se o arquivo apareceu dentro da pasta `fotos/` no Gerenciador de Arquivos.
3. Salve o locutor e confira se a foto aparece no site público.

## Segurança — por que é seguro apesar de ser hospedagem compartilhada

- Os dois scripts **só aceitam o envio/exclusão de arquivos se o token do Supabase enviado pertencer a um usuário logado** — sem login válido, o servidor responde "não autorizado" e não salva nada.
- O upload confere se o conteúdo do arquivo é realmente uma imagem (não confia na extensão do nome), e o nome salvo no servidor é sempre gerado ali mesmo — nunca o nome que veio do navegador.
- O `.htaccess` bloqueia a execução de qualquer script diferente de `upload.php`/`delete.php` dentro da pasta `fotos/`, então mesmo que alguém conseguisse enviar um arquivo `.php` disfarçado, ele não rodaria.

## Problemas comuns

### "Sessão inválida ou expirada"
O token do Supabase expirou ou o cURL do PHP não conseguiu acessar a internet (raro na HostGator, mas alguns planos bloqueiam saída para certos domínios — se persistir, abra um chamado com o suporte da HostGator pedindo para liberar saída HTTPS para `*.supabase.co`).

### Erro de CORS no console do navegador
Confirme que `FOTOS_UPLOAD_URL`/`FOTOS_DELETE_URL` no dashboard e o `Access-Control-Allow-Origin` nos PHP apontam para os domínios corretos.

### Foto enviada mas não aparece no site
Confira se a URL salva (campo `foto` do locutor, visível no Supabase → Table Editor → equipe) realmente abre a imagem no navegador. Se der 404, confira se o arquivo está mesmo dentro de `public_html/fotos/`.
