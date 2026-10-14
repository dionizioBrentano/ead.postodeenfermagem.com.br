import React, { useMemo, useState } from "react";
import { ApiError } from "../api/client";
import type { MembroOrganizacao } from "../api/organizacao";
import {
  ROTULO_REGISTRO_CONSELHO,
  ROTULO_SITUACAO,
  TEXTOS_ORGANIZACAO,
} from "../data/textosOrganizacao";
import { JanelaConfirmacao } from "./JanelaConfirmacao";
import { useVinculos } from "./useVinculos";
import "./Organizacao.css";

export interface OrganizacaoDocentesProps {
  token: string;
  minhasAtribuicoes: string[];
}

export const OrganizacaoDocentes: React.FC<OrganizacaoDocentesProps> = ({
  token,
  minhasAtribuicoes,
}) => {
  const mensagensDocente = useMemo(
    () => ({
      aprovado: TEXTOS_ORGANIZACAO.sucessoAprovarDocente,
      revogado: TEXTOS_ORGANIZACAO.sucessoRevogarDocente,
      reativado: TEXTOS_ORGANIZACAO.sucessoReativarDocente,
    }),
    []
  );

  const {
    membros: docentes,
    carregando,
    mensagemSucesso,
    mensagemErro,
    setMensagemErro,
    aprovar,
    revogar,
    reativar,
  } = useVinculos(token, "docente", mensagensDocente);

  const [errosAprovacao, setErrosAprovacao] = useState<Record<string, string>>({});
  const [membroParaRevogar, setMembroParaRevogar] = useState<MembroOrganizacao | null>(null);

  const podeGerenciar = minhasAtribuicoes.includes("docentes.gerenciar");

  const handleAprovar = async (id: string) => {
    setErrosAprovacao((prev) => {
      const copy = { ...prev };
      delete copy[id];
      return copy;
    });

    try {
      await aprovar(id);
    } catch (e: unknown) {
      if (e instanceof ApiError && e.status === 422) {
        const body = e.body as { code?: string; message?: string } | undefined;
        if (body?.code === "membro_sem_confirmacao") {
          setMensagemErro(null);
          setErrosAprovacao((prev) => ({
            ...prev,
            [id]: body.message || TEXTOS_ORGANIZACAO.docenteSemConfirmacao,
          }));
        }
      }
    }
  };

  const handleConfirmarRevogacao = async (motivo?: string) => {
    if (!membroParaRevogar || !motivo) return;
    const id = membroParaRevogar.id;
    setMembroParaRevogar(null);
    await revogar(id, motivo);
  };

  const handleReativar = async (id: string) => {
    await reativar(id);
  };

  return (
    <div className="box organizacao-painel">
      <div className="organizacao-topo">
        <h2>{TEXTOS_ORGANIZACAO.docentesTitulo}</h2>
      </div>

      {mensagemErro && <p className="alert err">{mensagemErro}</p>}
      {mensagemSucesso && <p className="alert info">{mensagemSucesso}</p>}

      {carregando ? (
        <p className="muted">{TEXTOS_ORGANIZACAO.carregando}</p>
      ) : docentes.length === 0 ? (
        <p className="muted">{TEXTOS_ORGANIZACAO.docentesVazio}</p>
      ) : (
        <ul className="saved">
          {docentes.map((m) => {
            const situacaoTexto = ROTULO_SITUACAO[m.situacao] || m.situacao;
            const erroLinha = errosAprovacao[m.id];

            return (
              <li key={m.id}>
                <div className="organizacao-membro-info">
                  <span className="organizacao-membro-nome">
                    {m.usuario?.name || "Sem nome"}
                  </span>
                  <div className="organizacao-membro-detalhe">
                    <span>{m.usuario?.email || "Sem e-mail"}</span>
                    <span>•</span>
                    <span>{situacaoTexto}</span>
                  </div>

                  {m.registros_profissionais && m.registros_profissionais.length > 0 ? (
                    <div className="organizacao-chips-wrap">
                      {m.registros_profissionais.map((r) => {
                        const situacaoRegistro =
                          ROTULO_REGISTRO_CONSELHO[r.situacao] || r.situacao;
                        const chipClass =
                          r.situacao === "regular"
                            ? "chip organizacao-chip-destaque"
                            : r.situacao === "nao_conferido"
                            ? "chip organizacao-chip-regular"
                            : "chip organizacao-chip-aviso";

                        return (
                          <span key={r.id} className={chipClass}>
                            {r.conselho}/{r.uf} {r.numero} ({r.categoria}) —{" "}
                            {situacaoRegistro}
                          </span>
                        );
                      })}
                    </div>
                  ) : (
                    <span className="muted">
                      {m.situacao === "pendente"
                        ? "Sem registro informado"
                        : "Sem registro"}
                    </span>
                  )}

                  {erroLinha && (
                    <span className="organizacao-erro-linha">{erroLinha}</span>
                  )}
                </div>

                {podeGerenciar && (
                  <div className="acts">
                    {m.situacao === "pendente" && (
                      <button
                        type="button"
                        className="btn small"
                        onClick={() => handleAprovar(m.id)}
                      >
                        {TEXTOS_ORGANIZACAO.aprovarDocente}
                      </button>
                    )}
                    {m.situacao === "ativo" && (
                      <button
                        type="button"
                        className="btn ghost small"
                        onClick={() => setMembroParaRevogar(m)}
                      >
                        {TEXTOS_ORGANIZACAO.revogarDocente}
                      </button>
                    )}
                    {m.situacao === "revogado" && (
                      <button
                        type="button"
                        className="btn ghost small"
                        onClick={() => handleReativar(m.id)}
                      >
                        {TEXTOS_ORGANIZACAO.reativarDocente}
                      </button>
                    )}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {membroParaRevogar && (
        <JanelaConfirmacao
          titulo={TEXTOS_ORGANIZACAO.confirmarRevogacaoDocenteTitulo}
          texto={TEXTOS_ORGANIZACAO.confirmarRevogacaoDocenteTexto}
          rotuloConfirmar={TEXTOS_ORGANIZACAO.revogarDocente}
          pedirMotivo={true}
          onConfirmar={handleConfirmarRevogacao}
          onCancelar={() => setMembroParaRevogar(null)}
        />
      )}
    </div>
  );
};
