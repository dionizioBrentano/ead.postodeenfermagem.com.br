/**
 * Funções puras de avaliação e conferência do Quiz EAD.
 * Regra F-12: lógica de gabarito e conferência separada de apresentação React.
 */

export interface ResultadoQuestao {
  respondida: boolean;
  correta: boolean;
  indiceSelecionado?: number;
  indiceCorreto: number;
}

export function verificarResposta(indiceCorreto: number, indiceSelecionado?: number): ResultadoQuestao {
  if (indiceSelecionado === undefined || indiceSelecionado === null) {
    return {
      respondida: false,
      correta: false,
      indiceCorreto,
    };
  }

  return {
    respondida: true,
    correta: indiceSelecionado === indiceCorreto,
    indiceSelecionado,
    indiceCorreto,
  };
}

export function calcularDesempenhoQuiz(
  respostas: Record<number, number>,
  gabarito: number[]
): { totalQuestoes: number; respondidas: number; acertos: number; concluido: boolean } {
  const totalQuestoes = gabarito.length;
  let respondidas = 0;
  let acertos = 0;

  gabarito.forEach((correto, index) => {
    const selecionada = respostas[index];
    if (selecionada !== undefined) {
      respondidas += 1;
      if (selecionada === correto) {
        acertos += 1;
      }
    }
  });

  return {
    totalQuestoes,
    respondidas,
    acertos,
    concluido: respondidas === totalQuestoes,
  };
}
