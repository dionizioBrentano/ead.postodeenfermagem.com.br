import { useEffect, useState } from "react";
import {
  getEstagioCicloEtapa,
  getEstagioAssunto,
  type EstagioAssuntoItem,
  type EstagioFichaResponse,
} from "../api/ead";

interface GuiaProps {
  onAutoavaliar?: () => void;
}

export default function Guia({ onAutoavaliar: _onAutoavaliar }: GuiaProps) {
  const [assuntoSlug, setAssuntoSlug] = useState<string | null>(null);

  // Lista dos 16 assuntos
  const [itens, setItens] = useState<EstagioAssuntoItem[]>([]);
  const [carregandoLista, setCarregandoLista] = useState(true);
  const [erroLista, setErroLista] = useState<string | null>(null);

  // Ficha do assunto selecionado
  const [ficha, setFicha] = useState<EstagioFichaResponse | null>(null);
  const [carregandoFicha, setCarregandoFicha] = useState(false);
  const [erroFicha, setErroFicha] = useState<string | null>(null);

  // Carrega a lista dos 16 assuntos (Ciclo 1 Etapa 1)
  const carregarLista = async () => {
    setCarregandoLista(true);
    setErroLista(null);
    try {
      const data = await getEstagioCicloEtapa(1, 1);
      const ordenados = [...data].sort((a, b) => a.ordem - b.ordem);
      setItens(ordenados);
    } catch {
      setErroLista("Não foi possível carregar os assuntos do estágio. Tente novamente.");
    } finally {
      setCarregandoLista(false);
    }
  };

  useEffect(() => {
    void carregarLista();
  }, []);

  // Carrega a ficha ao selecionar um assunto
  useEffect(() => {
    if (!assuntoSlug) {
      setFicha(null);
      setErroFicha(null);
      return;
    }

    let cancelado = false;
    const carregarFicha = async () => {
      setCarregandoFicha(true);
      setErroFicha(null);
      try {
        const data = await getEstagioAssunto(assuntoSlug);
        if (!cancelado) {
          setFicha(data);
        }
      } catch {
        if (!cancelado) {
          setErroFicha("Não foi possível carregar as orientações deste assunto.");
        }
      } finally {
        if (!cancelado) {
          setCarregandoFicha(false);
        }
      }
    };

    void carregarFicha();
    return () => {
      cancelado = true;
    };
  }, [assuntoSlug]);

  const abrirAssunto = (slug: string) => {
    setAssuntoSlug(slug);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const voltarParaLista = () => {
    setAssuntoSlug(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Se uma ficha estiver selecionada, renderiza a ficha
  if (assuntoSlug) {
    if (carregandoFicha) {
      return (
        <div className="guia-root">
          <div className="wrap">
            <button type="button" className="guia-btn-voltar" onClick={voltarParaLista}>
              ← Voltar aos assuntos
            </button>
            <div className="guia-status-msg">Carregando assunto...</div>
          </div>
        </div>
      );
    }

    if (erroFicha || !ficha) {
      return (
        <div className="guia-root">
          <div className="wrap">
            <button type="button" className="guia-btn-voltar" onClick={voltarParaLista}>
              ← Voltar aos assuntos
            </button>
            <div className="guia-status-msg">
              <p>{erroFicha || "Assunto não encontrado."}</p>
              <button
                type="button"
                className="guia-btn-tentar"
                onClick={() => {
                  const s = assuntoSlug;
                  setAssuntoSlug(null);
                  setTimeout(() => setAssuntoSlug(s), 50);
                }}
              >
                Tentar novamente
              </button>
            </div>
          </div>
        </div>
      );
    }

    const { assunto, peca, ver_tambem_links, passos_ordenados } = ficha;
    const componente = assunto.componente;

    // Regra 5: Não desenhe tela de artigo
    if (componente === "artigo") {
      return (
        <div className="guia-root">
          <div className="wrap">
            <button type="button" className="guia-btn-voltar" onClick={voltarParaLista}>
              ← Voltar aos assuntos
            </button>
          </div>
        </div>
      );
    }

    const temAlerta = Boolean(peca.alerta && peca.alerta.trim() !== "");
    const temApoioBrunner = Boolean(
      peca.apoio_brunner &&
        (peca.apoio_brunner.capitulo || peca.apoio_brunner.secao || peca.apoio_brunner.uso)
    );

    // Bloco comum de fontes
    const blocoFontes =
      peca.fontes && peca.fontes.length > 0 ? (
        <div className="guia-secao">
          <h2 className="guia-secao-titulo">Fontes e referências</h2>
          <ul className="guia-fontes-lista">
            {peca.fontes.map((fonte, idx) => {
              const temUrl = Boolean(fonte.url && fonte.url.trim() !== "");
              return (
                <li key={idx} className="guia-fonte-item">
                  {fonte.orgao ? <strong>{fonte.orgao} — </strong> : null}
                  {temUrl ? (
                    <a
                      href={fonte.url!}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="guia-fonte-link"
                    >
                      {fonte.norma}
                    </a>
                  ) : (
                    <span className="guia-fonte-texto">{fonte.norma}</span>
                  )}
                  {fonte.ano ? (
                    <span className="guia-texto-secundario"> ({fonte.ano})</span>
                  ) : null}
                </li>
              );
            })}
          </ul>
        </div>
      ) : null;

    // Bloco comum de ver também
    const blocoVerTambem =
      ver_tambem_links && ver_tambem_links.length > 0 ? (
        <div className="guia-secao">
          <h2 className="guia-secao-titulo">Ver também</h2>
          <div className="guia-ver-tambem-grid">
            {ver_tambem_links.map((link) => (
              <button
                key={link.slug}
                type="button"
                className="guia-ver-tambem-btn"
                onClick={() => abrirAssunto(link.slug)}
              >
                <span>{link.titulo}</span>
                <span className="guia-ver-tambem-seta">→</span>
              </button>
            ))}
          </div>
        </div>
      ) : null;

    // Bloco de alerta
    const blocoAlerta = temAlerta ? (
      <div className="guia-alerta-box">
        <span className="guia-alerta-tag">Atenção</span>
        <p className="guia-alerta-texto">{peca.alerta}</p>
      </div>
    ) : null;

    // Bloco de faz
    const blocoFaz =
      peca.faz && peca.faz.length > 0 ? (
        <div className="guia-secao">
          <h2 className="guia-secao-titulo">O que fazer</h2>
          <ul className="guia-lista-itens">
            {peca.faz.map((item, idx) => (
              <li key={idx}>{item}</li>
            ))}
          </ul>
        </div>
      ) : null;

    // Bloco de nao_faz
    const blocoNaoFaz =
      peca.nao_faz && peca.nao_faz.length > 0 ? (
        <div className="guia-secao">
          <h2 className="guia-secao-titulo">O que não fazer</h2>
          <ul className="guia-lista-itens">
            {peca.nao_faz.map((item, idx) => (
              <li key={idx}>{item}</li>
            ))}
          </ul>
        </div>
      ) : null;

    return (
      <div className="guia-root">
        <div className="wrap">
          <button type="button" className="guia-btn-voltar" onClick={voltarParaLista}>
            ← Voltar aos assuntos
          </button>

          <div className="guia-ficha-card">
            {componente === "conceito" ? (
              /* CONCEITO: titulo, objetivo, faz, nao_faz, alerta se não for vazio, fontes, ver_tambem. Sem passos. Sem registro. */
              <>
                <div className="guia-ficha-cabecalho">
                  <span className="guia-ficha-badge">Conceito</span>
                  <h1 className="guia-ficha-titulo">{assunto.titulo}</h1>
                </div>

                {peca.objetivo ? (
                  <div className="guia-secao">
                    <p className="guia-texto-objetivo">{peca.objetivo}</p>
                  </div>
                ) : null}

                {blocoFaz}
                {blocoNaoFaz}
                {blocoAlerta}
                {blocoFontes}
                {blocoVerTambem}
              </>
            ) : (
              /* FICHA_PROCEDIMENTO e FICHA_META, nesta ordem: titulo, objetivo, alerta se não for vazio, faz, nao_faz, passos_ordenados, registro, erro_comum, fontes, apoio_brunner se não for nulo, ver_tambem. */
              <>
                <div className="guia-ficha-cabecalho">
                  <span className="guia-ficha-badge">
                    {componente === "ficha_meta" ? "Meta de segurança" : "Procedimento"}
                  </span>
                  <h1 className="guia-ficha-titulo">{assunto.titulo}</h1>
                </div>

                {peca.objetivo ? (
                  <div className="guia-secao">
                    <p className="guia-texto-objetivo">{peca.objetivo}</p>
                  </div>
                ) : null}

                {blocoAlerta}
                {blocoFaz}
                {blocoNaoFaz}

                {passos_ordenados && passos_ordenados.length > 0 ? (
                  <div className="guia-secao">
                    <h2 className="guia-secao-titulo">Passos ordenados</h2>
                    <ol className="guia-passos-ordenados">
                      {passos_ordenados.map((passo, idx) => (
                        <li key={idx}>{passo.texto}</li>
                      ))}
                    </ol>
                  </div>
                ) : null}

                {peca.registro ? (
                  <div className="guia-secao">
                    <h2 className="guia-secao-titulo">Registro</h2>
                    {peca.registro.o_que && peca.registro.o_que.length > 0 ? (
                      <>
                        <div className="guia-subsecao-label">O que registrar:</div>
                        <ul className="guia-lista-itens">
                          {peca.registro.o_que.map((item, idx) => (
                            <li key={idx}>{item}</li>
                          ))}
                        </ul>
                      </>
                    ) : null}
                    {peca.registro.exemplo ? (
                      <div className="guia-exemplo-card">
                        <div className="guia-subsecao-label">Exemplo no prontuário:</div>
                        <p className="guia-exemplo-texto">{peca.registro.exemplo}</p>
                      </div>
                    ) : null}
                  </div>
                ) : null}

                {peca.erro_comum && peca.erro_comum.length > 0 ? (
                  <div className="guia-secao">
                    <h2 className="guia-secao-titulo">Erros comuns</h2>
                    <ul className="guia-lista-itens">
                      {peca.erro_comum.map((item, idx) => (
                        <li key={idx}>{item}</li>
                      ))}
                    </ul>
                  </div>
                ) : null}

                {blocoFontes}

                {temApoioBrunner ? (
                  <div className="guia-secao">
                    <h2 className="guia-secao-titulo">Leitura de apoio (Brunner)</h2>
                    <div className="guia-apoio-card">
                      {peca.apoio_brunner?.capitulo ? (
                        <p>
                          <strong>Capítulo:</strong> {peca.apoio_brunner.capitulo}
                        </p>
                      ) : null}
                      {peca.apoio_brunner?.secao ? (
                        <p>
                          <strong>Seção:</strong> {peca.apoio_brunner.secao}
                        </p>
                      ) : null}
                      {peca.apoio_brunner?.uso ? (
                        <p>
                          <strong>Uso:</strong> {peca.apoio_brunner.uso}
                        </p>
                      ) : null}
                    </div>
                  </div>
                ) : null}

                {blocoVerTambem}
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Visualização da lista de assuntos (Ciclo 1 Etapa 1)
  return (
    <div className="guia-root">
      <div className="wrap">
        <header className="guia-header">
          <h1 className="guia-header-titulo">Guia do Estágio</h1>
          <p className="guia-header-sub">
            Ciclo 1 · Etapa 1 — Procedimentos fundamentais e metas de segurança
          </p>
        </header>

        {carregandoLista ? (
          <div className="guia-status-msg">Carregando assuntos do estágio...</div>
        ) : erroLista ? (
          <div className="guia-status-msg">
            <p>{erroLista}</p>
            <button type="button" className="guia-btn-tentar" onClick={carregarLista}>
              Tentar novamente
            </button>
          </div>
        ) : (
          <div className="guia-lista-tabela">
            {itens.map((item) => (
              <button
                key={item.assunto_slug}
                type="button"
                className="guia-linha-item"
                onClick={() => abrirAssunto(item.assunto_slug)}
              >
                <div className="guia-linha-corpo">
                  <span className="guia-ordem">{String(item.ordem).padStart(2, "0")}</span>
                  <span className="guia-linha-titulo">{item.titulo}</span>
                </div>
                <div className="guia-linha-lado-direito">
                  <span className="guia-linha-rotulo">{item.componente_rotulo}</span>
                  <span className="guia-linha-seta">→</span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
