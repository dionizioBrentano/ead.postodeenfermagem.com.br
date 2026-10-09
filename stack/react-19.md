# stack/react-19.md — Sala EAD

Não contradizer AGENTS.md.

## Travado no produto

- React 19
- TypeScript, com as opções de `tsconfig.json` do repositório
- Vite
- Sem regra de negócio de organização, vínculo ou identidade no componente visual (EST-15)

## Ferramentas

- Empacotador: Vite. `npm run build` executa `tsc -b && vite build && node scripts/rota-sala.mjs`.
- Verificação de tipos: `tsc -b`, dentro do `npm run build`.
- Formatador: nenhum configurado. Não acrescentar sem autorização (DEP-04).
- Testes: Vitest 5.0.3, só no desenvolvimento. `npm test` roda todos os testes uma vez. O arquivo de teste fica ao lado do código testado, com o nome `<arquivo>.test.ts`. Lógica nova vai em `src/lib` como função pura e nasce com teste (TST-01). A opção `--passWithNoTests` existe só para o projeto sem nenhum teste; nunca use atalho para esconder teste quebrado.
- Comando de desenvolvimento: `npm run dev`.
- Publicação: o envio ao ramo principal dispara `.github/workflows/deploy.yml` e publica o site.

## Pastas

- `src/pages` — telas por rota; só compõem.
- `src/components` — apresentação.
- `src/api` — cliente HTTP da API e tipos do contrato.
- `src/lib` — funções puras de regra (sem React, sem rede).
- `src/data` — listas e itens fixos de conteúdo.
- `src/content` — textos e páginas de conteúdo, e o CSS do guia.
- `src/auth` — volta do login central.

## Armadilhas

- `VITE_*` é público. Identificador público pode; segredo nunca (SEG-01).
- Esconder botão não é autorização (SEG-05).
- Não fundir contas no frontend. Identidade se resolve na API.
- Arrastar e soltar nativo do navegador não funciona em tela de toque.
