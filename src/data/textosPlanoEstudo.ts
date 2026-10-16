/**
 * Textos fixos para a seção "Precisa de atenção", plano de estudo sugerido e próximo ciclo.
 * Regra F-10: nenhum texto de interface fica dentro de componente.
 */

export const TEXTOS_PLANO_ESTUDO = {
  descricaoAtencao:
    "Itens abaixo da sua média geral ou abaixo de 7 na sua autoavaliação mais recente, na ordem dos ciclos.",
  tituloProximoCiclo: "Prepare-se para o próximo ciclo",
  botaoSugerirPlano: "Sugerir plano de estudo a partir das minhas notas",
  ajudaBotaoDesativado:
    "Escolha a etapa e o momento e dê pelo menos uma nota para gerar a sugestão.",
  primeiraLinhaPlano: "Plano de estudo sugerido",
  planoSemItens:
    "Nenhum item abaixo da sua média geral ou de 7 nesta autoavaliação.",
  tituloSecao: "Seu plano de estudo",
  descricaoSecao:
    "Estes são os itens em que sua nota ficou abaixo da sua média geral ou abaixo de 7, na ordem dos ciclos. Para cada um há um prompt pronto: copie e cole na IA da sua preferência para pesquisar e estudar o assunto.",
  semItens:
    "Nenhum item abaixo da sua média geral ou de 7 nesta autoavaliação. Continue praticando todos os itens.",
  tituloRegrasIAPdf: "Como usar a IA nos estudos",
} as const;

export function promptDePesquisa(
  cicloAluno: number,
  nota: number,
  textoItem: string,
): string {
  return `Sou aluno do curso técnico em enfermagem no Brasil, no Ciclo ${cicloAluno} do estágio hospitalar. Na minha autoavaliação, dei nota ${nota} de 10 para este item da ficha de estágio: "${textoItem}". Quero estudar esse assunto para melhorar no estágio.

Explique em linguagem simples:
1. o que preciso saber de teoria sobre esse assunto;
2. a técnica ou a conduta passo a passo, quando houver;
3. os erros mais comuns;
4. quando devo chamar o enfermeiro;
5. o que é atribuição do técnico de enfermagem e o que é só do enfermeiro, segundo a Lei 7.498 de 1986 e o Decreto 94.406 de 1987.

Regras para a sua resposta:
- Para cada informação, indique a fonte: diretriz brasileira, Ministério da Saúde, Agência Nacional de Vigilância Sanitária, Conselho Federal de Enfermagem ou artigo científico com autores, ano, revista e link direto.
- Use só fontes que você consiga indicar com link. Se não tiver certeza de uma fonte ou de uma informação, diga isso claramente.
- Não invente referências.
- Lembre que, na prática, valem o protocolo da instituição e a orientação do enfermeiro supervisor.

No fim, faça 5 perguntas de treino sobre o assunto, uma de cada vez, espere a minha resposta e corrija.`;
}

export function descricaoProximoCiclo(n: number): string {
  return `Itens que passam a ser cobrados no Ciclo ${n}.`;
}

export function linhaItemPlano(
  ordem: number,
  item: string,
  nota: number,
  ciclo: number,
): string {
  return `${ordem}. ${item} — nota ${nota} (Ciclo ${ciclo})`;
}

export function tituloProximoCicloPlano(n: number): string {
  return `Prepare-se para o Ciclo ${n}:`;
}

export function linhaItemProximoCiclo(item: string): string {
  return `- ${item}`;
}
