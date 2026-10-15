import { rotuloSeloModulo, TEXTOS_MODULOS_EAD } from "../data/textosModulosEad";
import type { EadModule, EadModuleMetadata } from "../types/ead";
import { BlocoConteudoEad } from "../components/BlocoConteudoEad";
import { CartaoFonteEad } from "../components/CartaoFonteEad";
import { CartaoTopicoEad } from "../components/CartaoTopicoEad";
import { ListaMarcadaEad } from "../components/ListaMarcadaEad";
import { QuizEad } from "../components/QuizEad";
import { VoltarSalaEad } from "../components/VoltarSalaEad";
import "../components/ConteudoEad.css";

export interface EadModuloPageProps {
  metadados: EadModuleMetadata;
  modulo: EadModule;
  onVoltar?: () => void;
}

export function EadModuloPage({ metadados, modulo, onVoltar }: EadModuloPageProps) {
  return (
    <main className="ead-page">
      <VoltarSalaEad onVoltar={onVoltar} />

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
        <ListaMarcadaEad itens={modulo.learning_objectives} />
      </section>

      {/* Tópicos */}
      <section className="ead-secao" aria-labelledby="titulo-topicos">
        <h2 id="titulo-topicos" className="ead-secao-titulo">
          {TEXTOS_MODULOS_EAD.tituloTopicos}
        </h2>
        <div className="ead-topicos-grade">
          {modulo.topics.map((topico, idxTopico) => (
            <CartaoTopicoEad
              key={topico.topic_id}
              ordem={idxTopico + 1}
              titulo={topico.topic_title}
            >
              {topico.content_blocks.map((bloco, idxBloco) => (
                <BlocoConteudoEad key={idxBloco} bloco={bloco} />
              ))}
            </CartaoTopicoEad>
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
        <QuizEad questoes={modulo.quiz} />
      </section>

      {/* Fontes e Referências */}
      <section className="ead-secao" aria-labelledby="titulo-fontes">
        <h2 id="titulo-fontes" className="ead-secao-titulo">
          {TEXTOS_MODULOS_EAD.tituloFontes}
        </h2>
        <div className="ead-fontes-grade">
          {modulo.sources.map((fonte, idxFonte) => (
            <CartaoFonteEad key={idxFonte} fonte={fonte} />
          ))}
        </div>
      </section>
    </main>
  );
}

export default EadModuloPage;
