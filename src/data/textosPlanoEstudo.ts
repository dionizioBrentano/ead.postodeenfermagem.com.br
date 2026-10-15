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
} as const;

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
