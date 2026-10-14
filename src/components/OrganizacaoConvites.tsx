import React, { useEffect, useState } from "react";
import {
  adminCriarConvite,
  adminDeletarConvite,
  adminGetConvites,
  type CatalogoAtribuicoes,
  type ConviteOrganizacao,
} from "../api/organizacao";
import {
  ROTULO_PAPEL,
  ROTULO_PERFIL_PERSONALIZADO,
  TEXTOS_ORGANIZACAO,
} from "../data/textosOrganizacao";
import { perfilDasAtribuicoes } from "../lib/organizacao";
import { EscolhaPerfil } from "./EscolhaPerfil";
import { JanelaConfirmacao } from "./JanelaConfirmacao";
import "./Organizacao.css";

export interface OrganizacaoConvitesProps {
  token: string;
  minhasAtribuicoes: string[];
  catalogo: CatalogoAtribuicoes;
}

export const OrganizacaoConvites: React.FC<OrganizacaoConvitesProps> = ({
  token,
  minhasAtribuicoes,
  catalogo,
}) => {
  const [convites, setConvites] = useState<ConviteOrganizacao[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [msgErro, setMsgErro] = useState<string | null>(null);
  const [msgSucesso, setMsgSucesso] = useState<string | null>(null);

  const [email, setEmail] = useState("");
  const [papel, setPapel] = useState<"docente" | "administrador">("docente");
  const [atribuicoes, setAtribuicoes] = useState<string[]>([]);
  const [enviando, setEnviando] = useState(false);

  const [conviteParaCancelar, setConviteParaCancelar] = useState<ConviteOrganizacao | null>(null);

  const podeGerenciarAdmins = minhasAtribuicoes.includes("administradores.gerenciar");

  const carregarConvites = async () => {
    setCarregando(true);
    setMsgErro(null);
    try {
      const lista = await adminGetConvites(token);
      setConvites(lista);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : TEXTOS_ORGANIZACAO.erroGenerico;
      setMsgErro(msg);
    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => {
    void carregarConvites();
  }, [token]);

  const handleMudarPapel = (novoPapel: "docente" | "administrador") => {
    setPapel(novoPapel);
    if (novoPapel === "administrador") {
      setAtribuicoes([]);
    }
  };

  const handleCriarConvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsgErro(null);
    setMsgSucesso(null);

    if (papel === "administrador" && atribuicoes.length === 0) {
      setMsgErro(TEXTOS_ORGANIZACAO.perfilObrigatorioAdmin);
      return;
    }

    setEnviando(true);
    try {
      await adminCriarConvite(token, {
        email: email.trim(),
        papel,
        atribuicoes: papel === "administrador" ? atribuicoes : undefined,
      });

      setEmail("");
      setMsgSucesso(TEXTOS_ORGANIZACAO.sucessoCriarConvite);
      await carregarConvites();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : TEXTOS_ORGANIZACAO.erroGenerico;
      setMsgErro(msg);
    } finally {
      setEnviando(false);
    }
  };

  const handleConfirmarCancelamento = async () => {
    if (!conviteParaCancelar) return;
    const id = conviteParaCancelar.id;
    setConviteParaCancelar(null);
    setMsgErro(null);
    setMsgSucesso(null);

    try {
      await adminDeletarConvite(token, id);
      setMsgSucesso(TEXTOS_ORGANIZACAO.sucessoCancelarConvite);
      await carregarConvites();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : TEXTOS_ORGANIZACAO.erroGenerico;
      setMsgErro(msg);
    }
  };

  return (
    <div className="organizacao-painel">
      {msgErro && <p className="alert err">{msgErro}</p>}
      {msgSucesso && <p className="alert info">{msgSucesso}</p>}

      <div className="box">
        <div className="organizacao-topo">
          <h2>{TEXTOS_ORGANIZACAO.novoConviteTitulo}</h2>
        </div>

        <form onSubmit={handleCriarConvite} className="form">
          <div className="field">
            <label htmlFor="campo-convite-email" className="l">
              {TEXTOS_ORGANIZACAO.emailCampo}
            </label>
            <input
              id="campo-convite-email"
              type="email"
              value={email}
              required
              disabled={enviando}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="exemplo@escola.com.br"
            />
          </div>

          <div className="field">
            <label className="l">{TEXTOS_ORGANIZACAO.papelCampo}</label>
            <div className="seg" role="radiogroup" aria-label="Papel do convite">
              <label htmlFor="radio-convite-docente">
                <input
                  id="radio-convite-docente"
                  type="radio"
                  name="papel-convite"
                  value="docente"
                  checked={papel === "docente"}
                  disabled={enviando}
                  onChange={() => handleMudarPapel("docente")}
                />
                <span>{ROTULO_PAPEL.docente}</span>
              </label>

              {podeGerenciarAdmins && (
                <label htmlFor="radio-convite-admin">
                  <input
                    id="radio-convite-admin"
                    type="radio"
                    name="papel-convite"
                    value="administrador"
                    checked={papel === "administrador"}
                    disabled={enviando}
                    onChange={() => handleMudarPapel("administrador")}
                  />
                  <span>{ROTULO_PAPEL.administrador}</span>
                </label>
              )}
            </div>
          </div>

          {papel === "administrador" && (
            <EscolhaPerfil
              catalogo={catalogo}
              atribuicoes={atribuicoes}
              onAlterar={setAtribuicoes}
              desabilitado={enviando}
            />
          )}

          <div>
            <button type="submit" className="btn small" disabled={enviando}>
              {TEXTOS_ORGANIZACAO.enviarConvite}
            </button>
          </div>
        </form>
      </div>

      <div className="box">
        <div className="organizacao-topo">
          <h3>{TEXTOS_ORGANIZACAO.convitesPendentesTitulo}</h3>
        </div>

        {carregando ? (
          <p className="muted">{TEXTOS_ORGANIZACAO.carregando}</p>
        ) : convites.length === 0 ? (
          <p className="muted">{TEXTOS_ORGANIZACAO.convitesPendentesVazio}</p>
        ) : (
          <ul className="saved">
            {convites.map((c) => {
              const papelTexto = ROTULO_PAPEL[c.papel] || c.papel;
              const perfil =
                c.papel === "administrador"
                  ? perfilDasAtribuicoes(c.atribuicoes || [], catalogo.perfis)
                  : null;

              return (
                <li key={c.id}>
                  <div className="organizacao-membro-info">
                    <span className="organizacao-membro-nome">{c.email}</span>
                    <div className="organizacao-membro-detalhe">
                      <span>{papelTexto}</span>
                      {c.papel === "administrador" && (
                        <>
                          <span>•</span>
                          <span>
                            {perfil
                              ? perfil.rotulo
                              : ROTULO_PERFIL_PERSONALIZADO}
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="acts">
                    <button
                      type="button"
                      className="btn ghost small"
                      onClick={() => setConviteParaCancelar(c)}
                    >
                      {TEXTOS_ORGANIZACAO.cancelarConvite}
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {conviteParaCancelar && (
        <JanelaConfirmacao
          titulo={TEXTOS_ORGANIZACAO.confirmarCancelarConviteTitulo}
          texto={TEXTOS_ORGANIZACAO.confirmarCancelarConviteTexto}
          rotuloConfirmar={TEXTOS_ORGANIZACAO.cancelarConvite}
          onConfirmar={handleConfirmarCancelamento}
          onCancelar={() => setConviteParaCancelar(null)}
        />
      )}
    </div>
  );
};
