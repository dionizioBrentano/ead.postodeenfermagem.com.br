# ead.postodeenfermagem.com.br

Sala EAD do Curso Técnico em Enfermagem. É uma página única (SPA, aplicação de página única) feita com React 19, Vite e TypeScript.

- **Entrada** (`/`): o aluno faz cadastro ou login usando a API do Posto de Enfermagem.
- **Sala** (`/sala`): só abre com um token de usuário válido da organização. Tem três abas:
  - **Guia do estágio**: conteúdo estático deste repositório (`src/content/guia.html`).
  - **Autoavaliação**: o aluno informa a etapa (1 a 4) e o momento (início, meio ou final), dá nota de 0 a 10 aos 11 aspectos gerais e às 22 atividades da ficha, e baixa o PDF.
  - **Minha evolução**: quadro colorido com todas as autoavaliações, do vermelho (nota 0) ao verde escuro (nota 10).

O progresso **não é enviado à API**. As autoavaliações ficam guardadas só no navegador do aluno (`localStorage`), separadas por usuário, e o registro permanente é o PDF que ele baixa.

## Variáveis de ambiente

Crie um arquivo `.env` na raiz, a partir do `.env.example`. **Nunca envie o `.env` ao GitHub.**

| Variável | O que é |
|---|---|
| `VITE_API_URL` | Endereço da API: `https://api.postodeenfermagem.com.br/api/v1` |
| `VITE_TENANT_ID` | Identificador (UUID) da organização EAD na API |
| `VITE_CLIENT_ID` | Identificador do aplicativo cadastrado na API |
| `VITE_CLIENT_SECRET` | Segredo do aplicativo |

> **Atenção:** toda variável que começa com `VITE_` é gravada dentro do JavaScript gerado no build. Quem abrir o site consegue ler o `VITE_CLIENT_SECRET` nas ferramentas do navegador. Use um aplicativo cujo token só permita cadastro e login nesta organização. Se isso não for aceitável, o token do aplicativo precisa ser obtido por um intermediário no servidor, e não no navegador.

## Chamadas à API

Todas enviam `Accept: application/json` e, quando têm corpo, `Content-Type: application/json`.

**1. Token do aplicativo** (feito ao abrir o site e guardado só em memória)

```
POST /auth/application/token
{ "client_id": "...", "client_secret": "..." }
```

**2. Cadastro**

```
POST /auth/register
Authorization: Bearer <token do aplicativo>
X-Tenant-ID: <VITE_TENANT_ID>

{ "name", "email", "password", "password_confirmation",
  "phone" (só dígitos), "cpf" (só dígitos), "user_type": "patient" }
```

**3. Login**

```
POST /auth/login
Authorization: Bearer <token do aplicativo>
X-Tenant-ID: <VITE_TENANT_ID>

{ "login": "e-mail, CPF ou telefone", "password": "..." }
```

- 401: mostra "Credenciais inválidas." e não diz se o e-mail existe.
- 403 `organization_mismatch`: mostra "Esta conta não pertence a esta organização."
- 200 (e 201 no cadastro): grava o `access_token` do usuário.

**4. Guarda da sala**

```
GET /user
Authorization: Bearer <token do usuário>
X-Tenant-ID: <VITE_TENANT_ID>
```

Um 401 apaga o token e volta para a entrada. O botão **Sair** apaga o token do usuário.

Este frontend não chama nenhuma outra rota, nem rotas clínicas. Também não tem recuperação de senha nem verificação em duas etapas.

## Build e publicação

O servidor (cPanel) não precisa de Node.js. O build é feito na sua máquina:

```
npm install
npm run build
```

Envie **o conteúdo da pasta `dist/`** para a pasta do subdomínio `ead.postodeenfermagem.com.br`. O build também cria `dist/sala/index.html`, e por isso o endereço `/sala` abre direto, sem precisar de `.htaccess`.

Para testar na sua máquina: `npm run dev`.

## O que a API precisa permitir

O navegador chama a API a partir de outro endereço. Por isso, a API precisa liberar CORS (compartilhamento de recursos entre origens diferentes) para a origem `https://ead.postodeenfermagem.com.br`, aceitando os cabeçalhos `Authorization`, `X-Tenant-ID`, `Content-Type` e `Accept`.

## Estrutura

```
src/api/client.ts            chamadas à API e sessão
src/pages/AuthPage.tsx       cadastro e login
src/pages/SalaPage.tsx       sala protegida (abas)
src/components/Guia.tsx      guia do estágio
src/components/Autoavaliacao.tsx
src/components/Evolucao.tsx  quadro de cores
src/lib/pdf.ts               geração do PDF (jsPDF)
src/lib/historico.ts         histórico no navegador, por aluno
src/data/itens.ts            itens da ficha de avaliação
src/content/guia.html        texto do guia
```
