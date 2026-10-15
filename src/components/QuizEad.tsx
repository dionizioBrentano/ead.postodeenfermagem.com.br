import { useState } from "react";
import { TEXTOS_MODULOS_EAD } from "../data/textosModulosEad";
import { verificarResposta } from "../lib/quizEad";
import type { QuizQuestion } from "../types/ead";
import "./ConteudoEad.css";

export interface QuizEadProps {
  questoes: QuizQuestion[];
}

export function QuizEad({ questoes }: QuizEadProps) {
  const [respostas, setRespostas] = useState<Record<number, number>>({});

  const handleSelecionarOpcao = (indiceQuestao: number, indiceOpcao: number) => {
    setRespostas((anterior) => ({ ...anterior, [indiceQuestao]: indiceOpcao }));
  };

  return (
    <div className="ead-quiz-grade">
      {questoes.map((questao, idxQuestao) => {
        const resultado = verificarResposta(
          questao.correct_index,
          respostas[idxQuestao],
        );

        return (
          <fieldset key={idxQuestao} className="ead-quiz-card">
            <legend className="ead-quiz-enunciado">
              <span className="ead-quiz-numero">{`${TEXTOS_MODULOS_EAD.rotuloQuestao} ${idxQuestao + 1}:`}</span>
              {questao.question}
            </legend>

            <div className="ead-quiz-opcoes">
              {questao.options.map((opcaoTexto, idxOpcao) => {
                const estaSelecionada = resultado.indiceSelecionado === idxOpcao;
                const ehAGabarito = idxOpcao === questao.correct_index;

                let classeOpcao = "ead-quiz-opcao-btn";
                let rotuloAcessivel = "";

                if (resultado.respondida) {
                  if (ehAGabarito) {
                    classeOpcao += " ead-quiz-opcao-correta";
                    rotuloAcessivel = TEXTOS_MODULOS_EAD.opcaoCorreta;
                  } else if (estaSelecionada && !resultado.correta) {
                    classeOpcao += " ead-quiz-opcao-errada";
                    rotuloAcessivel = TEXTOS_MODULOS_EAD.opcaoErrada;
                  }
                }

                return (
                  <button
                    key={idxOpcao}
                    type="button"
                    className={classeOpcao}
                    onClick={() => handleSelecionarOpcao(idxQuestao, idxOpcao)}
                    aria-pressed={estaSelecionada}
                  >
                    <span className="ead-quiz-letra" aria-hidden="true">
                      {String.fromCharCode(65 + idxOpcao)}
                    </span>
                    <span className="ead-quiz-texto-opcao">{opcaoTexto}</span>
                    {rotuloAcessivel && (
                      <span className="ead-quiz-tag-status">
                        {rotuloAcessivel}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {resultado.respondida && (
              <div
                className={`ead-quiz-feedback ${resultado.correta ? "ead-feedback-acerto" : "ead-feedback-erro"}`}
                role="status"
                aria-live="polite"
              >
                <p className="ead-feedback-titulo">
                  {resultado.correta
                    ? TEXTOS_MODULOS_EAD.feedbackAcerto
                    : TEXTOS_MODULOS_EAD.feedbackErro}
                </p>
                <p className="ead-feedback-explicacao">{questao.explanation}</p>
              </div>
            )}
          </fieldset>
        );
      })}
    </div>
  );
}

export default QuizEad;
