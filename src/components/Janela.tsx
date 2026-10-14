import React, { useEffect, useRef } from "react";
import { TEXTOS_ORGANIZACAO } from "../data/textosOrganizacao";
import "./Organizacao.css";

export interface JanelaProps {
  titulo: string;
  aoFechar: () => void;
  children: React.ReactNode;
  idTitulo?: string;
}

export const Janela: React.FC<JanelaProps> = ({
  titulo,
  aoFechar,
  children,
  idTitulo = "modal-dialog-titulo",
}) => {
  const elementoAnteriorRef = useRef<HTMLElement | null>(
    typeof document !== "undefined" ? (document.activeElement as HTMLElement | null) : null
  );
  const boxRef = useRef<HTMLDivElement>(null);
  const btnFecharRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        aoFechar();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [aoFechar]);

  useEffect(() => {
    if (boxRef.current) {
      const primeiroCampo = boxRef.current.querySelector<HTMLElement>(
        'input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), button:not(.modal-close-btn):not([disabled])'
      );
      if (primeiroCampo) {
        primeiroCampo.focus();
      } else if (btnFecharRef.current) {
        btnFecharRef.current.focus();
      }
    }

    const elementoParaRestaurar = elementoAnteriorRef.current;
    return () => {
      if (elementoParaRestaurar && typeof elementoParaRestaurar.focus === "function") {
        elementoParaRestaurar.focus();
      }
    };
  }, []);

  return (
    <div className="modal-backdrop" onClick={aoFechar}>
      <div
        ref={boxRef}
        className="modal-box"
        role="dialog"
        aria-modal="true"
        aria-labelledby={idTitulo}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <h2 id={idTitulo}>{titulo}</h2>
          <button
            ref={btnFecharRef}
            type="button"
            className="modal-close-btn"
            aria-label={TEXTOS_ORGANIZACAO.fechar}
            onClick={aoFechar}
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
        {children}
      </div>
    </div>
  );
};
