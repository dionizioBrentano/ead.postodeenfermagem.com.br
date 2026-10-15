/**
 * Textos fixos da página de assunto de estudo EAD.
 * Regra F-10: nenhum texto de interface fica dentro de componente.
 */

import type { SituacaoRevisao } from "../types/ead";

export const TEXTOS_ASSUNTOS_ESTUDO = {
  tituloItens: "Itens da ficha de avaliação",
  tituloAtribuicoes: "O que é do técnico e o que é do enfermeiro",
  subtituloTecnico: "Técnico de enfermagem",
  subtituloEnfermeiro: "Enfermeiro",
  tituloIA: "Pesquise com a IA da sua preferência",
  subtituloRegrasIA: "Como usar IA nos estudos",
  botaoCopiar: "Copiar prompt",
  copiaSucesso: "Prompt copiado. Cole na IA da sua preferência.",
  copiaFalha: "Não foi possível copiar. Selecione o texto do prompt e copie manualmente.",
  rotuloDuvida: "Minha dúvida",
  ajudaDuvida: "Não escreva nome, leito, prontuário nem qualquer dado de paciente.",
  avisoBotaoDesativado: "Escreva sua dúvida para copiar este prompt.",
  prefixoDuvida: "Minha dúvida:",
  seloValidacao: "Em validação",
  fonteAusente: "Fonte pendente",
  rotuloFonteBloco: "Fonte:",
  tituloAvisoRascunho: "Rascunho em validação",
  corpoAvisoRascunho:
    "Este conteúdo ainda está sendo conferido com fontes atuais. Não use como referência para o estágio até a revisão.",
  tituloRevisao: "Revisão do conteúdo",
  rotuloSituacao: "Situação:",
  rotuloVersao: "Versão:",
  rotuloCriadoEm: "Criado em:",
  rotuloRevisadoPor: "Revisado por:",
  rotuloRevisadoEm: "Revisado em:",
  rotuloProximaRevisao: "Próxima revisão:",
  valorAusenteRevisao: "Ainda não definido",
  nomesSituacao: {
    rascunho: "Rascunho",
    revisado: "Revisado",
    publicado: "Publicado",
  } as Record<SituacaoRevisao, string>,
  metaAno: "Ano:",
  metaSecoes: "Seções:",
  metaDoi: "DOI:",
  metaTrechoVideo: "Trecho do vídeo:",
  metaAcessadoEm: "Acessado em:",
  validacaoPendente: "Validação pendente",
  separadorFontes: ", ",
  regrasUsoIA: [
    "A IA erra e às vezes inventa referências. Abra cada link que ela indicar e confira se o título, os autores e o ano batem.",
    "Nunca escreva nome, leito, prontuário, foto ou qualquer dado de paciente na IA.",
    "Na prática do estágio, valem o protocolo da instituição e a orientação do enfermeiro supervisor.",
    "Leve ao seu supervisor o que aprendeu e o que ficou em dúvida.",
    "Use a IA para entender e treinar, não para fazer a tarefa por você.",
  ],
} as const;

export function validacaoFonte(data: string, nome: string): string {
  return `Validada em ${data} por ${nome}`;
}

export function rotuloSeloAssunto(ciclos: readonly number[]): string {
  if (ciclos.length <= 1) {
    const ciclo = ciclos[0] ?? 1;
    return `Assunto de estudo • Ciclo ${ciclo}`;
  }
  const todosMenosUltimo = ciclos.slice(0, -1).join(", ");
  const ultimo = ciclos[ciclos.length - 1];
  return `Assunto de estudo • Ciclos ${todosMenosUltimo} e ${ultimo}`;
}
