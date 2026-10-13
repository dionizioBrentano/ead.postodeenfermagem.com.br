import { describe, it, expect } from 'vitest';
import { verificarResposta, calcularDesempenhoQuiz } from './quizEad';

describe('quizEad - lógica pura de gabarito e desempenho', () => {
  it('retorna não respondida quando o índice selecionado é indefinido', () => {
    const res = verificarResposta(1, undefined);
    expect(res.respondida).toBe(false);
    expect(res.correta).toBe(false);
    expect(res.indiceCorreto).toBe(1);
  });

  it('valida acerto quando índice selecionado bate com o gabarito', () => {
    const res = verificarResposta(2, 2);
    expect(res.respondida).toBe(true);
    expect(res.correta).toBe(true);
    expect(res.indiceSelecionado).toBe(2);
  });

  it('valida erro quando índice selecionado diverge do gabarito', () => {
    const res = verificarResposta(2, 0);
    expect(res.respondida).toBe(true);
    expect(res.correta).toBe(false);
    expect(res.indiceSelecionado).toBe(0);
  });

  it('calcula progresso e taxa de acertos do quiz', () => {
    const gabarito = [1, 1, 1];
    const respostasParciais = { 0: 1, 1: 0 };
    const parcial = calcularDesempenhoQuiz(respostasParciais, gabarito);

    expect(parcial.totalQuestoes).toBe(3);
    expect(parcial.respondidas).toBe(2);
    expect(parcial.acertos).toBe(1);
    expect(parcial.concluido).toBe(false);

    const respostasCompletas = { 0: 1, 1: 1, 2: 1 };
    const completo = calcularDesempenhoQuiz(respostasCompletas, gabarito);
    expect(completo.respondidas).toBe(3);
    expect(completo.acertos).toBe(3);
    expect(completo.concluido).toBe(true);
  });
});
