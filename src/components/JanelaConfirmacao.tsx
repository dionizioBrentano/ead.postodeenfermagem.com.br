import React, { useState } from "react";
import { TEXTOS_ORGANIZACAO } from "../data/textosOrganizacao";
import { Janela } from "./Janela";
import "./Organizacao.css";

export interface JanelaConfirmacaoProps {
  titulo: string;
  texto: string;
  rotuloConfirmar?: string;
  pedirMotivo?: boolean;
  onConfirmar: (motivo?: string) => void;
  onCancelar: () => void;
}

export const JanelaConfirmacao: React.FC<JanelaConfirmacaoProps> = ({
  titulo,
  texto,
  rotuloConfirmar = TEXTOS_ORGANIZACAO.confirmar,
  pedirMotivo = false,
  onConfirmar,
  onCancelar,
}) => {
  const [motivo, setMotivo] = useState("");

  const handleSubmeter = (e: React.FormEvent) => {
    e.preventDefault();
    if (pedirMotivo) {
      const motivoTrim = motivo.trim();
      if (!motivoTrim) return;
      onConfirmar(motivoTrim);
    } else {
      onConfirmar();
    }
  };

  const confirmarDesabilitado = pedirMotivo && motivo.trim() === "";

  return (
    <Janela
      titulo={titulo}
      aoFechar={onCancelar}
      idTitulo="titulo-janela-confirmacao"
    >
      <form onSubmit={handleSubmeter} className="form">
        <p>{texto}</p>

        {pedirMotivo && (
          <div className="field">
            <label htmlFor="campo-motivo-confirmacao" className="l">
              {TEXTOS_ORGANIZACAO.rotuloMotivo}
            </label>
            <input
              id="campo-motivo-confirmacao"
              type="text"
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              required
              autoComplete="off"
            />
          </div>
        )}

        <div className="organizacao-rodape-modal">
          <button
            type="button"
            className="btn ghost small"
            onClick={onCancelar}
          >
            {TEXTOS_ORGANIZACAO.cancelar}
          </button>
          <button
            type="submit"
            className="btn small"
            disabled={confirmarDesabilitado}
          >
            {rotuloConfirmar}
          </button>
        </div>
      </form>
    </Janela>
  );
};
