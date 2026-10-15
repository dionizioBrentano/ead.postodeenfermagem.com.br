import { useState } from 'react';
import { verificarResposta } from '../lib/quizEad';
import { rotuloTipoFonte, caminhoImagemModulo } from '../lib/modulosEad';
import { TEXTOS_MODULOS_EAD, rotuloSeloModulo } from '../data/textosModulosEad';
import type { EadModule, EadModuleMetadata, ContentBlock, SourceItem } from '../types/ead';
import './EadModuloPage.css';

export interface EadModuloPageProps {
  metadados: EadModuleMetadata;
  modulo: EadModule;
  onVoltar?: () => void;
}

export function EadModuloPage({ metadados, modulo, onVoltar }: EadModuloPageProps) {
  const [respostas, setRespostas] = useState<Record<number, number>>({});

  const handleSelecionarOpcao = (indiceQuestao: number, indiceOpcao: number) => {
    setRespostas((anterior) => ({ ...anterior, [indiceQuestao]: indiceOpcao }));
  };

  const renderizarBlocoConteudo = (bloco: ContentBlock, chave: number) => {
    switch (bloco.type) {
      case 'text':
        return (
          <div key={chave} className="ead-bloco-texto">
            {bloco.title && <h4 className="ead-bloco-subtitulo">{bloco.title}</h4>}
            <p className="ead-bloco-corpo">{bloco.body}</p>
          </div>
        );

      case 'alert':
        return (
          <aside
            key={chave}
            className={`ead-bloco-alerta ${bloco.level === 'warning' ? 'ead-alerta-warning' : 'ead-alerta-info'}`}
            role="note"
            aria-label={bloco.title}
          >
            <span className="ead-alerta-rotulo">
              {bloco.level === 'warning' ? TEXTOS_MODULOS_EAD.alertaWarning : TEXTOS_MODULOS_EAD.alertaInfo}
            </span>
            <strong className="ead-alerta-titulo">{bloco.title}</strong>
            <p className="ead-alerta-corpo">{bloco.body}</p>
          </aside>
        );

      case 'checklist':
        return (
          <div key={chave} className="ead-bloco-checklist">
            {bloco.title && <h4 className="ead-checklist-titulo">{bloco.title}</h4>}
            <ul className="ead-checklist-lista">
              {bloco.items.map((item, idxItem) => (
                <li key={idxItem} className="ead-checklist-item">
                  <span className="ead-checklist-icone" aria-hidden="true">✓</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        );

      case 'image':
        return (
          <figure key={chave} className="ead-bloco-imagem">
            {bloco.image_file ? (
              <img
                src={caminhoImagemModulo(bloco.image_file, import.meta.env.BASE_URL)}
                alt={bloco.alt}
                width={bloco.width}
                height={bloco.height}
                loading="lazy"
                decoding="async"
                className="ead-imagem-foto"
              />
            ) : (
              <div
                className="ead-imagem-moldura"
                role="img"
                aria-label={bloco.alt}
              >
                <span className="ead-imagem-simbolo" aria-hidden="true">{TEXTOS_MODULOS_EAD.recursoVisual}</span>
                <p className="ead-imagem-descricao-alt">{bloco.alt}</p>
              </div>
            )}
            {bloco.caption && (
              <figcaption className="ead-imagem-legenda">
                {bloco.caption}
              </figcaption>
            )}
          </figure>
        );

      default:
        return null;
    }
  };

  return (
    <main className="ead-page">
      <nav aria-label={TEXTOS_MODULOS_EAD.navAriaLabel}>
        <a
          href="/sala"
          className="ead-nav-voltar"
          onClick={(e) => {
            if (onVoltar) {
              e.preventDefault();
              onVoltar();
            }
          }}
        >
          {TEXTOS_MODULOS_EAD.voltarSala}
        </a>
      </nav>

      <header className="ead-header">
        <span className="ead-badge-modulo">
          {rotuloSeloModulo(modulo.order ?? metadados.number)}
        </span>
        <h1 className="ead-titulo-modulo">{modulo.module_title}</h1>
        <p className="ead-subtitulo-modulo">
          {metadados.short_description}
        </p>
      </header>

      {/* Objetivos de Aprendizagem */}
      <section className="ead-secao" aria-labelledby="titulo-objetivos">
        <h2 id="titulo-objetivos" className="ead-secao-titulo">
          {TEXTOS_MODULOS_EAD.tituloObjetivos}
        </h2>
        <div className="ead-card-objetivos">
          <ul className="ead-lista-objetivos">
            {modulo.learning_objectives.map((objetivo, idxObj) => (
              <li key={idxObj} className="ead-item-objetivo">
                <span className="ead-bullet-objetivo" aria-hidden="true">•</span>
                <span>{objetivo}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Tópicos */}
      <section className="ead-secao" aria-labelledby="titulo-topicos">
        <h2 id="titulo-topicos" className="ead-secao-titulo">
          {TEXTOS_MODULOS_EAD.tituloTopicos}
        </h2>
        <div className="ead-topicos-grade">
          {modulo.topics.map((topico, idxTopico) => (
            <article key={topico.topic_id} className="ead-card-topico">
              <div className="ead-topico-cabecalho">
                <span className="ead-topico-ordem">{`${TEXTOS_MODULOS_EAD.rotuloTopico} ${idxTopico + 1}`}</span>
                <h3 className="ead-topico-titulo">{topico.topic_title}</h3>
              </div>
              <div className="ead-blocos-fluxo">
                {topico.content_blocks.map((bloco, idxBloco) =>
                  renderizarBlocoConteudo(bloco, idxBloco)
                )}
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* Quiz Interativo */}
      <section className="ead-secao" aria-labelledby="titulo-quiz">
        <h2 id="titulo-quiz" className="ead-secao-titulo">
          {TEXTOS_MODULOS_EAD.tituloQuiz}
        </h2>
        <p className="ead-secao-descricao">
          {TEXTOS_MODULOS_EAD.descricaoQuiz}
        </p>

        <div className="ead-quiz-grade">
          {modulo.quiz.map((questao, idxQuestao) => {
            const resultado = verificarResposta(
              questao.correct_index,
              respostas[idxQuestao]
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

                    let classeOpcao = 'ead-quiz-opcao-btn';
                    let rotuloAcessivel = '';

                    if (resultado.respondida) {
                      if (ehAGabarito) {
                        classeOpcao += ' ead-quiz-opcao-correta';
                        rotuloAcessivel = TEXTOS_MODULOS_EAD.opcaoCorreta;
                      } else if (estaSelecionada && !resultado.correta) {
                        classeOpcao += ' ead-quiz-opcao-errada';
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
                    className={`ead-quiz-feedback ${resultado.correta ? 'ead-feedback-acerto' : 'ead-feedback-erro'}`}
                    role="status"
                    aria-live="polite"
                  >
                    <p className="ead-feedback-titulo">
                      {resultado.correta ? TEXTOS_MODULOS_EAD.feedbackAcerto : TEXTOS_MODULOS_EAD.feedbackErro}
                    </p>
                    <p className="ead-feedback-explicacao">{questao.explanation}</p>
                  </div>
                )}
              </fieldset>
            );
          })}
        </div>
      </section>

      {/* Fontes e Referências */}
      <section className="ead-secao" aria-labelledby="titulo-fontes">
        <h2 id="titulo-fontes" className="ead-secao-titulo">
          {TEXTOS_MODULOS_EAD.tituloFontes}
        </h2>
        <div className="ead-fontes-grade">
          {modulo.sources.map((fonte: SourceItem, idxFonte: number) => (
            <article key={idxFonte} className="ead-card-fonte">
              <span className="ead-fonte-tipo">{rotuloTipoFonte(fonte.type)}</span>
              <h4 className="ead-fonte-titulo">{fonte.title}</h4>

              {fonte.institution && (
                <p className="ead-fonte-meta">
                  <strong>{TEXTOS_MODULOS_EAD.metaInstituicao}</strong> {fonte.institution}
                </p>
              )}
              {fonte.author && (
                <p className="ead-fonte-meta">
                  <strong>{TEXTOS_MODULOS_EAD.metaAutor}</strong> {fonte.author}
                </p>
              )}
              {fonte.authors && (
                <p className="ead-fonte-meta">
                  <strong>{TEXTOS_MODULOS_EAD.metaAutores}</strong> {fonte.authors}
                </p>
              )}
              {fonte.edition && (
                <p className="ead-fonte-meta">
                  <strong>{TEXTOS_MODULOS_EAD.metaEdicao}</strong> {fonte.edition}
                  {fonte.chapter && ` — ${fonte.chapter}`}
                </p>
              )}
              {!fonte.edition && fonte.chapter && (
                <p className="ead-fonte-meta">
                  <strong>{TEXTOS_MODULOS_EAD.metaCapitulo}</strong> {fonte.chapter}
                </p>
              )}
              {fonte.source && (
                <p className="ead-fonte-meta">
                  <strong>{TEXTOS_MODULOS_EAD.metaOrigem}</strong> {fonte.source}
                </p>
              )}
              {fonte.note && (
                <p className="ead-fonte-nota">{fonte.note}</p>
              )}
              {fonte.url && (
                <a
                  href={fonte.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ead-fonte-link"
                >
                  {TEXTOS_MODULOS_EAD.linkMaterialOriginal}
                </a>
              )}
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}

export default EadModuloPage;
