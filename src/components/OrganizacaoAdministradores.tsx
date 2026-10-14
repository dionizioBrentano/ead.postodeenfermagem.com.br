import React, { useMemo, useState } from "react";
import {
  adminSetAtribuicoes,
  type CatalogoAtribuicoes,
  type MembroOrganizacao,
} from "../api/organizacao";
import {
  ROTULO_PERFIL_PERSONALIZADO,
  ROTULO_SITUACAO,
  TEXTOS_ORGANIZACAO,
} from "../data/textosOrganizacao";
import {
  mensagemDoErro,
  perfilDasAtribuicoes,
  rotulosDasAtribuicoes,
} from "../lib/organizacao";
import { EscolhaPerfil } from "./EscolhaPerfil";
import { Janela } from "./Janela";
import { JanelaConfirmacao } from "./JanelaConfirmacao";
import { useVinculos } from "./useVinculos";
import "./Organizacao.css";

export interface OrganizacaoAdministradoresProps {
  token: string;
  minhasAtribuicoes: string[];
  catalogo: CatalogoAtribuicoes;
  meuUserId?: string;
}

export const OrganizacaoAdministradores: React.FC<OrganizacaoAdministradoresProps> = ({
  token,
  minhasAtribuicoes,
  catalogo,
  meuUserId,
}) => {
  const mensagensAdmin = useMemo(
    () => ({
      revogado: TEXTOS_ORGANIZACAO.sucessoRevogarAdmin,
      reativado: TEXTOS_ORGANIZACAO.sucessoReativarAdmin,
    }),
    []
  );

  const {
    membros: administradores,
    carregando,
    mensagemSucesso,
    mensagemErro,
    setMensagemSucesso,
    setMensagemErro,
    recarregar,
    revogar,
    reativar,
  } = useVinculos(token, "administrador", mensagensAdmin);

  const [membroParaMudarPerfil, setMembroParaMudarPerfil] = useState<MembroOrganizacao | null>(null);
  const [novasAtribuicoes, setNovasAtribuicoes] = useState<string[]>([]);
  const [salvandoPerfil, setSalvandoPerfil] = useState(false);

  const [membroParaRevogar, setMembroParaRevogar] = useState<MembroOrganizacao | null>(null);

  const podeGerenciar = minhasAtribuicoes.includes("administradores.gerenciar");

  const handleAbrirMudarPerfil = (m: MembroOrganizacao) => {
    setMembroParaMudarPerfil(m);
    setNovasAtribuicoes([...(m.atribuicoes || [])]);
    setMensagemErro(null);
    setMensagemSucesso(null);
  };

  const handleSalvarPerfil = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!membroParaMudarPerfil) return;
    setSalvandoPerfil(true);
    setMensagemErro(null);
    setMensagemSucesso(null);
    try {
      await adminSetAtribuicoes(token, membroParaMudarPerfil.id, novasAtribuicoes);
      setMembroParaMudarPerfil(null);
      setMensagemSucesso(TEXTOS_ORGANIZACAO.sucessoMudarPerfil);
      await recarregar();
    } catch (e: unknown) {
      setMensagemErro(mensagemDoErro(e, TEXTOS_ORGANIZACAO.erroGenerico));
    } finally {
      setSalvandoPerfil(false);
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
        <h2>{TEXTOS_ORGANIZACAO.administradoresTitulo}</h2>
      </div>

      {mensagemErro && <p className="alert err">{mensagemErro}</p>}
      {mensagemSucesso && <p className="alert info">{mensagemSucesso}</p>}

      {carregando ? (
        <p className="muted">{TEXTOS_ORGANIZACAO.carregando}</p>
      ) : administradores.length === 0 ? (
        <p className="muted">{TEXTOS_ORGANIZACAO.administradoresVazio}</p>
      ) : (
        <ul className="saved">
          {administradores.map((m) => {
            const ehProprioUsuario = meuUserId ? m.user_id === meuUserId : false;
            const perfil = perfilDasAtribuicoes(m.atribuicoes, catalogo.perfis);
            const rotulosAtrib = rotulosDasAtribuicoes(m.atribuicoes, catalogo.atribuicoes);
            const situacaoTexto = ROTULO_SITUACAO[m.situacao] || m.situacao;

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

                  <div className="organizacao-membro-detalhe">
                    {perfil ? (
                      <span className="chip organizacao-chip-destaque">
                        {perfil.rotulo}
                      </span>
                    ) : (
                      <div className="organizacao-chips-wrap">
                        <span className="chip organizacao-chip-regular">
                          {ROTULO_PERFIL_PERSONALIZADO}
                        </span>
                        {rotulosAtrib.map((rotulo) => (
                          <span key={rotulo} className="chip organizacao-chip-regular">
                            {rotulo}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {podeGerenciar && (
                  <div className="acts">
                    {m.situacao === "ativo" && !ehProprioUsuario && (
                      <>
                        <button
                          type="button"
                          className="btn ghost small"
                          onClick={() => handleAbrirMudarPerfil(m)}
                        >
                          {TEXTOS_ORGANIZACAO.mudarPerfil}
                        </button>
                        <button
                          type="button"
                          className="btn ghost small"
                          onClick={() => setMembroParaRevogar(m)}
                        >
                          {TEXTOS_ORGANIZACAO.revogarAdmin}
                        </button>
                      </>
                    )}
                    {m.situacao === "revogado" && !ehProprioUsuario && (
                      <button
                        type="button"
                        className="btn ghost small"
                        onClick={() => handleReativar(m.id)}
                      >
                        {TEXTOS_ORGANIZACAO.reativarAdmin}
                      </button>
                    )}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {membroParaMudarPerfil && (
        <Janela
          titulo={TEXTOS_ORGANIZACAO.janelaMudarPerfilTitulo}
          aoFechar={() => setMembroParaMudarPerfil(null)}
          idTitulo="titulo-janela-mudar-perfil"
        >
          <form onSubmit={handleSalvarPerfil} className="form">
            <p>
              <strong>{membroParaMudarPerfil.usuario?.name || "Administrador"}</strong> (
              {membroParaMudarPerfil.usuario?.email || "sem e-mail"})
            </p>

            <EscolhaPerfil
              catalogo={catalogo}
              atribuicoes={novasAtribuicoes}
              onAlterar={setNovasAtribuicoes}
              desabilitado={salvandoPerfil}
            />

            <div className="organizacao-rodape-modal">
              <button
                type="button"
                className="btn ghost small"
                disabled={salvandoPerfil}
                onClick={() => setMembroParaMudarPerfil(null)}
              >
                {TEXTOS_ORGANIZACAO.cancelar}
              </button>
              <button
                type="submit"
                className="btn small"
                disabled={salvandoPerfil}
              >
                {TEXTOS_ORGANIZACAO.salvarPerfil}
              </button>
            </div>
          </form>
        </Janela>
      )}

      {membroParaRevogar && (
        <JanelaConfirmacao
          titulo={TEXTOS_ORGANIZACAO.confirmarRevogacaoAdminTitulo}
          texto={TEXTOS_ORGANIZACAO.confirmarRevogacaoAdminTexto}
          rotuloConfirmar={TEXTOS_ORGANIZACAO.revogarAdmin}
          pedirMotivo={true}
          onConfirmar={handleConfirmarRevogacao}
          onCancelar={() => setMembroParaRevogar(null)}
        />
      )}
    </div>
  );
};
