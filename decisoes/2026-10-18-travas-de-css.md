# 2026-10-18 — Travas de CSS no teste, no build e na publicação

## Contexto

Em 18/10/2026 a regra `.evolucao-legenda` ficou sem `}` no commit 02443ca. O CSS compilado passou a ter os tokens dentro de `.evolucao-legenda :root`, e a Sala EAD ficou sem estilo no ar. Nenhum teste nem o build reprovaram.

## Decisão

1. `npm test` roda primeiro `scripts/travas-css.mjs`, que reprova chaves desbalanceadas em qualquer `.css` de `src` e `var(--nome)` sem definição em algum `.css` de `src`.
2. `npm run build` termina com `scripts/confere-css-compilado.mjs`, que reprova `:root` dentro de outro seletor no CSS compilado.
3. A publicação automática (`.github/workflows/deploy.yml`) roda `npm test` antes do build. Se qualquer trava reprovar, nada é publicado.
4. Nenhuma trava é desligada ou afrouxada para um envio passar. Quem muda é o código.

## Decidido por

Dionizio Brentano, responsável pelo produto.

## Consequências

Um erro desse tipo para no computador, antes do envio, ou na publicação, antes do FTP. Não chega mais ao site.
