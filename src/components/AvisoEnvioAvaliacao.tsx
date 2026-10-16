import { TEXTOS_ENVIO_AVALIACAO } from "../data/textosEnvioAvaliacao";

export type AvisoEnvio = {
  tipo: "ok" | "err";
  texto: string;
};

type Props = {
  aviso: AvisoEnvio | null;
  onTentarDeNovo?: () => void;
  salvando?: boolean;
  onVerEvolucao?: () => void;
};

export default function AvisoEnvioAvaliacao({
  aviso,
  onTentarDeNovo,
  salvando,
  onVerEvolucao,
}: Props) {
  if (!aviso) return null;

  return (
    <div
      className={`msg${aviso.tipo === "err" ? " err" : ""}`}
      role="status"
      aria-live="polite"
    >
      <span>{aviso.texto}</span>
      {onTentarDeNovo && (
        <>
          {" "}
          <button
            type="button"
            className="btn small"
            onClick={onTentarDeNovo}
            disabled={salvando}
          >
            {TEXTOS_ENVIO_AVALIACAO.botaoNovaTentativa}
          </button>
        </>
      )}
      {aviso.tipo === "ok" && onVerEvolucao && (
        <>
          {" "}
          <button type="button" className="link" onClick={onVerEvolucao}>
            Ver minha evolução
          </button>
        </>
      )}
    </div>
  );
}
