import { BlocoConteudoEad } from "../components/BlocoConteudoEad";
import { CartaoFonteEad } from "../components/CartaoFonteEad";
import { CartaoPromptEstudo } from "../components/CartaoPromptEstudo";
import { CartaoTopicoEad } from "../components/CartaoTopicoEad";
import { ListaMarcadaEad } from "../components/ListaMarcadaEad";
import { QuizEad } from "../components/QuizEad";
import { RodapeFontesEad } from "../components/RodapeFontesEad";
import { VoltarSalaEad } from "../components/VoltarSalaEad";
import {
  rotuloSeloAssunto,
  TEXTOS_ASSUNTOS_ESTUDO,
} from "../data/textosAssuntosEstudo";
import { TEXTOS_MODULOS_EAD } from "../data/textosModulosEad";
import {
  ciclosDoAssunto,
  itemDaFicha,
  mostrarAvisoRascunho,
} from "../lib/assuntosEstudo";
import { fmtData } from "../lib/historico";
import type { AlertBlock, AssuntoEstudo } from "../types/ead";
import "../components/ConteudoEad.css";
import "./EadAssuntoPage.css";

export interface EadAssuntoPageProps {
  assunto: AssuntoEstudo;
  onVoltar?: () => void;
}

export function EadAssuntoPage({ assunto, onVoltar }: EadAssuntoPageProps) {
  const alertaRascunho: AlertBlock = {
    type: "alert",
    level: "warning",
    title: TEXTOS_ASSUNTOS_ESTUDO.tituloAvisoRascunho,
    body: TEXTOS_ASSUNTOS_ESTUDO.corpoAvisoRascunho,
  };

  return (
    <main className="ead-page">
      <VoltarSalaEad onVoltar={onVoltar} />

      {mostrarAvisoRascunho(assunto.review) && (
        <BlocoConteudoEad bloco={alertaRascunho} />
      )}

      <header className="ead-header">
        <span className="ead-badge-modulo">
          {rotuloSeloAssunto(ciclosDoAssunto(assunto.assessment_items))}
        </span>
        <h1 className="ead-titulo-modulo">{assunto.title}</h1>
        <p className="ead-subtitulo-modulo">{assunto.short_description}</p>
      </header>

      {/* Itens da ficha de avaliação */}
      <section className="ead-secao" aria-labelledby="titulo-itens-avaliacao">
        <h2 id="titulo-itens-avaliacao" className="ead-secao-titulo">
          {TEXTOS_ASSUNTOS_ESTUDO.tituloItens}
        </h2>
        <ListaMarcadaEad
          itens={assunto.assessment_items.map((ref) => itemDaFicha(ref).texto)}
        />
      </section>

      {/* Objetivos de Aprendizagem */}
      <section className="ead-secao" aria-labelledby="titulo-objetivos">
        <h2 id="titulo-objetivos" className="ead-secao-titulo">
          {TEXTOS_MODULOS_EAD.tituloObjetivos}
        </h2>
        <ListaMarcadaEad itens={assunto.learning_objectives} />
      </section>

      {/* O que é do técnico e o que é do enfermeiro */}
      <section className="ead-secao" aria-labelledby="titulo-atribuicoes">
        <h2 id="titulo-atribuicoes" className="ead-secao-titulo">
          {TEXTOS_ASSUNTOS_ESTUDO.tituloAtribuicoes}
          {assunto.competence.status && (
            <span className="ead-selo-validacao ead-selo-validacao-titulo">
              {TEXTOS_ASSUNTOS_ESTUDO.seloValidacao}
            </span>
          )}
        </h2>
        <div className="ead-atribuicoes-bloco">
          <div className="ead-atribuicao-item">
            <h3 className="ead-atribuicao-subtitulo">
              {TEXTOS_ASSUNTOS_ESTUDO.subtituloTecnico}
            </h3>
            <ListaMarcadaEad itens={assunto.competence.technician} />
          </div>
          <div className="ead-atribuicao-item">
            <h3 className="ead-atribuicao-subtitulo">
              {TEXTOS_ASSUNTOS_ESTUDO.subtituloEnfermeiro}
            </h3>
            <ListaMarcadaEad itens={assunto.competence.nurse} />
          </div>
          <RodapeFontesEad
            sourceIds={assunto.competence.source_ids}
            todasFontes={assunto.sources}
          />
        </div>
      </section>

      {/* Tópicos */}
      <section className="ead-secao" aria-labelledby="titulo-topicos">
        <h2 id="titulo-topicos" className="ead-secao-titulo">
          {TEXTOS_MODULOS_EAD.tituloTopicos}
        </h2>
        <div className="ead-topicos-grade">
          {assunto.topics.map((topico, idxTopico) => (
            <CartaoTopicoEad
              key={topico.topic_id}
              ordem={idxTopico + 1}
              titulo={topico.topic_title}
            >
              {topico.content_blocks.map((bloco, idxBloco) => (
                <div key={idxBloco} className="ead-bloco-envoltorio">
                  <BlocoConteudoEad bloco={bloco} />
                  <RodapeFontesEad
                    status={bloco.status}
                    sourceIds={bloco.source_ids}
                    todasFontes={assunto.sources}
                  />
                </div>
              ))}
            </CartaoTopicoEad>
          ))}
        </div>
      </section>

      {/* Quiz */}
      <section className="ead-secao" aria-labelledby="titulo-quiz">
        <h2 id="titulo-quiz" className="ead-secao-titulo">
          {TEXTOS_MODULOS_EAD.tituloQuiz}
        </h2>
        <p className="ead-secao-descricao">
          {TEXTOS_MODULOS_EAD.descricaoQuiz}
        </p>
        <QuizEad questoes={assunto.quiz} />
      </section>

      {/* Pesquise com a IA da sua preferência */}
      <section className="ead-secao" aria-labelledby="titulo-ia">
        <h2 id="titulo-ia" className="ead-secao-titulo">
          {TEXTOS_ASSUNTOS_ESTUDO.tituloIA}
        </h2>
        <div className="box ead-box-regras-ia">
          <h3 className="ead-subtitulo-regras-ia">
            {TEXTOS_ASSUNTOS_ESTUDO.subtituloRegrasIA}
          </h3>
          <ListaMarcadaEad
            itens={TEXTOS_ASSUNTOS_ESTUDO.regrasUsoIA}
          />
        </div>
        <div className="ead-prompts-grade">
          {assunto.study_prompts.map((prompt) => (
            <CartaoPromptEstudo key={prompt.id} prompt={prompt} />
          ))}
        </div>
      </section>

      {/* Fontes */}
      <section className="ead-secao" aria-labelledby="titulo-fontes">
        <h2 id="titulo-fontes" className="ead-secao-titulo">
          {TEXTOS_MODULOS_EAD.tituloFontes}
        </h2>
        <div className="ead-fontes-grade">
          {assunto.sources.map((fonte, idxFonte) => (
            <CartaoFonteEad key={fonte.id ?? idxFonte} fonte={fonte} />
          ))}
        </div>
      </section>

      {/* Revisão do conteúdo */}
      <section className="ead-secao" aria-labelledby="titulo-revisao">
        <h2 id="titulo-revisao" className="ead-secao-titulo">
          {TEXTOS_ASSUNTOS_ESTUDO.tituloRevisao}
        </h2>
        <dl className="box ead-revisao-lista">
          <dt className="ead-revisao-item-dt">
            {TEXTOS_ASSUNTOS_ESTUDO.rotuloSituacao}
          </dt>
          <dd className="ead-revisao-item-dd">
            {TEXTOS_ASSUNTOS_ESTUDO.nomesSituacao[assunto.review.status] ??
              assunto.review.status}
          </dd>

          <dt className="ead-revisao-item-dt">
            {TEXTOS_ASSUNTOS_ESTUDO.rotuloVersao}
          </dt>
          <dd className="ead-revisao-item-dd">{assunto.review.version}</dd>

          <dt className="ead-revisao-item-dt">
            {TEXTOS_ASSUNTOS_ESTUDO.rotuloCriadoEm}
          </dt>
          <dd className="ead-revisao-item-dd">
            {fmtData(assunto.review.created_at)}
          </dd>

          <dt className="ead-revisao-item-dt">
            {TEXTOS_ASSUNTOS_ESTUDO.rotuloRevisadoPor}
          </dt>
          <dd className="ead-revisao-item-dd">
            {assunto.review.reviewed_by ??
              TEXTOS_ASSUNTOS_ESTUDO.valorAusenteRevisao}
          </dd>

          <dt className="ead-revisao-item-dt">
            {TEXTOS_ASSUNTOS_ESTUDO.rotuloRevisadoEm}
          </dt>
          <dd className="ead-revisao-item-dd">
            {assunto.review.reviewed_at
              ? fmtData(assunto.review.reviewed_at)
              : TEXTOS_ASSUNTOS_ESTUDO.valorAusenteRevisao}
          </dd>

          <dt className="ead-revisao-item-dt">
            {TEXTOS_ASSUNTOS_ESTUDO.rotuloProximaRevisao}
          </dt>
          <dd className="ead-revisao-item-dd">
            {assunto.review.next_review
              ? fmtData(assunto.review.next_review)
              : TEXTOS_ASSUNTOS_ESTUDO.valorAusenteRevisao}
          </dd>
        </dl>
      </section>
    </main>
  );
}

export default EadAssuntoPage;
