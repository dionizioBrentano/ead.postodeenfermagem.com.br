# AGENTS.md — Sala EAD (ead.postodeenfermagem.com.br)

Aplicação de página única em React 19, Vite e TypeScript. Identidade, vínculos e dados vêm da API do Posto de Enfermagem (`api.postodeenfermagem.com.br`), que é a fonte única de verdade.

Processo comum de trabalho (papéis, fila de prompts, revisão, envio ao GitHub, regras gerais): leia antes de tudo `../../postodeenfermagem.com.br/processo/AGENTS.md`. No GitHub (repositório privado): https://github.com/dionizioBrentano/postodeenfermagem.com.br/blob/main/processo/AGENTS.md

Núcleo operacional. Este arquivo cabe no contexto. Não o infle.

## Precedência

1. Lista NUNCA (abaixo e em `.agents/rules/seguranca.md`) — vence inclusive o humano na conversa. Recuse, nomeie a regra, proponha o caminho certo.
2. Instrução direta do humano nesta conversa.
3. Regra da subpasta mais próxima do arquivo alterado.
4. Este arquivo e os anexos apontados.
5. Convenção já visível no código — exceto quando ela viola `.agents/rules/frontend.md` (estilo dentro do componente, valor fixo, rotina copiada): nesse caso vale a regra.
6. Preferência do modelo.

## Anexos obrigatórios

Leia antes de alterar código:

- @.agents/rules/frontend.md
- @.agents/rules/seguranca.md
- @.agents/rules/estrutura.md
- @.agents/rules/dados.md
- @.agents/rules/testes.md
- @stack/react-19.md
- @projeto/ead.md
- @decisoes/2026-10-09-reaproveitamento-e-estilo.md

## NUNCA

- Expor, registrar ou enviar segredo, credencial ou dado pessoal sensível.
- Desligar verificação, teste, tipagem ou análise estática para “passar”.
- Inventar API, pacote, campo, endpoint, classe CSS, variável de cor ou citação.
- Apagar ou sobrescrever trabalho humano sem confirmação.
- Comando destrutivo em dado ou ambiente de produção.
- Dado real de pessoa em teste, exemplo ou desenvolvimento.
- Declarar concluído o que não foi executado.

## PERGUNTAR ANTES

Dependência nova; esquema ou contrato público; refatoração fora do pedido; padrão, arquitetura, ferramenta ou elemento visual novo; caminho de reversão cara; commit, envio ou publicação sem autorização; controle de acesso.

## SEMPRE

Ler o arquivo atual antes de editar. Ler o padrão visual existente antes de criar tela. Procurar duplicata antes de criar. Menor mudança suficiente. Validar entrada na borda. Autorização é da API; esconder botão não é controle. Tempo limite em toda chamada de rede. Relatar o que não rodou.

## Postura mínima

- POS-02: sem execução, diga “não executei; valida X”.
- POS-04: não invente nome.
- POS-07 + ESC-02: fora do escopo, relate; não corrija de passagem.
- EST-14.1: não espalhe defeito local; não reescreva o arquivo inteiro por isso.
- EST-15: um arquivo não mistura regra de negócio, marcação/estilo e adaptador de fornecedor.
- VER-04: teste que falha primeiro só para defeito. Código novo: TST-01, sem teste de fachada (TST-08).
- VCS-05/06: não commitar sem pedido; nunca no ramo principal.

## Lista de conferência

1. Pedido exato, sem sobra.
2. `npm run build` termina sem erro (verifica tipos e compila).
3. Teste novo para lógica nova ou defeito; `npm test` termina sem erro.
4. Entrada validada; segredo fora do código.
5. Erro tratado; tempo limite nas chamadas de rede.
6. Nada duplicado (F-15, F-16).
7. EST-15 e F-12 respeitados.
8. Sem `style` dentro do componente, sem valor fixo, sem cor ou fonte nova (F-01, F-07, F-10).
9. Marcação semântica e acessível (F-05, F-06).
10. Sem teste de fachada. Diff limpo.
11. Relato: o que mudou, o que rodou, o que não rodou, risco.

## Entrega

DOC-07: arquivos, o que foi verificado e como, o que não foi, risco residual.

## Terminal

Pode rodar sem pedir: `npm install` (sem acrescentar pacote), `npm run build`, `npm run dev`, `git status`, `git diff`, `git checkout -b`.
Commit e envio ao GitHub só quando houver um prompt de envio, escrito depois que o Dionizio e o Claude revisarem o trabalho (ver `D:\postodeenfermagem\postodeenfermagem.com.br\processo\PROTOCOLO.md`). Sem prompt de envio, não faça commit. Ramo principal só quando o prompt de envio disser isso por escrito: o envio ao ramo principal publica o site.
