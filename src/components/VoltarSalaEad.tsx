import { TEXTOS_MODULOS_EAD } from "../data/textosModulosEad";
import "./ConteudoEad.css";

export interface VoltarSalaEadProps {
  onVoltar?: () => void;
}

export function VoltarSalaEad({ onVoltar }: VoltarSalaEadProps) {
  return (
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
  );
}

export default VoltarSalaEad;
