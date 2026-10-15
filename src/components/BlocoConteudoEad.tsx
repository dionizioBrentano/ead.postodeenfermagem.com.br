import { TEXTOS_MODULOS_EAD } from "../data/textosModulosEad";
import { caminhoImagemModulo } from "../lib/modulosEad";
import type { ContentBlock } from "../types/ead";
import "./ConteudoEad.css";

export interface BlocoConteudoEadProps {
  bloco: ContentBlock;
}

export function BlocoConteudoEad({ bloco }: BlocoConteudoEadProps) {
  switch (bloco.type) {
    case "text":
      return (
        <div className="ead-bloco-texto">
          {bloco.title && <h4 className="ead-bloco-subtitulo">{bloco.title}</h4>}
          <p className="ead-bloco-corpo">{bloco.body}</p>
        </div>
      );

    case "alert":
      return (
        <aside
          className={`ead-bloco-alerta ${bloco.level === "warning" ? "ead-alerta-warning" : "ead-alerta-info"}`}
          role="note"
          aria-label={bloco.title}
        >
          <span className="ead-alerta-rotulo">
            {bloco.level === "warning" ? TEXTOS_MODULOS_EAD.alertaWarning : TEXTOS_MODULOS_EAD.alertaInfo}
          </span>
          <strong className="ead-alerta-titulo">{bloco.title}</strong>
          <p className="ead-alerta-corpo">{bloco.body}</p>
        </aside>
      );

    case "checklist":
      return (
        <div className="ead-bloco-checklist">
          {bloco.title && <h4 className="ead-checklist-titulo">{bloco.title}</h4>}
          <ul className="ead-checklist-lista">
            {bloco.items.map((item, idxItem) => (
              <li key={idxItem} className="ead-checklist-item">
                <span className="ead-checklist-icone" aria-hidden="true">
                  ✓
                </span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      );

    case "image":
      return (
        <figure className="ead-bloco-imagem">
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
              <span className="ead-imagem-simbolo" aria-hidden="true">
                {TEXTOS_MODULOS_EAD.recursoVisual}
              </span>
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
}

export default BlocoConteudoEad;
