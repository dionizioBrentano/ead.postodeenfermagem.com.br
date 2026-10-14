import React, { useId, useState } from "react";
import type { CatalogoAtribuicoes } from "../api/organizacao";
import {
  ROTULO_PERFIL_PERSONALIZADO,
  TEXTOS_ORGANIZACAO,
} from "../data/textosOrganizacao";
import {
  alternarAtribuicao,
  perfilDasAtribuicoes,
} from "../lib/organizacao";
import "./Organizacao.css";

export interface EscolhaPerfilProps {
  catalogo: CatalogoAtribuicoes;
  atribuicoes: string[];
  onAlterar: (atribuicoes: string[]) => void;
  desabilitado?: boolean;
}

export const EscolhaPerfil: React.FC<EscolhaPerfilProps> = ({
  catalogo,
  atribuicoes,
  onAlterar,
  desabilitado = false,
}) => {
  const radioGroupId = useId();
  const [modoPersonalizado, setModoPersonalizado] = useState(false);

  const perfilDetectado = perfilDasAtribuicoes(atribuicoes, catalogo.perfis);
  const chaveSelecionada = modoPersonalizado
    ? "personalizado"
    : perfilDetectado
    ? perfilDetectado.chave
    : "personalizado";

  const handleSelecionarPerfil = (chave: string) => {
    if (desabilitado) return;
    if (chave === "personalizado") {
      setModoPersonalizado(true);
      return;
    }

    setModoPersonalizado(false);
    const perfil = catalogo.perfis.find((p) => p.chave === chave);
    if (perfil) {
      onAlterar([...perfil.atribuicoes]);
    }
  };

  const handleAlternarPersonalizado = (chave: string) => {
    if (desabilitado) return;
    setModoPersonalizado(true);
    const novas = alternarAtribuicao(atribuicoes, chave);
    onAlterar(novas);
  };

  return (
    <fieldset className="field">
      <legend className="l">{TEXTOS_ORGANIZACAO.perfilRotulo}</legend>
      <div
        className="seg"
        role="radiogroup"
        aria-label={TEXTOS_ORGANIZACAO.perfilAtribuicoesLegend}
      >
        {catalogo.perfis.map((p) => {
          const selecionado = chaveSelecionada === p.chave;
          const inputId = `${radioGroupId}-${p.chave}`;
          return (
            <label key={p.chave} htmlFor={inputId}>
              <input
                id={inputId}
                type="radio"
                name={radioGroupId}
                value={p.chave}
                checked={selecionado}
                disabled={desabilitado}
                onChange={() => handleSelecionarPerfil(p.chave)}
              />
              <span>{p.rotulo}</span>
            </label>
          );
        })}

        <label htmlFor={`${radioGroupId}-personalizado`}>
          <input
            id={`${radioGroupId}-personalizado`}
            type="radio"
            name={radioGroupId}
            value="personalizado"
            checked={chaveSelecionada === "personalizado"}
            disabled={desabilitado}
            onChange={() => handleSelecionarPerfil("personalizado")}
          />
          <span>{ROTULO_PERFIL_PERSONALIZADO}</span>
        </label>
      </div>

      {!modoPersonalizado && perfilDetectado && (
        <p className="organizacao-perfil-descricao">{perfilDetectado.descricao}</p>
      )}

      {chaveSelecionada === "personalizado" && (
        <div className="organizacao-checks-grid">
          {catalogo.atribuicoes.map((item) => {
            const marcado = atribuicoes.includes(item.chave);
            const checkId = `${radioGroupId}-check-${item.chave}`;
            return (
              <label
                key={item.chave}
                htmlFor={checkId}
                className="organizacao-check-label"
              >
                <input
                  id={checkId}
                  type="checkbox"
                  checked={marcado}
                  disabled={desabilitado}
                  onChange={() => handleAlternarPersonalizado(item.chave)}
                />
                <span className="organizacao-check-texto">
                  <strong>{item.chave}</strong> — {item.rotulo}
                </span>
              </label>
            );
          })}
        </div>
      )}
    </fieldset>
  );
};
