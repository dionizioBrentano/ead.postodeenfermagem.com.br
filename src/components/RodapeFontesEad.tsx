import { TEXTOS_ASSUNTOS_ESTUDO } from "../data/textosAssuntosEstudo";
import { fontesPorIds } from "../lib/assuntosEstudo";
import type { BlockMeta, SourceItem } from "../types/ead";
import "./ConteudoEad.css";

export interface RodapeFontesEadProps {
  status?: BlockMeta["status"];
  sourceIds?: readonly string[];
  todasFontes: readonly SourceItem[];
}

export function RodapeFontesEad({
  status,
  sourceIds,
  todasFontes,
}: RodapeFontesEadProps) {
  const fontes = fontesPorIds(sourceIds, todasFontes);

  return (
    <footer className="ead-bloco-rodape">
      {status && (
        <span className="ead-selo-validacao">
          {TEXTOS_ASSUNTOS_ESTUDO.seloValidacao}
        </span>
      )}
      {fontes.length > 0 ? (
        <span className="ead-bloco-fontes">
          <span className="ead-bloco-fonte-rotulo">
            {TEXTOS_ASSUNTOS_ESTUDO.rotuloFonteBloco}
          </span>{" "}
          {fontes.map((f, idx) => (
            <span key={f.id ?? idx}>
              {idx > 0 && TEXTOS_ASSUNTOS_ESTUDO.separadorFontes}
              <a
                href={f.id ? `#fonte-${f.id}` : "#"}
                className="ead-bloco-fonte-link"
              >
                {f.short_label || f.title}
              </a>
            </span>
          ))}
        </span>
      ) : (
        <span className="ead-bloco-fonte-pendente">
          {TEXTOS_ASSUNTOS_ESTUDO.fonteAusente}
        </span>
      )}
    </footer>
  );
}

export default RodapeFontesEad;
