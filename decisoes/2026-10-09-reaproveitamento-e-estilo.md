# 2026-10-09 — Reaproveitamento no segundo uso, estilo só em CSS e design só com o que existe

## Contexto

O frontend da Sala EAD não tinha regras próprias. O código existente tem estilo escrito dentro dos componentes (`style={{...}}`) e rotinas repetidas. A regra geral EST-10 manda generalizar só na terceira repetição.

## Decisão

1. Neste repositório, generaliza-se no segundo uso conhecido (F-16). Isto substitui EST-10 aqui.
2. Estilo só em arquivo CSS, com as variáveis já existentes (F-01, F-07, F-08).
3. Nenhum elemento visual novo sem antes procurar o equivalente no inventário de `projeto/ead.md` (F-02).
4. O código antigo não é corrigido de passagem; correção só com prompt próprio (F-17).

## Decidido por

Dionizio Brentano, responsável pelo produto.

## Consequências

Código novo sai mais curto e uniforme. As violações antigas continuam até um prompt de correção.
