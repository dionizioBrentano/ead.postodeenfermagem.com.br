import { useState } from "react";
import { TEXTOS_ASSUNTOS_ESTUDO } from "../data/textosAssuntosEstudo";
import { copiarTexto } from "../lib/areaDeTransferencia";
import {
  LIMITE_DUVIDA,
  montarPromptDeEstudo,
  podeCopiarPrompt,
} from "../lib/assuntosEstudo";
import type { PromptEstudo } from "../types/ead";
import "./ConteudoEad.css";

export interface CartaoPromptEstudoProps {
  prompt: PromptEstudo;
}

export function CartaoPromptEstudo({ prompt }: CartaoPromptEstudoProps) {
  const [duvida, setDuvida] = useState("");
  const [statusCopia, setStatusCopia] = useState<"sucesso" | "falha" | null>(null);

  const desativado = !podeCopiarPrompt(prompt, duvida);
  const idCampoDuvida = `duvida-${prompt.id}`;

  const handleCopiar = async () => {
    const texto = montarPromptDeEstudo(prompt, duvida);
    const ok = await copiarTexto(texto);
    setStatusCopia(ok ? "sucesso" : "falha");
  };

  return (
    <article className="box ead-card-prompt">
      <h3 className="ead-prompt-titulo">{prompt.title}</h3>
      <p className="ead-prompt-texto">{prompt.text}</p>

      {prompt.accepts_question && (
        <div className="field">
          <label htmlFor={idCampoDuvida} className="l">
            {TEXTOS_ASSUNTOS_ESTUDO.rotuloDuvida}
          </label>
          <textarea
            id={idCampoDuvida}
            rows={3}
            maxLength={LIMITE_DUVIDA}
            value={duvida}
            onChange={(e) => {
              setDuvida(e.target.value);
              if (statusCopia) setStatusCopia(null);
            }}
          />
          <span className="h">{TEXTOS_ASSUNTOS_ESTUDO.ajudaDuvida}</span>
        </div>
      )}

      <div className="ead-prompt-acoes">
        <button
          type="button"
          className="btn small"
          disabled={desativado}
          onClick={() => void handleCopiar()}
        >
          {TEXTOS_ASSUNTOS_ESTUDO.botaoCopiar}
        </button>
        {desativado && (
          <span className="h">{TEXTOS_ASSUNTOS_ESTUDO.avisoBotaoDesativado}</span>
        )}
      </div>

      {statusCopia === "sucesso" && (
        <div className="msg" role="status" aria-live="polite">
          {TEXTOS_ASSUNTOS_ESTUDO.copiaSucesso}
        </div>
      )}
      {statusCopia === "falha" && (
        <div className="msg err" role="status" aria-live="polite">
          {TEXTOS_ASSUNTOS_ESTUDO.copiaFalha}
        </div>
      )}
    </article>
  );
}

export default CartaoPromptEstudo;
