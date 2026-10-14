import React, { useMemo, useState } from "react";
import type { MembroOrganizacao } from "../api/organizacao";
import {
  ROTULO_PRIMEIRO_ACESSO,
  ROTULO_SITUACAO,
  TEXTOS_ORGANIZACAO,
} from "../data/textosOrganizacao";
import { filtrarMembros } from "../lib/organizacao";
import { FormularioAluno } from "./FormularioAluno";
import { JanelaConfirmacao } from "./JanelaConfirmacao";
import { useVinculos } from "./useVinculos";
import "./Organizacao.css";

export interface OrganizacaoAlunosProps {
  token: string;
  minhasAtribuicoes: string[];
}

export const OrganizacaoAlunos: React.FC<OrganizacaoAlunosProps> = ({
  token,
  minhasAtribuicoes,
}) => {
  const mensagensAluno = useMemo(
    () => ({
      revogado: TEXTOS_ORGANIZACAO.sucessoRevogarAluno,
      reativado: TEXTOS_ORGANIZACAO.sucessoReativarAluno,
    }),
    []
  );

  const {
    membros: alunos,
    carregando,
    mensagemSucesso,
    mensagemErro,
    setMensagemSucesso,
    setMensagemErro,
    recarregar,
    revogar,
    reativar,
  } = useVinculos(token, "aluno", mensagensAluno);

  const [busca, setBusca] = useState("");
  const [modalFormularioAberto, setModalFormularioAberto] = useState(false);
  const [alunoParaEditar, setAlunoParaEditar] = useState<MembroOrganizacao | null>(null);
  const [membroParaRevogar, setMembroParaRevogar] = useState<MembroOrganizacao | null>(null);

  const podeCadastrar = minhasAtribuicoes.includes("alunos.cadastrar");

  const handleAbrirCadastro = () => {
    setAlunoParaEditar(null);
    setModalFormularioAberto(true);
    setMensagemErro(null);
    setMensagemSucesso(null);
  };

  const handleAbrirEdicao = (m: MembroOrganizacao) => {
    setAlunoParaEditar(m);
    setModalFormularioAberto(true);
    setMensagemErro(null);
    setMensagemSucesso(null);
  };

  const handleSalvoComSucesso = (mensagem: string) => {
    setModalFormularioAberto(false);
    setAlunoParaEditar(null);
    setMensagemSucesso(mensagem);
    void recarregar();
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

  const alunosFiltrados = filtrarMembros(alunos, busca);

  return (
    <div className="box organizacao-painel">
      <div className="organizacao-topo">
        <div className="organizacao-titulo-com-contagem">
          <h2>{TEXTOS_ORGANIZACAO.alunosTitulo}</h2>
          {!carregando && (
            <span className="chip organizacao-chip-regular">
              {TEXTOS_ORGANIZACAO.alunosContagem(alunos.length)}
            </span>
          )}
        </div>
        {podeCadastrar && (
          <button type="button" className="btn small" onClick={handleAbrirCadastro}>
            {TEXTOS_ORGANIZACAO.cadastrarAluno}
          </button>
        )}
      </div>

      {mensagemErro && <p className="alert err">{mensagemErro}</p>}
      {mensagemSucesso && <p className="alert info">{mensagemSucesso}</p>}

      <div className="organizacao-barra-busca">
        <input
          type="search"
          placeholder={TEXTOS_ORGANIZACAO.buscaAlunosPlaceholder}
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
        />
      </div>

      {carregando ? (
        <p className="muted">{TEXTOS_ORGANIZACAO.carregando}</p>
      ) : alunosFiltrados.length === 0 ? (
        <p className="muted">{TEXTOS_ORGANIZACAO.alunosVazio}</p>
      ) : (
        <ul className="saved">
          {alunosFiltrados.map((m) => {
            const primeiroAcessoTexto = m.primeiro_acesso_feito
              ? ROTULO_PRIMEIRO_ACESSO.acessou
              : ROTULO_PRIMEIRO_ACESSO.naoAcessou;
            const situacaoTexto = ROTULO_SITUACAO[m.situacao] || m.situacao;

            return (
              <li key={m.id}>
                <div className="organizacao-membro-info">
                  <span className="organizacao-membro-nome">
                    {m.usuario?.name || "Sem nome"}
                  </span>
                  <div className="organizacao-membro-detalhe">
                    <span>{m.usuario?.email || "Sem e-mail"}</span>
                    {m.celular_mascarado && (
                      <>
                        <span>•</span>
                        <span>{m.celular_mascarado}</span>
                      </>
                    )}
                    <span>•</span>
                    <span>{situacaoTexto}</span>
                  </div>

                  <div className="organizacao-membro-detalhe">
                    <span className="chip organizacao-chip-regular">
                      {m.matricula
                        ? `${TEXTOS_ORGANIZACAO.matriculaRotulo}: ${m.matricula}`
                        : TEXTOS_ORGANIZACAO.semMatricula}
                    </span>
                    <span
                      className={`chip ${
                        m.primeiro_acesso_feito
                          ? "organizacao-chip-destaque"
                          : "organizacao-chip-regular"
                      }`}
                    >
                      {primeiroAcessoTexto}
                    </span>
                  </div>
                </div>

                {podeCadastrar && (
                  <div className="acts">
                    {m.situacao === "ativo" && (
                      <>
                        <button
                          type="button"
                          className="btn ghost small"
                          onClick={() => handleAbrirEdicao(m)}
                        >
                          {TEXTOS_ORGANIZACAO.corrigirAluno}
                        </button>
                        <button
                          type="button"
                          className="btn ghost small"
                          onClick={() => setMembroParaRevogar(m)}
                        >
                          {TEXTOS_ORGANIZACAO.revogarAluno}
                        </button>
                      </>
                    )}
                    {m.situacao === "revogado" && (
                      <button
                        type="button"
                        className="btn ghost small"
                        onClick={() => handleReativar(m.id)}
                      >
                        {TEXTOS_ORGANIZACAO.reativarAluno}
                      </button>
                    )}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {modalFormularioAberto && (
        <FormularioAluno
          token={token}
          alunoParaEditar={alunoParaEditar}
          onSalvo={handleSalvoComSucesso}
          onFechar={() => {
            setModalFormularioAberto(false);
            setAlunoParaEditar(null);
          }}
        />
      )}

      {membroParaRevogar && (
        <JanelaConfirmacao
          titulo={TEXTOS_ORGANIZACAO.confirmarRevogacaoAlunoTitulo}
          texto={TEXTOS_ORGANIZACAO.confirmarRevogacaoAlunoTexto}
          rotuloConfirmar={TEXTOS_ORGANIZACAO.revogarAluno}
          pedirMotivo={true}
          onConfirmar={handleConfirmarRevogacao}
          onCancelar={() => setMembroParaRevogar(null)}
        />
      )}
    </div>
  );
};
