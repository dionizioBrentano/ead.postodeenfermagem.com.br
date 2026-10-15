import { TEXTOS_ASSUNTOS_ESTUDO, validacaoFonte } from "../data/textosAssuntosEstudo";
import { TEXTOS_MODULOS_EAD } from "../data/textosModulosEad";
import { fmtData } from "../lib/historico";
import { rotuloTipoFonte } from "../lib/modulosEad";
import type { SourceItem } from "../types/ead";
import "./ConteudoEad.css";

export interface CartaoFonteEadProps {
  fonte: SourceItem;
}

export function CartaoFonteEad({ fonte }: CartaoFonteEadProps) {
  const trechoVideo = [fonte.video_start, fonte.video_end]
    .filter(Boolean)
    .join(" – ");

  return (
    <article
      id={fonte.id ? `fonte-${fonte.id}` : undefined}
      className="ead-card-fonte"
    >
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
      {fonte.year && (
        <p className="ead-fonte-meta">
          <strong>{TEXTOS_ASSUNTOS_ESTUDO.metaAno}</strong> {fonte.year}
        </p>
      )}
      {fonte.sections && fonte.sections.length > 0 && (
        <p className="ead-fonte-meta">
          <strong>{TEXTOS_ASSUNTOS_ESTUDO.metaSecoes}</strong>{" "}
          {fonte.sections.join("; ")}
        </p>
      )}
      {fonte.doi && (
        <p className="ead-fonte-meta">
          <strong>{TEXTOS_ASSUNTOS_ESTUDO.metaDoi}</strong>{" "}
          <a
            href={`https://doi.org/${fonte.doi}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            {fonte.doi}
          </a>
        </p>
      )}
      {trechoVideo && (
        <p className="ead-fonte-meta">
          <strong>{TEXTOS_ASSUNTOS_ESTUDO.metaTrechoVideo}</strong> {trechoVideo}
        </p>
      )}
      {fonte.accessed_at && (
        <p className="ead-fonte-meta">
          <strong>{TEXTOS_ASSUNTOS_ESTUDO.metaAcessadoEm}</strong>{" "}
          {fmtData(fonte.accessed_at)}
        </p>
      )}
      {fonte.note && <p className="ead-fonte-nota">{fonte.note}</p>}
      {fonte.validation && (
        <p className="ead-fonte-nota">
          {fonte.validation.status === "validada"
            ? validacaoFonte(
                fonte.validation.validated_at
                  ? fmtData(fonte.validation.validated_at)
                  : "",
                fonte.validation.validated_by ?? "",
              )
            : TEXTOS_ASSUNTOS_ESTUDO.validacaoPendente}
        </p>
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
  );
}

export default CartaoFonteEad;
