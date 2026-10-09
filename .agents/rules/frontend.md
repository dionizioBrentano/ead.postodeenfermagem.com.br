---
name: frontend
trigger: always
---

# Frontend da Sala EAD — design, marcação, estilo e reaproveitamento

Sempre ligado. Vale para todo arquivo novo ou alterado em `src/`.

## Design: usar o que existe, não inventar

F-01 — O padrão visual é o que já existe em `src/styles.css` (variáveis em `:root`, "Padrão 60plus") e em `src/content/guia.css`. Não criar cor, fonte, tamanho de fonte, raio, sombra ou espaçamento novo. Usar sempre as variáveis `var(--...)` existentes.
F-02 — Antes de criar classe CSS ou componente visual, procurar o equivalente no inventário de `projeto/ead.md` e no próprio CSS. Existe: usar. Não existe: parar, registrar a dúvida no relatório e não inventar.
F-03 — Tela nova segue a estrutura das telas existentes (barra superior, `.page`, `.box`, `.btn`, `.field`, `.alert`).
F-04 — Funciona em celular com 360 px de largura, sem rolagem horizontal da página. Alvo de toque com no mínimo 44 px de altura.

## Marcação

F-05 — HTML semântico: `button` para ação, `a` para navegação, `label` ligado ao seu campo, títulos em ordem (`h1`, depois `h2`, depois `h3`), listas em `ul` ou `ol`, tabela só para dado tabular, com `th` e `scope`.
F-06 — Acessível: todo controle tem nome acessível; estado não nativo usa atributo `aria-*`; o foco visível já definido em `:focus-visible` não é removido; cor nunca é a única pista (certo, errado, administrado e não administrado também têm texto).

## Estilo

F-07 — Proibido `style={{...}}` e atributo `style` em código novo. Estilo vai em arquivo `.css`, com classe nomeada pelo que o elemento é (por exemplo `.cola-horario`), nunca pela aparência (por exemplo `.texto-vermelho`).
F-08 — O CSS de uma funcionalidade nova fica em arquivo próprio da funcionalidade, importado por ela, usando só as variáveis de `src/styles.css`. `src/styles.css` só recebe o que for global.
F-09 — Sem `!important` e sem seletor por id para estilo.

## Valores fixos

F-10 — Nada de valor fixo dentro de componente: textos de interface, listas de opções, horários, durações, tolerâncias, endereços e chaves vêm de arquivo de conteúdo ou configuração (`src/content/`, `src/data/`) ou da API. Endereço da API e identificador da organização só por `import.meta.env.VITE_*`.
F-11 — Número com significado tem nome (constante exportada). Nunca número solto no meio da lógica.

## Separação

F-12 — Componente em `src/components` só apresenta. Regra de negócio (cálculo de horários, conferência de gabarito, montagem de listas) fica em função pura em `src/lib`, sem React e sem chamada de rede, para poder ser testada sozinha. Chamada à API só em `src/api`. Página em `src/pages` só compõe.
F-13 — Tipos do contrato da API ficam em `src/api` e são importados; nunca redefinidos em cada componente. Sem `any` em código novo.
F-14 — Não misturar linguagens: sem HTML montado em texto, sem CSS escrito em JavaScript, sem `dangerouslySetInnerHTML` com conteúdo vindo de usuário ou de modelo de linguagem (SEG-04).

## Reaproveitamento

F-15 — Antes de escrever uma função ou componente, procurar se já existe em `src/lib`, `src/api` ou `src/components` (PRE-03). Existe: reaproveitar.
F-16 — Proibido copiar e colar rotina. Se a mesma lógica ou o mesmo bloco visual aparece em dois lugares, extrair para função em `src/lib` ou componente em `src/components` e usar nos dois. Neste repositório generaliza-se no segundo uso, não no terceiro (decisão em `decisoes/2026-10-09-reaproveitamento-e-estilo.md`).
F-17 — Código antigo que viola estas regras (por exemplo os `style={{...}}` que já existem) não é corrigido de passagem (EST-14.1, ESC-02). A parte nova nasce conforme; o desvio encontrado vai para o relatório. Corrigir o antigo exige prompt próprio.

## Dados

F-18 — Nenhum dado real de paciente, aluno ou profissional em código, teste, exemplo, imagem ou conteúdo. Prescrições de exercício são fictícias. As pastas `../prescricoes` e `../prescricoes-anonimizadas` ficam fora do repositório e nada delas é copiado para dentro sem pedido explícito.
