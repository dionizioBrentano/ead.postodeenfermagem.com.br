# ead.postodeenfermagem.com.br

Sala EAD do Curso Técnico em Enfermagem. É uma aplicação de página única (SPA) feita com React 19, Vite e TypeScript, estruturada de acordo com os papéis do usuário.

A identidade e os vínculos vêm da API do Posto de Enfermagem. O acesso ao EAD é concedido com base nos vínculos (`memberships`) da pessoa com a organização, separados por três papéis: **aluno**, **docente** e **administrador**.

## Rotas Principales

- `/` — Entrada (login e cadastro unificados).
- `/participar` — Tela para o usuário escolher seu papel ("Sou aluno" ou "Sou docente") ao entrar pela primeira vez.
- `/aguardando` — Tela de bloqueio para docentes recém-cadastrados até aprovação da escola.
- `/sala` — Área do **Aluno**: acesso ao guia do estágio, sua autoavaliação (preenchimento) e histórico de avaliações, bem como o paralelo de notas.
- `/supervisao` — Área do **Docente**: tela para avaliar e acompanhar os alunos. (Requer aprovação e Verificação em Duas Etapas).
- `/administracao` — Área do **Administrador**: gestão de convites, aprovação de docentes, revogação de acessos, e atribuição de permissões a outros administradores. (Requer Verificação em Duas Etapas).
- `/convite?token=` — Tela pública para visualização e aceite de convites de participação (aluno, docente ou administrador).
- `/verificacao` — Tela de MFA (Verificação em Duas Etapas), onde docentes e administradores ativam ou confirmam acesso.

## Variáveis de ambiente

Crie um arquivo `.env` na raiz, a partir do `.env.example`. **Nunca envie o `.env` ao GitHub.**

| Variável | O que é |
|---|---|
| `VITE_API_URL` | Endereço base da API (já inclui `/api/v1`) |
| `VITE_TENANT_ID` | Identificador (UUID) da organização EAD na API |

> **Atenção:** Todas as requisições API enviam os cabeçalhos `X-Tenant-ID` e `Authorization: Bearer <token>`, aceitando respostas e retornos estritos das permissões e vínculos mapeados (`GET /me/memberships`).

## Histórico e EAD (Fonte Única de Verdade)

As autoavaliações são gravadas na API (`POST /ead/avaliacoes`), que atua como **fonte única de verdade**. 
O navegador do aluno (`localStorage`) guarda apenas o rascunho em andamento para não perder dados acidentalmente.
As notas são recuperadas por etapa e agrupadas pela interface do EAD. O PDF continua existindo como um registro que o aluno pode gerar, baixar e guardar localmente.

## Build e publicação

O servidor (cPanel ou similar) não precisa de Node.js. O build é gerado localmente ou no servidor de CI/CD:

```bash
npm install
npm run build
```

O script pós-build irá copiar automaticamente o `index.html` para pastas filhas com os nomes das rotas principais (`/sala/index.html`, `/supervisao/index.html`, `/convite/index.html`, etc.). Dessa forma, elas abrem de maneira transparente e sem a necessidade de reescritas no servidor (sem requerer `.htaccess`).

Para testar localmente:
```bash
npm run dev
```
