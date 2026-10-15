import type { ReactNode } from "react";
import { TEXTOS_MODULOS_EAD } from "../data/textosModulosEad";
import "./ConteudoEad.css";

export interface CartaoTopicoEadProps {
  ordem: number;
  titulo: string;
  children: ReactNode;
}

export function CartaoTopicoEad({ ordem, titulo, children }: CartaoTopicoEadProps) {
  return (
    <article className="ead-card-topico">
      <div className="ead-topico-cabecalho">
        <span className="ead-topico-ordem">{`${TEXTOS_MODULOS_EAD.rotuloTopico} ${ordem}`}</span>
        <h3 className="ead-topico-titulo">{titulo}</h3>
      </div>
      <div className="ead-blocos-fluxo">{children}</div>
    </article>
  );
}

export default CartaoTopicoEad;
